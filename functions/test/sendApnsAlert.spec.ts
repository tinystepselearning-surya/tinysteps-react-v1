import { EventEmitter } from 'node:events';
import { generateKeyPairSync } from 'node:crypto';
import type { IncomingHttpHeaders, OutgoingHttpHeaders } from 'node:http2';
import { afterAll, beforeEach, describe, expect, it, vi } from 'vitest';

const { connectMock } = vi.hoisted(() => ({
  connectMock: vi.fn(),
}));

vi.mock('node:http2', () => {
  const mockedHttp2 = {
    connect: connectMock,
    constants: { NGHTTP2_CANCEL: 8 },
  };
  return {
    ...mockedHttp2,
    default: mockedHttp2,
  };
});

import { buildApnsPayload, sendApnsAlert } from '../src/lib/sendApnsAlert';

type ResponseFixture = {
  status: number;
  body?: string;
};

class FakeRequest extends EventEmitter {
  readonly close = vi.fn();
  readonly setTimeout = vi.fn(() => this);
  readonly end = vi.fn<(body: string) => void>();
}

class FakeSession extends EventEmitter {
  readonly close = vi.fn();
  readonly destroy = vi.fn();
  readonly requests: Array<{ headers: OutgoingHttpHeaders; request: FakeRequest }> = [];

  constructor(private readonly response?: ResponseFixture) {
    super();
  }

  request = vi.fn((headers: OutgoingHttpHeaders) => {
    const request = new FakeRequest();
    request.end.mockImplementation(() => {
      if (!this.response) return;
      request.emit('response', {
        ':status': this.response.status,
      } satisfies IncomingHttpHeaders);
      if (this.response.body) request.emit('data', Buffer.from(this.response.body));
      request.emit('end');
    });
    this.requests.push({ headers, request });
    return request;
  });
}

const originalEnvironment = { ...process.env };
const privateKey = generateKeyPairSync('ec', { namedCurve: 'P-256' })
  .privateKey.export({ type: 'pkcs8', format: 'pem' })
  .toString();

const payload = {
  deviceToken: '0123456789abcdef',
  title: 'Class update',
  body: 'Your class starts soon.',
  threadId: 'thread-1',
  data: { threadId: 'thread-1', messageId: 'message-1' },
};

beforeEach(() => {
  connectMock.mockReset();
  process.env.APNS_TEAM_ID = 'TEAM123';
  process.env.APNS_KEY_ID = 'KEY123';
  process.env.APNS_PRIVATE_KEY = privateKey;
  process.env.APNS_BUNDLE_ID = 'com.example.tinysteps';
  process.env.APNS_ENV = 'production';
});

afterAll(() => {
  process.env = originalEnvironment;
});

describe('sendApnsAlert HTTP/2 transport', () => {
  it.each([0, 1, 23])('builds an exact APNs badge value of %s', (badge) => {
    expect(buildApnsPayload({
      deviceToken: 'token',
      badge,
      data: { type: 'badge_sync' },
    })).toEqual({
      aps: {
        badge,
        'thread-id': 'tinysteps',
      },
      type: 'badge_sync',
    });
  });

  it('omits badge and conditionally includes visible alert content', () => {
    expect(buildApnsPayload({
      deviceToken: 'token',
      title: 'New message',
      body: 'Hello',
      data: { threadId: 'thread-23' },
    })).toEqual({
      aps: {
        alert: { title: 'New message', body: 'Hello' },
        sound: 'default',
        'thread-id': 'thread-23',
      },
      threadId: 'thread-23',
    });
    expect(buildApnsPayload({
      deviceToken: 'token',
      badge: 3,
      data: { sessionId: 'session-3' },
    })).toEqual({
      aps: {
        badge: 3,
        'thread-id': 'session-3',
      },
      sessionId: 'session-3',
    });
  });

  it('sends the APNs alert over HTTP/2 and returns a successful response', async () => {
    const session = new FakeSession({ status: 200 });
    connectMock.mockReturnValue(session);

    const outcome = await sendApnsAlert(payload);

    expect(outcome).toEqual({
      ok: true,
      status: 200,
      reason: undefined,
      host: 'api.push.apple.com',
      environment: 'production',
    });
    expect(connectMock).toHaveBeenCalledWith('https://api.push.apple.com');
    expect(session.requests[0].headers).toMatchObject({
      ':method': 'POST',
      ':path': `/3/device/${payload.deviceToken}`,
      'apns-topic': 'com.example.tinysteps',
      'apns-push-type': 'alert',
      'apns-priority': '10',
      'content-type': 'application/json',
    });
    expect(session.requests[0].headers.authorization).toMatch(/^bearer [^.]+\.[^.]+\.[^.]+$/);
    expect(session.requests[0].request.setTimeout).toHaveBeenCalledWith(
      15_000,
      expect.any(Function),
    );
  });

  it('parses an APNs JSON error reason', async () => {
    const session = new FakeSession({
      status: 410,
      body: JSON.stringify({ reason: 'Unregistered' }),
    });
    connectMock.mockReturnValue(session);

    await expect(sendApnsAlert(payload)).resolves.toMatchObject({
      ok: false,
      status: 410,
      reason: 'Unregistered',
      host: 'api.push.apple.com',
    });
  });

  it('rejects a connection exception and destroys the session', async () => {
    const session = new FakeSession();
    connectMock.mockImplementation(() => {
      queueMicrotask(() => session.emit('error', new Error('connection refused')));
      return session;
    });

    await expect(sendApnsAlert(payload)).rejects.toThrow('connection refused');
    expect(session.requests[0].request.close).toHaveBeenCalled();
    expect(session.destroy).toHaveBeenCalledOnce();
    expect(session.close).not.toHaveBeenCalled();
  });

  it('falls back from the production host to the sandbox host', async () => {
    process.env.APNS_ENV = 'auto';
    const productionSession = new FakeSession({
      status: 400,
      body: JSON.stringify({ reason: 'BadDeviceToken' }),
    });
    const sandboxSession = new FakeSession({ status: 200 });
    connectMock
      .mockReturnValueOnce(productionSession)
      .mockReturnValueOnce(sandboxSession);

    await expect(sendApnsAlert(payload)).resolves.toMatchObject({
      ok: true,
      status: 200,
      host: 'api.sandbox.push.apple.com',
      environment: 'auto',
    });
    expect(connectMock.mock.calls.map(([origin]) => origin)).toEqual([
      'https://api.push.apple.com',
      'https://api.sandbox.push.apple.com',
    ]);
  });

  it('closes every request and session after responses, including fallback', async () => {
    process.env.APNS_ENV = 'auto';
    const productionSession = new FakeSession({
      status: 400,
      body: JSON.stringify({ reason: 'DeviceTokenNotForTopic' }),
    });
    const sandboxSession = new FakeSession({ status: 200 });
    connectMock
      .mockReturnValueOnce(productionSession)
      .mockReturnValueOnce(sandboxSession);

    await sendApnsAlert(payload);

    for (const session of [productionSession, sandboxSession]) {
      expect(session.requests[0].request.close).toHaveBeenCalledOnce();
      expect(session.close).toHaveBeenCalledOnce();
      expect(session.destroy).not.toHaveBeenCalled();
    }
  });
});
