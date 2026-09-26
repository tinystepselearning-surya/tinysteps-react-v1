export const MICROSOFT_GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';
export const MICROSOFT_GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
export const MICROSOFT_GRAPH_APPLICATION_PERMISSIONS = [
  'OnlineMeetings.Read.All',
  'OnlineMeetingTranscript.Read.All',
  'OnlineMeetingArtifact.Read.All',
] as const;

export type MicrosoftGraphErrorKind =
  | 'invalid_configuration'
  | 'token_exchange_failed'
  | 'unauthorized'
  | 'forbidden'
  | 'application_access_policy_missing'
  | 'transcript_access_disabled'
  | 'speaker_attribution_not_allowed'
  | 'not_found'
  | 'rate_limited'
  | 'transient'
  | 'graph_error'
  | 'ambiguous_result';

export interface MicrosoftGraphAppCredentials {
  tenantId: string;
  clientId: string;
  clientSecret: string;
}

export interface GraphCollection<T> {
  value: T[];
  '@odata.nextLink'?: string;
}

export interface GraphOnlineMeeting {
  id: string;
  subject?: string;
  joinWebUrl?: string;
  startDateTime?: string;
  endDateTime?: string;
  creationDateTime?: string;
  meetingType?: string;
}

export interface GraphCallTranscript {
  id: string;
  meetingId?: string;
  callId?: string;
  contentCorrelationId?: string;
  createdDateTime?: string;
  endDateTime?: string;
  transcriptContentUrl?: string;
}

export interface GraphMeetingAttendanceReport {
  id: string;
  meetingStartDateTime?: string;
  meetingEndDateTime?: string;
  totalParticipantCount?: number;
}

export interface GraphAttendanceInterval {
  joinDateTime?: string;
  leaveDateTime?: string;
  durationInSeconds?: number;
}

export interface GraphAttendanceRecord {
  id: string;
  emailAddress?: string;
  role?: string;
  totalAttendanceInSeconds?: number;
  attendanceIntervals?: GraphAttendanceInterval[];
  identity?: unknown;
}

export interface TranscriptContent {
  contentType: string;
  content: string;
  attributed: boolean;
}

interface TokenPayload {
  access_token?: string;
  expires_in?: number;
}

interface GraphErrorPayload {
  error?: {
    code?: string;
    message?: string;
    innerError?: {
      code?: string;
      [key: string]: unknown;
    };
  };
}

export class MicrosoftGraphError extends Error {
  readonly kind: MicrosoftGraphErrorKind;
  readonly status: number | null;
  readonly graphCode: string | null;
  readonly innerCode: string | null;
  readonly retryAfterMs: number | null;

  constructor(args: {
    kind: MicrosoftGraphErrorKind;
    message: string;
    status?: number | null;
    graphCode?: string | null;
    innerCode?: string | null;
    retryAfterMs?: number | null;
  }) {
    super(args.message);
    this.name = 'MicrosoftGraphError';
    this.kind = args.kind;
    this.status = args.status ?? null;
    this.graphCode = args.graphCode ?? null;
    this.innerCode = args.innerCode ?? null;
    this.retryAfterMs = args.retryAfterMs ?? null;
  }
}

export interface MicrosoftGraphClientOptions {
  credentials: MicrosoftGraphAppCredentials;
  fetchImpl?: typeof fetch;
  sleep?: (milliseconds: number) => Promise<void>;
  now?: () => number;
  maxAttempts?: number;
  graphBaseUrl?: string;
}

interface CachedToken {
  value: string;
  expiresAtMs: number;
}

const DEFAULT_MAX_ATTEMPTS = 3;
const MAX_MAX_ATTEMPTS = 5;
const TOKEN_EXPIRY_SKEW_MS = 60_000;
const DEFAULT_TOKEN_TTL_SECONDS = 3_600;

function requiredString(value: string, name: string): string {
  const normalized = String(value ?? '').trim();
  if (!normalized) {
    throw new MicrosoftGraphError({
      kind: 'invalid_configuration',
      message: `Microsoft Graph ${name} is required.`,
    });
  }
  return normalized;
}

