import { describe, expect, it } from 'vitest';

import * as functionExports from '../src/index';
// @ts-expect-error JavaScript deployment contract intentionally exposes ESM constants.
import {
  AVS_BROWSER_CALLABLES,
  AVS_CALLABLE_REGION,
} from '../../scripts/avs-callable-contract.mjs';

function endpointHasRegion(endpoint: any): boolean {
  const regions = Array.isArray(endpoint?.region)
    ? endpoint.region
    : endpoint?.region
      ? [endpoint.region]
      : [];
  return regions.includes(AVS_CALLABLE_REGION);
}

function endpointHasPublicTransport(endpoint: any): boolean {
  const invokers = Array.isArray(endpoint?.httpsTrigger?.invoker)
    ? endpoint.httpsTrigger.invoker
    : endpoint?.httpsTrigger?.invoker
      ? [endpoint.httpsTrigger.invoker]
      : [];

  return invokers.includes('public')
    || endpoint?.labels?.['avs-public-invoker'] === 'true';
}

describe('AVS browser callable deployment contract', () => {
  it('exports every AVS browser callable in asia-south1 with public transport', () => {
    for (const name of AVS_BROWSER_CALLABLES) {
      const fn = (functionExports as Record<string, any>)[name];
      expect(fn, name).toBeTruthy();
      expect(fn.__endpoint, `${name} endpoint metadata`).toBeTruthy();
      expect(endpointHasRegion(fn.__endpoint), `${name} region`).toBe(true);
      expect(endpointHasPublicTransport(fn.__endpoint), `${name} public transport`).toBe(true);
    }
  });

  it('still rejects unauthenticated execution at the application layer', async () => {
    for (const name of AVS_BROWSER_CALLABLES) {
      const fn = (functionExports as Record<string, any>)[name];
      await expect(fn.run({ data: {}, auth: null }))
        .rejects.toMatchObject({ code: 'unauthenticated' });
    }
  });
});
