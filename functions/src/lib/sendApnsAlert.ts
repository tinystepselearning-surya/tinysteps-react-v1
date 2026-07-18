import { createSign } from 'crypto';
import { connect, constants } from 'node:http2';
import type {
  ClientHttp2Session,
  ClientHttp2Stream,
  IncomingHttpHeaders,
  OutgoingHttpHeaders,
} from 'node:http2';

type ApnsEnvironment = 'development' | 'production' | 'auto';

export type ApnsAlertPayload = {
  deviceToken: string;
  title: string;
  body: string;
  threadId?: string;
  data: Record<string, string>;
};

export type ApnsSendOutcome = {
  ok: boolean;
  status: number;
  reason?: string;
  host?: string;
  environment?: ApnsEnvironment;
};

type ApnsConfig = {
  teamId: string;
  keyId: string;
  privateKey: string;
  bundleId: string;
  environment: ApnsEnvironment;
};

const DEFAULT_BUNDLE_ID = 'com.tinystepslearning.app';
const APNS_REQUEST_TIMEOUT_MS = 15_000;

const toBase64Url = (input: Buffer | string): string =>
  Buffer.from(input)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/g, '');

const parseEnvironment = (value: unknown): ApnsEnvironment => {
  const normalized = String(value || '').trim().toLowerCase();
  if (normalized === 'development' || normalized === 'sandbox') return 'development';
  if (normalized === 'production') return 'production';
  return 'auto';
};

const readConfig = (): ApnsConfig | null => {
  const teamId = String(process.env.APNS_TEAM_ID || '').trim();
  const keyId = String(process.env.APNS_KEY_ID || '').trim();
  const privateKey = String(process.env.APNS_PRIVATE_KEY || '').replace(/\\n/g, '\n').trim();
  const bundleId = String(process.env.APNS_BUNDLE_ID || process.env.IOS_BUNDLE_ID || DEFAULT_BUNDLE_ID).trim();
  const environment = parseEnvironment(process.env.APNS_ENV);

  if (!teamId || !keyId || !privateKey || !bundleId) return null;
  return { teamId, keyId, privateKey, bundleId, environment };
};

const createJwt = (config: ApnsConfig): string => {
  const header = toBase64Url(
    JSON.stringify({
      alg: 'ES256',
      kid: config.keyId,
      typ: 'JWT',
    }),
  );

  const claims = toBase64Url(
    JSON.stringify({
      iss: config.teamId,
      iat: Math.floor(Date.now() / 1000),
    }),
  );

  const unsigned = `${header}.${claims}`;
  const signer = createSign('SHA256');
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign({
    key: config.privateKey,
    dsaEncoding: 'ieee-p1363',
  });

  return `${unsigned}.${toBase64Url(signature)}`;
};

const parseReason = (raw: string): string | undefined => {
  try {
    const parsed = JSON.parse(raw) as { reason?: unknown };
    if (typeof parsed.reason === 'string' && parsed.reason.trim()) {
      return parsed.reason.trim();
    }
  } catch {
    // Ignore parse errors.
  }
  return undefined;
};

const resolveHosts = (environment: ApnsEnvironment): string[] => {
  if (environment === 'production') return ['api.push.apple.com'];
  if (environment === 'development') return ['api.sandbox.push.apple.com'];
  return ['api.push.apple.com', 'api.sandbox.push.apple.com'];
};

const shouldTryNextHost = (reason: string | undefined, status: number): boolean => {
  if (status !== 400) return false;
  return reason === 'BadDeviceToken' || reason === 'DeviceTokenNotForTopic';
};

type ApnsHttp2Response = {
  status: number;
  body: string;
};

const sendHttp2Request = (
  host: string,
  deviceToken: string,
  jwt: string,
  bundleId: string,
  requestBody: string,
): Promise<ApnsHttp2Response> =>
  new Promise((resolve, reject) => {
    let session: ClientHttp2Session | undefined;
    let request: ClientHttp2Stream | undefined;
    let settled = false;
    let status = 0;
    const responseChunks: Buffer[] = [];

    const closeAfterResponse = () => {
      request?.close();
      session?.close();
    };

    const destroyAfterError = () => {
      request?.close(constants.NGHTTP2_CANCEL);
      session?.destroy();
    };

    const fail = (error: Error) => {
      if (settled) return;
      settled = true;
      destroyAfterError();
      reject(error);
    };

    try {
      session = connect(`https://${host}`);
      session.once('error', fail);

      const headers: OutgoingHttpHeaders = {
        ':method': 'POST',
        ':path': `/3/device/${deviceToken}`,
        authorization: `bearer ${jwt}`,
        'apns-topic': bundleId,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      };
      request = session.request(headers);

      request.setTimeout(APNS_REQUEST_TIMEOUT_MS, () => {
        fail(new Error(`APNs request timed out after ${APNS_REQUEST_TIMEOUT_MS}ms`));
      });
      request.once('error', fail);
      request.on('response', (responseHeaders: IncomingHttpHeaders) => {
        const responseStatus = responseHeaders[':status'];
        status = typeof responseStatus === 'number' ? responseStatus : 0;
      });
      request.on('data', (chunk: Buffer | string) => {
        responseChunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      });
      request.once('end', () => {
        if (settled) return;
        settled = true;
        closeAfterResponse();
        resolve({
          status,
          body: Buffer.concat(responseChunks).toString('utf8'),
        });
      });

      request.end(requestBody);
    } catch (error) {
      fail(error instanceof Error ? error : new Error(String(error)));
    }
  });

export const isApnsInvalidTokenReason = (reason: string | undefined): boolean =>
  reason === 'BadDeviceToken' ||
  reason === 'Unregistered' ||
  reason === 'DeviceTokenNotForTopic';

export const hasApnsConfiguration = (): boolean => Boolean(readConfig());

export async function sendApnsAlert(payload: ApnsAlertPayload): Promise<ApnsSendOutcome> {
  const config = readConfig();
  if (!config) {
    throw new Error('APNs configuration is missing');
  }

  const jwt = createJwt(config);
  const requestBody = JSON.stringify({
    aps: {
      alert: {
        title: payload.title,
        body: payload.body,
      },
      sound: 'default',
      badge: 1,
      'thread-id': payload.threadId || payload.data.threadId || 'tinysteps-messages',
    },
    ...payload.data,
  });

  const hosts = resolveHosts(config.environment);
  let lastOutcome: ApnsSendOutcome = {
    ok: false,
    status: 0,
    environment: config.environment,
  };

  for (const host of hosts) {
    const response = await sendHttp2Request(
      host,
      payload.deviceToken,
      jwt,
      config.bundleId,
      requestBody,
    );
    const reason = parseReason(response.body);
    const outcome: ApnsSendOutcome = {
      ok: response.status >= 200 && response.status < 300,
      status: response.status,
      reason,
      host,
      environment: config.environment,
    };

    if (outcome.ok) return outcome;

    lastOutcome = outcome;
    if (!shouldTryNextHost(reason, response.status)) {
      break;
    }
  }

  return lastOutcome;
}