function pathSegment(value: string): string {
  return encodeURIComponent(requiredString(value, 'path identifier'));
}

function odataString(value: string): string {
  return String(value).replace(/'/g, "''");
}

function teamsMeetingIdFromJoinUrl(value: string): string | null {
  try {
    const url = new URL(value);
    const hostname = url.hostname.toLowerCase();
    if (hostname !== 'teams.microsoft.com' && !hostname.endsWith('.teams.microsoft.com')) {
      return null;
    }
    const match = /^\/meet\/(\d+)\/?$/i.exec(url.pathname);
    return match?.[1] ?? null;
  } catch {
    return null;
  }
}

function boundedTop(value: number | undefined, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.min(100, Math.max(1, Math.trunc(value as number)));
}

function defaultSleep(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds));
}

function parseRetryAfterMs(headerValue: string | null, nowMs: number): number | null {
  if (!headerValue) return null;

  const seconds = Number(headerValue);
  if (Number.isFinite(seconds) && seconds >= 0) {
    return Math.round(seconds * 1000);
  }

  const dateMs = Date.parse(headerValue);
  if (Number.isFinite(dateMs)) {
    return Math.max(0, dateMs - nowMs);
  }

  return null;
}

function classifyGraphError(
  status: number,
  graphCode: string | null,
  innerCode: string | null,
  message: string,
): MicrosoftGraphErrorKind {
  if (innerCode === 'GraphAccessToTranscriptsDisabled') return 'transcript_access_disabled';
  if (innerCode === 'SpeakerAttributionNotAllowed') return 'speaker_attribution_not_allowed';
  if (
    status === 403 &&
    /no application access policy found for this app/i.test(message)
  ) {
    return 'application_access_policy_missing';
  }
  if (status === 401) return 'unauthorized';
  if (status === 403) return 'forbidden';
  if (status === 404) return 'not_found';
  if (status === 429) return 'rate_limited';
  if (status >= 500) return 'transient';
  if (graphCode) return 'graph_error';
  return 'graph_error';
}

async function readGraphError(
  response: Response,
  nowMs: number,
): Promise<MicrosoftGraphError> {
  let payload: GraphErrorPayload | null = null;
  try {
    payload = JSON.parse(await response.text()) as GraphErrorPayload;
  } catch {
    payload = null;
  }

  const graphCode = payload?.error?.code ?? null;
  const innerCode = payload?.error?.innerError?.code ?? null;
  const graphMessage = String(payload?.error?.message ?? '').trim();
  const retryAfterMs = parseRetryAfterMs(response.headers.get('retry-after'), nowMs);
  const kind = classifyGraphError(response.status, graphCode, innerCode, graphMessage);

  return new MicrosoftGraphError({
    kind,
    status: response.status,
    graphCode,
    innerCode,
    retryAfterMs,
    message: graphMessage || `Microsoft Graph request failed with HTTP ${response.status}.`,
  });
}

function shouldRetry(error: MicrosoftGraphError): boolean {
  return error.kind === 'rate_limited' || error.kind === 'transient';
}

export class MicrosoftGraphClient {
  private readonly credentials: MicrosoftGraphAppCredentials;
  private readonly fetchImpl: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;
  private readonly now: () => number;
  private readonly maxAttempts: number;
  private readonly graphBaseUrl: string;
  private cachedToken: CachedToken | null = null;

  constructor(options: MicrosoftGraphClientOptions) {
    this.credentials = {
      tenantId: requiredString(options.credentials.tenantId, 'tenantId'),
      clientId: requiredString(options.credentials.clientId, 'clientId'),
      clientSecret: requiredString(options.credentials.clientSecret, 'clientSecret'),
    };
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.sleep = options.sleep ?? defaultSleep;
    this.now = options.now ?? Date.now;
    this.maxAttempts = Math.min(
      MAX_MAX_ATTEMPTS,
      Math.max(1, Math.trunc(options.maxAttempts ?? DEFAULT_MAX_ATTEMPTS)),
    );
    this.graphBaseUrl = String(options.graphBaseUrl ?? MICROSOFT_GRAPH_BASE_URL).replace(/\/$/, '');
  }

