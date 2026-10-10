import {createHmac, randomBytes, timingSafeEqual} from 'node:crypto';
import {buildParentPaymentBackfillDryRunReport as report} from '../../src/parentPaymentBackfillAudit';
import {createParentPaymentBackfillReportHash as hash} from '../../src/parentPaymentBackfillHash';
import {buildParentPaymentBackfillWritePlan as plan} from '../../src/parentPaymentBackfillWrite';
import {auditInput} from '../support/financeSyntheticSource';
import {evaluateComplete, stable, type Json, type Result} from '../support/financeReadPagination';
import {evidenceFor} from './pinnedSource';
export const CALCULATION_VERSION = 'legacy-a739a4be-parent-payment-v1';
/** Offline trust experiment. The issuer represents a future trusted server, not a
 * browser. HMAC key and replay registry are ephemeral; this is NOT deployable auth. */
export function offlineIssuer(approvedParents: string[], now = () => Date.now()) {
  const parents = [...approvedParents].sort();
  const secret = randomBytes(32), issued = new Map<string, {body: string; used: boolean}>();
  const ids = new Set<string>();
  const signature = (body: string) => createHmac('sha256', secret).update(body).digest('hex');
  return {
    issue(result: Result, idempotencyKey: string): string {
      const evidence = evidenceFor(result);
      if (!evidence || stable(evidence.parents) !== stable(parents) || result.state !== 'COMPLETE') throw new Error('UNVERIFIED_SOURCE');
      if (!/^[a-zA-Z0-9_-]{1,100}$/.test(idempotencyKey) || ids.has(idempotencyKey)) throw new Error('IDEMPOTENCY_REUSE');
      // Policy is fixed by this trusted experiment, never accepted as unsigned client values.
      const issuedAt = now(), expiresAt = issuedAt + 60000;
      const filters = {parentId: null, fromMonth: null, toMonth: null, includeArchived: false};
      const calculated = evaluateComplete(result, rows => report(auditInput(rows, {...filters, now: new Date(issuedAt)})), hash);
      if (!calculated.reportHash) throw new Error('NO_COMPLETE_REPORT');
      const nonce = randomBytes(16).toString('hex');
      const certificate = {contractVersion: 1, purpose: 'offline-design-only', nonce, idempotencyKey,
        issuedAt, expiresAt, parents, filters, transportOrder: '__name__ ASC',
        financialOrder: 'legacy-paid-created-id', calculationVersion: CALCULATION_VERSION,
        evidence, legacyReportHash: calculated.reportHash, state: 'COMPLETE',
        writeValidation: 'full-source-revalidate-and-commit-atomically', writeAuthorized: false};
      const body = Buffer.from(stable(certificate as unknown as Json)).toString('base64url');
      issued.set(nonce, {body, used: false}); ids.add(idempotencyKey);
      return body + '.' + signature(body);
    },
    consumeForOfflinePlanning(token: string, current: Result) {
      const [body, sig, extra] = token.split('.');
      if (!body || !/^[a-f0-9]{64}$/.test(sig || '') || extra ||
          !timingSafeEqual(Buffer.from(sig, 'hex'), Buffer.from(signature(body), 'hex'))) throw new Error('UNTRUSTED_CERTIFICATE');
      const parsed = JSON.parse(Buffer.from(body, 'base64url').toString()) as {
        nonce: string; issuedAt: number; expiresAt: number; evidence: {sourceDigest: string; run: string}; legacyReportHash: string;
      };
      const stored = issued.get(parsed.nonce);
      if (!stored || stored.body !== body || stored.used) throw new Error('REPLAY_OR_UNKNOWN');
      if (now() < parsed.issuedAt || now() >= parsed.expiresAt) throw new Error('CERTIFICATE_EXPIRED');
      const evidence = evidenceFor(current);
      if (!evidence || stable(evidence.parents) !== stable(parents) || evidence.run !== parsed.evidence.run ||
          evidence.sourceDigest !== parsed.evidence.sourceDigest) throw new Error('SOURCE_CHANGED');
      const candidate = evaluateComplete(current, rows => plan({...auditInput(rows, {now: new Date(parsed.issuedAt)}),
        mode: 'write', parentIds: parents, runId: 'offline-certificate-plan'}), value => hash(value.beforeReport));
      if (candidate.reportHash !== parsed.legacyReportHash || !candidate.report) throw new Error('FINANCIAL_CONTRACT_MISMATCH');
      stored.used = true;
      // A fresh audit still has a race before a later commit. This proposal is never executable authorization.
      return {proposal: candidate.report, writeAuthorized: false as const, requiresAtomicRevalidation: true as const};
    },
  };
}
