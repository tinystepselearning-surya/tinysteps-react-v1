import { describe, expect, it, vi } from 'vitest';
import {
  MICROSOFT_GRAPH_SCOPE,
  MicrosoftGraphClient,
  MicrosoftGraphError,
} from '../src/attendanceValidation/microsoftGraphClient';

const credentials = {
  tenantId: 'tenant-123',
  clientId: 'client-456',
  clientSecret: 'secret+value/with symbols',
};

function jsonResponse(body: unknown, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...headers,
    },
  });
}

function textResponse(body: string, status = 200, headers: Record<string, string> = {}): Response {
  return new Response(body, { status, headers });
}

function tokenResponse(token = 'token-123', expiresIn = 3600): Response {
  return jsonResponse({ access_token: token, expires_in: expiresIn });
}

function asFetch(mock: ReturnType<typeof vi.fn>): typeof fetch {
  return mock as unknown as typeof fetch;
}

describe('MicrosoftGraphClient', () => {
  it('uses client credentials and resolves a meeting by an encoded join URL', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(jsonResponse({
        value: [{ id: 'meeting-1', subject: 'Class', joinWebUrl: "https://teams.microsoft.com/l/meetup-join/a'b" }],
      }));

    const client = new MicrosoftGraphClient({
      credentials,
      fetchImpl: asFetch(fetchMock),
      now: () => 1_000,
    });

    const meeting = await client.resolveOnlineMeetingByJoinUrl(
      'organizer user',
      "https://teams.microsoft.com/l/meetup-join/a'b",
    );

    expect(meeting?.id).toBe('meeting-1');
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const tokenUrl = String(fetchMock.mock.calls[0][0]);
    const tokenInit = fetchMock.mock.calls[0][1] as RequestInit;
    expect(tokenUrl).toBe('https://login.microsoftonline.com/tenant-123/oauth2/v2.0/token');
    expect(tokenInit.method).toBe('POST');

    const tokenBody = new URLSearchParams(String(tokenInit.body));
    expect(tokenBody.get('client_id')).toBe(credentials.clientId);
    expect(tokenBody.get('client_secret')).toBe(credentials.clientSecret);
    expect(tokenBody.get('grant_type')).toBe('client_credentials');
    expect(tokenBody.get('scope')).toBe(MICROSOFT_GRAPH_SCOPE);

    const graphUrl = new URL(String(fetchMock.mock.calls[1][0]));
    expect(graphUrl.pathname).toBe('/v1.0/users/organizer%20user/onlineMeetings');
    expect(graphUrl.searchParams.get('$filter')).toBe(
      "JoinWebUrl eq 'https://teams.microsoft.com/l/meetup-join/a''b'",
    );

    const graphInit = fetchMock.mock.calls[1][1] as RequestInit;
    const graphHeaders = new Headers(graphInit.headers);
    expect(graphHeaders.get('Authorization')).toBe('Bearer token-123');
  });

  it('resolves a short Teams meeting link by numeric meeting ID', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(jsonResponse({
        value: [{ id: 'meeting-short', subject: 'Kabir Jindal-early Phonics' }],
      }));

    const client = new MicrosoftGraphClient({
      credentials,
      fetchImpl: asFetch(fetchMock),
      now: () => 1_000,
    });

    const meeting = await client.resolveOnlineMeetingByJoinUrl(
      'organizer',
      'https://teams.microsoft.com/meet/48543659205152?p=example',
    );

    expect(meeting?.id).toBe('meeting-short');
    const graphUrl = new URL(String(fetchMock.mock.calls[1][0]));
    expect(graphUrl.searchParams.get('$filter')).toBe(
      "joinMeetingIdSettings/joinMeetingId eq '48543659205152'",
    );
  });

  it('reuses the cached token across transcript and attendance artifact reads', async () => {
    const intervals = [
      {
        joinDateTime: '2026-09-16T10:00:00Z',
        leaveDateTime: '2026-09-16T10:12:00Z',
        durationInSeconds: 720,
      },
      {
        joinDateTime: '2026-09-16T10:14:00Z',
        leaveDateTime: '2026-09-16T10:35:00Z',
        durationInSeconds: 1260,
      },
    ];
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(jsonResponse({ value: [{ id: 'transcript-1' }] }))
      .mockResolvedValueOnce(jsonResponse({ value: [{ id: 'report-1', totalParticipantCount: 2 }] }))
      .mockResolvedValueOnce(jsonResponse({ value: [{ id: 'record-1', totalAttendanceInSeconds: 1980, attendanceIntervals: intervals }] }));

    const client = new MicrosoftGraphClient({
      credentials,
      fetchImpl: asFetch(fetchMock),
      now: () => 10_000,
    });

    const transcripts = await client.listTranscripts('organizer', 'meeting/id', 10);
    const reports = await client.listAttendanceReports('organizer', 'meeting/id');
    const records = await client.listAttendanceRecords('organizer', 'meeting/id', 'report/id');

    expect(transcripts.value[0].id).toBe('transcript-1');
    expect(reports.value[0].id).toBe('report-1');
    expect(records.value[0]).toMatchObject({
      id: 'record-1',
      totalAttendanceInSeconds: 1980,
      attendanceIntervals: intervals,
    });
    expect(fetchMock).toHaveBeenCalledTimes(4);

    expect(String(fetchMock.mock.calls[1][0])).toContain(
      '/users/organizer/onlineMeetings/meeting%2Fid/transcripts?%24top=10',
    );
    expect(String(fetchMock.mock.calls[2][0])).toContain(
      '/users/organizer/onlineMeetings/meeting%2Fid/attendanceReports',
    );
    expect(String(fetchMock.mock.calls[3][0])).toContain(
      '/users/organizer/onlineMeetings/meeting%2Fid/attendanceReports/report%2Fid/attendanceRecords',
    );
  });

  it('honors Retry-After for rate limits and keeps retrying read-only requests within bounds', async () => {
    const sleep = vi.fn().mockResolvedValue(undefined);
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(jsonResponse(
        { error: { code: 'TooManyRequests', message: 'Slow down' } },
        429,
        { 'Retry-After': '2' },
      ))
      .mockResolvedValueOnce(jsonResponse({ value: [{ id: 'report-after-retry' }] }));

    const client = new MicrosoftGraphClient({
      credentials,
      fetchImpl: asFetch(fetchMock),
      sleep,
      now: () => 20_000,
      maxAttempts: 3,
    });

    const reports = await client.listAttendanceReports('organizer', 'meeting');

    expect(reports.value[0].id).toBe('report-after-retry');
    expect(sleep).toHaveBeenCalledOnce();
    expect(sleep).toHaveBeenCalledWith(2_000);
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });

  it('classifies a missing application access policy instead of treating it as absence evidence', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(jsonResponse({
        error: {
          code: 'Forbidden',
          message: 'No application access policy found for this app',
        },
      }, 403));

    const client = new MicrosoftGraphClient({
      credentials,
      fetchImpl: asFetch(fetchMock),
    });

    await expect(client.listAttendanceReports('organizer', 'meeting')).rejects.toMatchObject({
      kind: 'application_access_policy_missing',
      status: 403,
    });
  });

  it('classifies tenant-disabled transcript API access explicitly', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(jsonResponse({
        error: {
          code: 'Forbidden',
          message: 'Transcript access is disabled',
          innerError: { code: 'GraphAccessToTranscriptsDisabled' },
        },
      }, 403));

    const client = new MicrosoftGraphClient({
      credentials,
      fetchImpl: asFetch(fetchMock),
    });

    try {
      await client.listTranscripts('organizer', 'meeting');
      throw new Error('Expected listTranscripts to fail');
    } catch (error) {
      expect(error).toBeInstanceOf(MicrosoftGraphError);
      expect(error).toMatchObject({
        kind: 'transcript_access_disabled',
        innerCode: 'GraphAccessToTranscriptsDisabled',
      });
    }
  });

  it('falls back to unattributed transcript text only when speaker attribution is disallowed', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(jsonResponse({
        error: {
          code: 'Forbidden',
          message: 'Speaker attribution is disabled',
          innerError: { code: 'SpeakerAttributionNotAllowed' },
        },
      }, 403))
      .mockResolvedValueOnce(textResponse(
        '00:00:00.000 --> 00:00:01.000\nHello',
        200,
        { 'Content-Type': 'application/vnd.microsoft.graph.transcript+text' },
      ));

    const client = new MicrosoftGraphClient({
      credentials,
      fetchImpl: asFetch(fetchMock),
    });

    const transcript = await client.getTranscriptContent('organizer', 'meeting', 'transcript');

    expect(transcript.attributed).toBe(false);
    expect(transcript.content).toContain('Hello');

    const attributedHeaders = new Headers((fetchMock.mock.calls[1][1] as RequestInit).headers);
    const unattributedHeaders = new Headers((fetchMock.mock.calls[2][1] as RequestInit).headers);
    expect(attributedHeaders.get('Accept')).toBe('text/vtt');
    expect(unattributedHeaders.get('Accept')).toBe('application/vnd.microsoft.graph.transcript+text');
  });

  it('rejects ambiguous meeting resolution instead of guessing a session identity', async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(jsonResponse({
        value: [{ id: 'meeting-a' }, { id: 'meeting-b' }],
      }));

    const client = new MicrosoftGraphClient({
      credentials,
      fetchImpl: asFetch(fetchMock),
    });

    await expect(
      client.resolveOnlineMeetingByJoinUrl('organizer', 'https://teams.microsoft.com/example'),
    ).rejects.toMatchObject({
      kind: 'ambiguous_result',
      status: 409,
    });
  });
});
