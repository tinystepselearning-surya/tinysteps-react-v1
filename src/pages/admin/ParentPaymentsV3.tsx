import React, { useEffect, useMemo, useRef, useState } from 'react';
import { httpsCallable } from 'firebase/functions';
import { db, functions } from '../../lib/firebaseConfig';
import { Input } from '@components/ui/input';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';
import {
  PAYMENT_USER_SEARCH_DEBOUNCE_MS,
  PAYMENT_USER_SEARCH_MIN_CHARS,
  searchPaymentUsers,
  useDebouncedValue,
  type PaymentSearchUser,
} from './paymentUserSearch';
import {
  assertParentLedgerAccountV3,
  type ParentLedgerAccountV3,
} from './parentPaymentsV3Account';
import { downloadParentLedgerV3Invoice } from './parentPaymentsV3Invoice';

type Props = { onBack: () => void };

const money = (value: number) => new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 2,
}).format(value);

const monthName = (monthKey: string) => {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  return new Intl.DateTimeFormat('en-IN', { month: 'long', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, month - 1, 1)));
};

const dateLabel = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  if (!y || !m || !d) return iso;
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, d)));
};

const indiaToday = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit',
  }).formatToParts(new Date());
  const p = (name: string) => parts.find((part) => part.type === name)?.value || '';
  return p('year') + '-' + p('month') + '-' + p('day');
};

const isParent = (u: PaymentSearchUser) => (
  String(u.role || '').toLowerCase() === 'parent'
  || (Array.isArray(u.roles) && u.roles.some((role) => String(role).toLowerCase() === 'parent'))
);
const nameOf = (u: PaymentSearchUser) => u.displayName || u.name || u.email || u.id;

function createReceiptKey(): string {
  const uuid = globalThis.crypto?.randomUUID?.() || (
    Date.now().toString(36) + '_' + Math.random().toString(36).slice(2)
  );
  return 'receipt_v3_' + uuid.replace(/[^A-Za-z0-9_-]/g, '_');
}

function Metric({ title, value, helper }: { title: string; value: string; helper?: string }) {
  return (
    <Card className="min-w-0 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{title}</p>
      <p className="mt-2 text-xl font-semibold tabular-nums text-slate-900">{value}</p>
      {helper ? <p className="mt-1 text-xs text-slate-500">{helper}</p> : null}
    </Card>
  );
}

/**
 * V3 preview is intentionally separate from V2 until the audited cutover.
 * Never present empty/missing receipts as zero paid. Backend refuses reads
 * before activation, and the UI keeps financial cards hidden in that case.
 */
