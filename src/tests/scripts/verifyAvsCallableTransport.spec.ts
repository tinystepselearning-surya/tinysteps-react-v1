// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

// @ts-expect-error JavaScript deployment verifier intentionally exposes ESM helpers.
import { AVS_BROWSER_CALLABLES } from '../../../scripts/avs-callable-contract.mjs';
// @ts-expect-error JavaScript deployment verifier intentionally exposes ESM helpers.
import { ensureAvsCallablePublicInvocation } from '../../../scripts/ensure-avs-callable-public-invocation.mjs';
// @ts-expect-error JavaScript deployment verifier intentionally exposes ESM helpers.
import { verifyAvsCallableTransport } from '../../../scripts/verify-avs-callable-transport.mjs';

const origin = 'https://tinystepslearning.com';

describe('AVS callable transport contract', () => {
  it('covers every browser-called AVS callable', () => {
    expect(AVS_BROWSER_CALLABLES).toEqual([
      'runAttendanceValidationRange',
      'forceRefreshAttendanceValidationEvidence',
      'forceRefreshAttendanceValidationRange',
    ]);
  });

  it('enforces public Cloud Run invocation for every AVS browser callable', () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    const execFile = vi.fn((command: string, args: string[]) => {
      calls.push({ command, args });
      if (args[0] === 'functions') {
        const functionName = args[2];
        return `projects/demo/locations/asia-south1/services/${functionName.toLowerCase()}\n`;
      }
      return '';
    });

    const results = ensureAvsCallablePublicInvocation({
      project: 'tinysteps-react-v1',
      execFile,
    });

    expect(results.map((item: { functionName: string }) => item.functionName))
      .toEqual(AVS_BROWSER_CALLABLES);
    expect(calls.filter((call) =>
      call.args.includes('--role=roles/run.invoker')
      && call.args.includes('--member=allUsers'),
    )).toHaveLength(AVS_BROWSER_CALLABLES.length);
  });

  it('preflights every AVS browser callable against the production origin', async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      status: 204,
      headers: new Headers({
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Methods': 'OPTIONS, POST',
      }),
    });

    const result = await verifyAvsCallableTransport({
      project: 'tinysteps-react-v1',
      origin,
      attempts: 1,
      retryDelayMs: 0,
      fetchImpl,
      sleep: vi.fn(),
    });

    expect(result.passed).toBe(true);
    expect(result.results.map((item: { functionName: string }) => item.functionName))
      .toEqual(AVS_BROWSER_CALLABLES);
    expect(fetchImpl).toHaveBeenCalledTimes(AVS_BROWSER_CALLABLES.length);
  });
});