  private invalidateToken(): void {
    this.cachedToken = null;
  }

  private async getAccessToken(forceRefresh = false): Promise<string> {
    const nowMs = this.now();
    if (
      !forceRefresh &&
      this.cachedToken &&
      this.cachedToken.expiresAtMs - TOKEN_EXPIRY_SKEW_MS > nowMs
    ) {
      return this.cachedToken.value;
    }

    const tenant = encodeURIComponent(this.credentials.tenantId);
    const tokenUrl = `https://login.microsoftonline.com/${tenant}/oauth2/v2.0/token`;
    const body = new URLSearchParams({
      client_id: this.credentials.clientId,
      client_secret: this.credentials.clientSecret,
      grant_type: 'client_credentials',
      scope: MICROSOFT_GRAPH_SCOPE,
    });

    const response = await this.fetchImpl(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new MicrosoftGraphError({
        kind: 'token_exchange_failed',
        status: response.status,
        message: `Microsoft identity token exchange failed with HTTP ${response.status}.`,
      });
    }

    const payload = (await response.json()) as TokenPayload;
    const token = String(payload.access_token ?? '').trim();
    if (!token) {
      throw new MicrosoftGraphError({
        kind: 'token_exchange_failed',
        status: response.status,
        message: 'Microsoft identity token exchange returned no access token.',
      });
    }

    const expiresIn = Number(payload.expires_in ?? DEFAULT_TOKEN_TTL_SECONDS);
    const ttlSeconds = Number.isFinite(expiresIn) && expiresIn > 0
      ? expiresIn
      : DEFAULT_TOKEN_TTL_SECONDS;

    this.cachedToken = {
      value: token,
      expiresAtMs: nowMs + (ttlSeconds * 1000),
    };
    return token;
  }

  private async graphResponse(
    path: string,
    init: RequestInit = {},
  ): Promise<Response> {
    let lastError: MicrosoftGraphError | null = null;

    for (let attempt = 1; attempt <= this.maxAttempts; attempt += 1) {
      const token = await this.getAccessToken(attempt > 1 && lastError?.kind === 'unauthorized');
      const headers = new Headers(init.headers ?? {});
      headers.set('Authorization', `Bearer ${token}`);

      const response = await this.fetchImpl(`${this.graphBaseUrl}${path}`, {
        ...init,
        headers,
      });

      if (response.ok) return response;

      const error = await readGraphError(response, this.now());
      lastError = error;

      if (error.kind === 'unauthorized' && attempt < this.maxAttempts) {
        this.invalidateToken();
        continue;
      }

      if (shouldRetry(error) && attempt < this.maxAttempts) {
        const fallbackDelayMs = Math.min(8_000, 500 * (2 ** (attempt - 1)));
        await this.sleep(error.retryAfterMs ?? fallbackDelayMs);
        continue;
      }

      throw error;
    }

    throw lastError ?? new MicrosoftGraphError({
      kind: 'graph_error',
      message: 'Microsoft Graph request failed without a response.',
    });
  }

