// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';

// @ts-expect-error JavaScript deployment verifier intentionally exposes ESM helpers.
import { validatePreflightResponse, verifyCallablePreflight } from '../../../scripts/verify-school-callable-transport.mjs';
// @ts-expect-error JavaScript deployment verifier intentionally exposes ESM helpers.
import { addPublicInvokerArgs, describeFunctionArgs, ensureSchoolCallablePublicInvocation } from '../../../scripts/ensure-school-callable-public-invocation.mjs';

function response(status: number, headers: HeadersInit = {}) {
  return { status, headers: new Headers(headers) };
}

const origin = 'https://tinystepslearning.com';

describe('School callable transport verifier', () => {
  it('accepts a 204 preflight with wildcard origin', () => {
    expect(validatePreflightResponse(response(204, {
      'Access-Control-Allow-Origin': '*',
    }), origin).passed).toBe(true);
  });

  it('accepts a 200 preflight with the exact Tiny Steps origin', () => {
    expect(validatePreflightResponse(response(200, {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'OPTIONS, POST',
    }), origin).passed).toBe(true);
  });

  it.each([
    [403, {}],
    [404, { 'Access-Control-Allow-Origin': '*' }],
    [500, { 'Access-Control-Allow-Origin': '*' }],
    [204, {}],
  ])('rejects status %s with invalid CORS transport', (status, headers) => {
    expect(validatePreflightResponse(response(status, headers), origin).passed).toBe(false);
  });

  it('retries a failed endpoint and then succeeds', async () => {
    const fetchImpl = vi.fn()
      .mockResolvedValueOnce(response(403))
      .mockResolvedValueOnce(response(204, { 'Access-Control-Allow-Origin': '*' }));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await verifyCallablePreflight({
      functionName: 'adminCreateSchool',
      project: 'tinysteps-react-v1',
      origin,
      attempts: 3,
      retryDelayMs: 1,
      fetchImpl,
      sleep,
    });

    expect(result.passed).toBe(true);
    expect(result.attempt).toBe(2);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
    expect(sleep).toHaveBeenCalledTimes(1);
  });

  it('fails after the bounded retry count', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(response(403));
    const sleep = vi.fn().mockResolvedValue(undefined);

    const result = await verifyCallablePreflight({
      functionName: 'adminCreateSchool',
      project: 'tinysteps-react-v1',
      origin,
      attempts: 3,
      retryDelayMs: 1,
      fetchImpl,
      sleep,
    });

    expect(result.passed).toBe(false);
    expect(result.attempt).toBe(3);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
    expect(sleep).toHaveBeenCalledTimes(2);
  });
});

describe('School callable public IAM enforcement', () => {
  it('resolves the deployed Cloud Run service before granting allUsers run.invoker', () => {
    const calls: Array<{ command: string; args: string[] }> = [];
    const execFile = vi.fn((command: string, args: string[]) => {
      calls.push({ command, args });
      if (args[0] === 'functions') {
        return 'projects/demo/locations/asia-south1/services/admincreateschool\n';
      }
      return '';
    });

    const result = ensureSchoolCallablePublicInvocation({
      project: 'tinysteps-react-v1',
      region: 'asia-south1',
      functionNames: ['adminCreateSchool'],
      execFile,
    });

    expect(result).toEqual([{
      functionName: 'adminCreateSchool',
      serviceName: 'admincreateschool',
    }]);
    expect(calls[0].args).toEqual(describeFunctionArgs({
      functionName: 'adminCreateSchool',
      project: 'tinysteps-react-v1',
      region: 'asia-south1',
    }));
    expect(calls[1].args).toEqual(addPublicInvokerArgs({
      serviceName: 'admincreateschool',
      project: 'tinysteps-react-v1',
      region: 'asia-south1',
    }));
  });
});
