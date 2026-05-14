import { createSign } from 'crypto';

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
    const response = await fetch(`https://${host}/3/device/${payload.deviceToken}`, {
      method: 'POST',
      headers: {
        authorization: `bearer ${jwt}`,
        'apns-topic': config.bundleId,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      },
      body: requestBody,
    });

    const rawText = await response.text();
    const reason = parseReason(rawText);
    const outcome: ApnsSendOutcome = {
      ok: response.ok,
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