  private async graphJson<T>(path: string): Promise<T> {
    const response = await this.graphResponse(path, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    return response.json() as Promise<T>;
  }

  async resolveOnlineMeetingByJoinUrl(
    organizerUserId: string,
    joinWebUrl: string,
  ): Promise<GraphOnlineMeeting | null> {
    const organizer = pathSegment(organizerUserId);
    const joinUrl = requiredString(joinWebUrl, 'joinWebUrl');

    // Microsoft documents JoinWebUrl as a supported lookup key and explicitly
    // warns clients not to rely on parsing the URL format because that format
    // can change. Always try the exact stored join URL first. This is important
    // for newer short links such as /meet/{id}?p=..., where extracting the
    // numeric path segment and switching query shapes can produce a Graph 400
    // even though the meeting itself is valid.
    const joinUrlQuery = new URLSearchParams({
      '$filter': `JoinWebUrl eq '${odataString(joinUrl)}'`,
    });
    let page = await this.graphJson<GraphCollection<GraphOnlineMeeting>>(
      `/users/${organizer}/onlineMeetings?${joinUrlQuery.toString()}`,
    );

    // Some tenants may not retain the short routing URL as JoinWebUrl. If the
    // exact URL is a clean miss, fall back to the documented joinMeetingId
    // filter. Do not fall back after an HTTP/Graph error because that would hide
    // a real authorization/configuration/request failure.
    if (page.value.length === 0) {
      const meetingId = teamsMeetingIdFromJoinUrl(joinUrl);
      if (meetingId) {
        const meetingIdQuery = new URLSearchParams({
          '$filter': `joinMeetingIdSettings/joinMeetingId eq '${odataString(meetingId)}'`,
        });
        page = await this.graphJson<GraphCollection<GraphOnlineMeeting>>(
          `/users/${organizer}/onlineMeetings?${meetingIdQuery.toString()}`,
        );
      }
    }

    if (page.value.length === 0) return null;
    if (page.value.length > 1) {
      throw new MicrosoftGraphError({
        kind: 'ambiguous_result',
        status: 409,
        message: 'Microsoft Graph returned multiple online meetings for one meeting reference.',
      });
    }
    return page.value[0];
  }

  async listTranscripts(
    organizerUserId: string,
    onlineMeetingId: string,
    top = 50,
  ): Promise<GraphCollection<GraphCallTranscript>> {
    const query = new URLSearchParams({ '$top': String(boundedTop(top, 50)) });
    return this.graphJson<GraphCollection<GraphCallTranscript>>(
      `/users/${pathSegment(organizerUserId)}/onlineMeetings/${pathSegment(onlineMeetingId)}/transcripts?${query.toString()}`,
    );
  }

  async listAttendanceReports(
    organizerUserId: string,
    onlineMeetingId: string,
  ): Promise<GraphCollection<GraphMeetingAttendanceReport>> {
    return this.graphJson<GraphCollection<GraphMeetingAttendanceReport>>(
      `/users/${pathSegment(organizerUserId)}/onlineMeetings/${pathSegment(onlineMeetingId)}/attendanceReports`,
    );
  }

  async listAttendanceRecords(
    organizerUserId: string,
    onlineMeetingId: string,
    reportId: string,
  ): Promise<GraphCollection<GraphAttendanceRecord>> {
    return this.graphJson<GraphCollection<GraphAttendanceRecord>>(
      `/users/${pathSegment(organizerUserId)}/onlineMeetings/${pathSegment(onlineMeetingId)}/attendanceReports/${pathSegment(reportId)}/attendanceRecords`,
    );
  }

  async getTranscriptContent(
    organizerUserId: string,
    onlineMeetingId: string,
    transcriptId: string,
  ): Promise<TranscriptContent> {
    const path = `/users/${pathSegment(organizerUserId)}/onlineMeetings/${pathSegment(onlineMeetingId)}/transcripts/${pathSegment(transcriptId)}/content`;

    try {
      const attributed = await this.graphResponse(path, {
        method: 'GET',
        headers: { Accept: 'text/vtt' },
      });
      return {
        contentType: attributed.headers.get('content-type') ?? 'text/vtt',
        content: await attributed.text(),
        attributed: true,
      };
    } catch (error) {
      if (!(error instanceof MicrosoftGraphError) || error.kind !== 'speaker_attribution_not_allowed') {
        throw error;
      }
    }

    const unattributed = await this.graphResponse(path, {
      method: 'GET',
      headers: { Accept: 'application/vnd.microsoft.graph.transcript+text' },
    });
    return {
      contentType: unattributed.headers.get('content-type') ?? 'application/vnd.microsoft.graph.transcript+text',
      content: await unattributed.text(),
      attributed: false,
    };
  }
}