export default function ParentPaymentsV3({ onBack }: Props): JSX.Element {
  const [queryText, setQueryText] = useState('');
  const delayedSearch = useDebouncedValue(queryText, PAYMENT_USER_SEARCH_DEBOUNCE_MS);
  const [results, setResults] = useState<PaymentSearchUser[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<PaymentSearchUser | null>(null);
  const [account, setAccount] = useState<ParentLedgerAccountV3 | null>(null);
  const [loading, setLoading] = useState(false);
  const [ledgerError, setLedgerError] = useState('');
  const [gated, setGated] = useState(false);
  const [monthFilter, setMonthFilter] = useState('all');
  const requestSerial = useRef(0);

  const [showReceipt, setShowReceipt] = useState(false);
  const [receiptKey, setReceiptKey] = useState(createReceiptKey);
  const [amount, setAmount] = useState('');
  const [receivedDate, setReceivedDate] = useState(indiaToday);
  const [kind, setKind] = useState<'regular' | 'advance'>('regular');
  const [method, setMethod] = useState('');
  const [reference, setReference] = useState('');
  const [receiptSaving, setReceiptSaving] = useState(false);
  const [receiptError, setReceiptError] = useState('');
  const [receiptMessage, setReceiptMessage] = useState('');

  useEffect(() => {
    if (selected || delayedSearch.trim().length < PAYMENT_USER_SEARCH_MIN_CHARS) {
      setResults([]);
      setSearching(false);
      return;
    }
    let current = true;
    setSearching(true);
    searchPaymentUsers<PaymentSearchUser>({
      db,
      searchTerm: delayedSearch,
      isValidUser: isParent,
    }).then((users) => {
      if (current) setResults(users);
    }).catch(() => {
      if (current) setResults([]);
    }).finally(() => {
      if (current) setSearching(false);
    });
    return () => { current = false; };
  }, [delayedSearch, selected]);

  const fetchAccount = async (parent: PaymentSearchUser) => {
    const serial = ++requestSerial.current;
    setLoading(true);
    setLedgerError('');
    setGated(false);
    setAccount(null); // NEVER show stale amounts after a new parent is selected
    try {
      const getLedger = httpsCallable(functions, 'adminGetParentLedgerV3');
      const response = await getLedger({ parentId: parent.id });
      if (serial !== requestSerial.current) return;
      assertParentLedgerAccountV3(response.data, parent.id);
      setAccount(response.data);
    } catch (error: unknown) {
      if (serial !== requestSerial.current) return;
      const code = (error as { code?: string })?.code || '';
      const message = error instanceof Error ? error.message : 'Unable to load the parent account.';
      if (code.includes('failed-precondition') && /cutover|migration|unavailable/i.test(message)) {
        setGated(true);
        setLedgerError('The verified V3 ledger is not active yet. The existing Parent Payments dashboard remains available.');
      } else {
        setLedgerError(message);
      }
    } finally {
      if (serial === requestSerial.current) setLoading(false);
    }
  };

  const choose = (user: PaymentSearchUser) => {
    setSelected(user);
    setQueryText(nameOf(user));
    setResults([]);
    setMonthFilter('all');
    setReceiptMessage('');
    void fetchAccount(user);
  };

  const clearSelection = () => {
    requestSerial.current += 1;
    setSelected(null);
    setQueryText('');
    setResults([]);
    setLedgerError('');
    setAccount(null);
    setGated(false);
    setMonthFilter('all');
    setShowReceipt(false);
    setReceiptMessage('');
    setLoading(false);
  };

  const displayMonths = useMemo(
    () => account?.months.filter((item) => monthFilter === 'all' || item.monthKey === monthFilter) || [],
    [account, monthFilter],
  );
  const displayClasses = useMemo(
    () => (account?.classDetails || [])
      .filter((item) => monthFilter === 'all' || item.monthKey === monthFilter)
      .sort((a, b) => a.serviceDate.localeCompare(b.serviceDate) || a.id.localeCompare(b.id)),
    [account, monthFilter],
  );

  const openReceipt = () => {
    setShowReceipt(true);
    setReceiptKey(createReceiptKey());
    setAmount('');
    setReceivedDate(indiaToday());
    setKind('regular');
    setMethod('');
    setReference('');
    setReceiptError('');
    setReceiptMessage('');
  };

  const saveReceipt = async () => {
    if (!selected || !account) return;
    const amountNumber = Number(amount);
    if (!Number.isFinite(amountNumber) || amountNumber <= 0 || !receivedDate) {
      setReceiptError('Enter a valid positive payment amount and received date.');
      return;
    }
    setReceiptSaving(true);
    setReceiptError('');
    try {
      const save = httpsCallable(functions, 'adminRecordParentReceiptV3');
      const response = await save({
        parentId: selected.id,
        idempotencyKey: receiptKey,
        amount: amountNumber,
        receivedDate,
        kind,
        ...(method.trim() ? { method: method.trim() } : {}),
        ...(reference.trim() ? { reference: reference.trim() } : {}),
      });
      if ((response.data as { ok?: boolean })?.ok !== true) throw new Error('Receipt confirmation was incomplete.');
      setShowReceipt(false);
      setReceiptMessage('Receipt recorded. Reloading the verified parent account.');
      await fetchAccount(selected);
    } catch (error: unknown) {
      setReceiptError(error instanceof Error ? error.message : 'Unable to confirm this payment. Check its status before retrying.');
    } finally {
      setReceiptSaving(false);
    }
  };

  const download = () => {
    if (!account || !selected) return;
    try {
      assertParentLedgerAccountV3(account, selected.id);
      downloadParentLedgerV3Invoice(account);
      setLedgerError('');
    } catch (error: unknown) {
      setLedgerError(error instanceof Error ? error.message : 'Invoice generation failed.');
    }
  };

  return (
    <div className="space-y-4 pb-8" data-testid="parent-payments-v3">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Tiny Steps · Admin finance</p>
          <h1 className="text-2xl font-bold text-slate-900">Parent Accounts &amp; Payments</h1>
          <p className="text-sm text-slate-600">
            V3 preview · Firestore class billing + verified receipt ledger
          </p>
        </div>
        <Button variant="outline" onClick={onBack}>Back to existing payments</Button>
      </header>

      <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900" role="status">
        This replacement is being prepared for migration. Historical CSV receipts are not loaded yet.
        No V3 balance is displayed unless the verified ledger service returns a complete account.
      </div>

      <Card className="p-4">
        <label htmlFor="v3-parent-search" className="text-sm font-semibold">Find parent</label>
        <div className="mt-2 flex flex-wrap gap-2">
          <Input
            id="v3-parent-search"
            className="max-w-2xl flex-1"
            value={queryText}
            placeholder="Search by parent name, email, phone or Firestore ID"
            onChange={(event) => {
              if (selected) clearSelection();
              setQueryText(event.target.value);
            }}
          />
          {selected ? <Button variant="outline" onClick={clearSelection}>Clear</Button> : null}
        </div>
        {!selected && queryText.trim().length >= PAYMENT_USER_SEARCH_MIN_CHARS ? (
          <div className="mt-2 overflow-hidden rounded-lg border">
            {searching ? <div className="px-3 py-3 text-sm text-slate-500">Searching parents…</div>
              : results.length ? results.map((user) => (
                <button key={user.id} type="button" onClick={() => choose(user)}
                  className="flex w-full justify-between gap-3 border-b px-3 py-3 text-left text-sm last:border-b-0 hover:bg-slate-50">
                  <span>
                    <strong className="block">{nameOf(user)}</strong>
                    <span className="text-xs text-slate-500">{user.phone || user.phoneNormalized || user.email || user.id}</span>
                  </span>
                  <span className="shrink-0 font-semibold text-blue-700">Open account</span>
                </button>
              )) : <div className="px-3 py-3 text-sm text-slate-500">No matching parent found.</div>}
          </div>
        ) : null}
      </Card>

      {selected ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{nameOf(selected)}</h2>
              <p className="text-xs text-slate-500">Single financial account for all enrolled children and courses</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" disabled={loading} onClick={() => void fetchAccount(selected)}>Refresh</Button>
              <Button variant="outline" disabled={!account} onClick={download}>Download cumulative PDF</Button>
              <Button disabled={!account || loading} onClick={openReceipt}>Record payment</Button>
            </div>
          </div>
          {loading ? <div role="status" className="rounded-lg border p-4 text-sm">Loading verified account…</div> : null}
          {ledgerError ? <div role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">{ledgerError}</div> : null}
          {gated ? <p className="text-sm text-slate-600">The existing V2 dashboard can continue handling current finance operations until the migration is approved.</p> : null}
          {receiptMessage ? <div role="status" className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm">{receiptMessage}</div> : null}
          {account ? (
            <>
              <div className="grid grid-cols-2 gap-3 xl:grid-cols-3">
                <Metric title="Total billed" value={money(account.totalBilled)} helper="Existing Firestore class charges" />
                <Metric title="Total received" value={money(account.totalReceived)} helper="Verified V3 receipt dates" />
                <Metric title="Payments applied" value={money(account.totalApplied)} helper="Oldest eligible charges first" />
                <Metric title="Available advance" value={money(account.availableAdvance)} helper="Unapplied credit" />
                <Metric title="Outstanding charges" value={money(account.outstandingDue)} />
                <Metric title={account.netDue < 0 ? 'Net credit balance' : 'Net amount due'}
                  value={money(Math.abs(account.netDue))} helper={account.netDue < 0 ? 'Credit available for future classes' : 'Outstanding after available credit'} />
              </div>
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b p-4">
                  <h3 className="font-semibold">Month-wise financial account</h3>
                  <label className="flex items-center gap-2 text-sm">
                    <span>Show</span>
                    <select aria-label="Filter service month" className="rounded-md border bg-white px-3 py-2"
                      value={monthFilter} onChange={(event) => setMonthFilter(event.target.value)}>
                      <option value="all">All months</option>
                      {account.months.map((m) => <option key={m.monthKey} value={m.monthKey}>{monthName(m.monthKey)}</option>)}
                    </select>
                  </label>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[670px] text-sm">
                    <thead className="bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <tr><th className="px-4 py-3">Service month</th><th>Classes</th><th>Billed</th><th>Applied</th><th>Due</th></tr>
                    </thead>
                    <tbody>
                      {displayMonths.map((m) => (
                        <tr className="border-t" key={m.monthKey}>
                          <td className="px-4 py-3 font-medium">{monthName(m.monthKey)}</td>
                          <td className="py-3 tabular-nums">{m.classes}</td>
                          <td className="py-3 tabular-nums">{money(m.billed)}</td>
                          <td className="py-3 tabular-nums text-emerald-700">{money(m.applied)}</td>
                          <td className="py-3 font-semibold tabular-nums">{money(m.due)}</td>
                        </tr>
                      ))}
                      {!displayMonths.length ? <tr><td colSpan={5} className="px-4 py-6 text-slate-500">No billable classes found.</td></tr> : null}
                    </tbody>
                  </table>
                </div>
              </Card>
              <Card className="overflow-hidden">
                <div className="border-b p-4"><h3 className="font-semibold">Class charges &amp; attendance</h3>
                  <p className="text-xs text-slate-500">Based on recorded billing classes and linked Tiny Steps attendance where available.</p></div>
                <div className="max-h-[440px] overflow-auto">
                  <table className="w-full min-w-[850px] text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <tr><th className="px-4 py-3">Date</th><th>Student</th><th>Course</th><th>Attendance</th><th>Charge</th><th>Applied</th><th>Due</th></tr>
                    </thead>
                    <tbody>
                      {displayClasses.map((cls) => (
                        <tr key={cls.id} className="border-t">
                          <td className="px-4 py-3">{dateLabel(cls.serviceDate)}</td><td>{cls.studentName}</td><td>{cls.courseName}</td>
                          <td>{cls.attendance}</td><td className="tabular-nums">{money(cls.amount)}</td>
                          <td className="tabular-nums">{money(cls.applied)}</td><td className="tabular-nums">{money(cls.due)}</td>
                        </tr>
                      ))}
                      {!displayClasses.length ? <tr><td className="px-4 py-6 text-slate-500" colSpan={7}>No billable classes for the selected period.</td></tr> : null}
                    </tbody>
                  </table>
                </div>
              </Card>
              <Card className="overflow-hidden">
                <div className="border-b p-4">
                  <h3 className="font-semibold">Unified payment receipts</h3>
                  <p className="text-xs text-slate-500">The payment date is the date money was received, not its billing month.</p>
                </div>
                <div className="max-h-[390px] overflow-auto">
                  <table className="w-full min-w-[630px] text-sm">
                    <thead className="sticky top-0 bg-slate-50 text-left text-xs uppercase text-slate-500">
                      <tr><th className="px-4 py-3">Received date</th><th>Category</th><th>Amount</th><th>Source (optional)</th><th>Reference</th></tr>
                    </thead>
                    <tbody>
                      {account.receiptDetails.map((row) => (
                        <tr className="border-t" key={row.id}>
                          <td className="px-4 py-3">{dateLabel(row.receivedDate)}</td>
                          <td>{row.kind === 'advance' ? 'Advance' : 'Regular'}</td><td className="font-medium tabular-nums">{money(row.amount)}</td>
                          <td>{row.method || '—'}</td><td className="text-slate-500">{row.reference || '—'}</td>
                        </tr>
                      ))}
                      {!account.receiptDetails.length ? <tr><td colSpan={5} className="px-4 py-6 text-slate-500">No V3 receipts recorded.</td></tr> : null}
                    </tbody>
                  </table>
                </div>
              </Card>
            </>
          ) : null}
        </div>
      ) : null}

      {showReceipt && account && selected ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="presentation">
          <div role="dialog" aria-modal="true" aria-label="Record parent receipt" className="w-full max-w-lg space-y-4 rounded-xl bg-white p-5 shadow-xl">
            <h3 className="text-lg font-semibold">Record receipt · {nameOf(selected)}</h3>
            <p className="text-xs text-slate-600">Regular receipts settle oldest dues. Excess becomes advance. Explicit advance is reserved for future eligible classes.</p>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="text-sm">Amount received (₹)
                <Input aria-label="Amount received" type="number" step="0.01" min="0.01"
                  value={amount} onChange={(event) => setAmount(event.target.value)} />
              </label>
              <label className="text-sm">Date received
                <Input aria-label="Date received" type="date" max={indiaToday()} value={receivedDate}
                  onChange={(event) => setReceivedDate(event.target.value)} />
              </label>
              <label className="text-sm">Receipt category
                <select aria-label="Receipt category" className="block w-full rounded-md border px-3 py-2"
                  value={kind} onChange={(event) => setKind(event.target.value as 'regular' | 'advance')}>
                  <option value="regular">Regular (oldest dues first)</option>
                  <option value="advance">Advance (future classes)</option>
                </select>
              </label>
              <label className="text-sm">Source (optional)
                <select aria-label="Payment source" className="block w-full rounded-md border px-3 py-2"
                  value={method} onChange={(event) => setMethod(event.target.value)}>
                  <option value="">Not specified</option><option value="UPI">UPI</option>
                  <option value="Bank transfer">Bank transfer</option><option value="Cash">Cash</option><option value="Other">Other</option>
                </select>
              </label>
            </div>
            <label className="block text-sm">Reference (optional)
              <Input aria-label="Payment reference" value={reference}
                onChange={(event) => setReference(event.target.value)} placeholder="Transaction or receipt reference" />
            </label>
            {receiptError ? <div role="alert" className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{receiptError}</div> : null}
            <div className="flex justify-end gap-2">
              <Button variant="outline" disabled={receiptSaving} onClick={() => { setShowReceipt(false); setReceiptError(''); }}>Cancel</Button>
              <Button disabled={receiptSaving || !(Number(amount) > 0) || !receivedDate} onClick={() => void saveReceipt()}>
                {receiptSaving ? 'Recording…' : 'Record verified receipt'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
