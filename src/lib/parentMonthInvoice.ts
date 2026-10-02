import {
  collection,
  doc,
  documentId,
  getDoc,
  getDocs,
  query,
  where,
  type Firestore,
} from 'firebase/firestore';
import jsPDF from 'jspdf';
import {
  classifyInvoiceCharges,
  isActiveBillingCharge,
  type InvoiceChargeRow,
} from '../../functions/src/helpers/serviceDate';
import { resolveParentMonthlyChargePaidAmount } from '../../functions/src/parentMonthlyBillingReadModel';
import {
  parentMonthCloseBillingSnapshot,
  type ParentMonthCloseBillingSnapshot,
} from './parentMonthClose';

const EPSILON = 0.01;

type ChargeRow = Record<string, unknown> & { id: string };

export interface DownloadParentMonthInvoiceInput {
  db: Firestore;
  parentId: string;
  parentName: string;
  monthKey: string;
  expectedFingerprint?: string | null;
}

export interface DownloadParentMonthInvoiceResult {
  classes: number;
  billed: number;
  settled: number;
  due: number;
  filename: string;
}

const chunkIds = (ids: string[], size = 10): string[][] => {
  const chunks: string[][] = [];
  for (let index = 0; index < ids.length; index += size) {
    chunks.push(ids.slice(index, index + size));
  }
  return chunks;
};

const roundCurrency = (value: number): number =>
  Number.isFinite(value) ? Math.round(value * 100) / 100 : 0;

const amountMatches = (left: number, right: number): boolean =>
  Math.abs(roundCurrency(left) - roundCurrency(right)) <= EPSILON;

const sameIds = (left: string[], right: string[]): boolean =>
  JSON.stringify([...left].sort()) === JSON.stringify([...right].sort());

const monthLabel = (monthKey: string): string => {
  const [year, month] = monthKey.split('-').map(Number);
  if (!year || !month) return monthKey;
  return new Intl.DateTimeFormat('en-IN', {
    month: 'long',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(new Date(Date.UTC(year, month - 1, 1)));
};

const formatServiceDate = (serviceDate: string | null): string => {
  if (!serviceDate) return '—';
  const date = new Date(`${serviceDate}T00:00:00+05:30`);
  if (!Number.isFinite(date.getTime())) return '—';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'Asia/Kolkata',
  }).format(date);
};

const chargeStudentName = (
  charge: Record<string, unknown>,
  kidNames: Record<string, string>,
): string => {
  const direct = String(
    charge.kidName
      || charge.studentName
      || charge.childName
      || charge.kidDisplayName
      || charge.studentDisplayName
      || '',
  ).trim();
  if (direct) return direct;
  const kidId = String(charge.kidId || charge.studentId || '').trim();
  return kidNames[kidId] || (kidId ? 'Student' : '—');
};

async function loadExactInvoiceScope(input: {
  db: Firestore;
  parentId: string;
  monthKey: string;
}): Promise<{
  billing: ParentMonthCloseBillingSnapshot;
  rows: Array<InvoiceChargeRow<ChargeRow>>;
  kidNames: Record<string, string>;
}> {
  const { db, parentId, monthKey } = input;

  const [readModelSnapshot, chargeSnapshot] = await Promise.all([
    getDoc(doc(db, 'parentMonthlyReadModels', parentId, 'months', monthKey)),
    getDocs(query(
      collection(db, 'billingCharges'),
      where('parentId', '==', parentId),
      where('monthKey', '==', monthKey),
    )),
  ]);

  if (!readModelSnapshot.exists()) {
    throw new Error('Canonical monthly billing data is not available yet. Refresh billing and try again.');
  }

  const billing = parentMonthCloseBillingSnapshot(
    readModelSnapshot.data() as Record<string, unknown>,
    parentId,
    monthKey,
  );

  const charges: ChargeRow[] = chargeSnapshot.docs
    .map((item) => ({ id: item.id, ...(item.data() as Record<string, unknown>) }))
    .filter((charge) => charge.archived !== true);

  const sessionIds = Array.from(new Set(
    charges.map((charge) => String(charge.sessionId || '').trim()).filter(Boolean),
  ));
  const sessionsById: Record<string, Record<string, unknown> | null> = {};
  for (const ids of chunkIds(sessionIds)) {
    const snapshot = await getDocs(query(
      collection(db, 'classSessions'),
      where(documentId(), 'in', ids),
    ));
    snapshot.docs.forEach((item) => {
      sessionsById[item.id] = item.data() as Record<string, unknown>;
    });
  }
  sessionIds.forEach((sessionId) => {
    if (!(sessionId in sessionsById)) sessionsById[sessionId] = null;
  });

  const integrityRows = classifyInvoiceCharges({
    charges: charges.filter(
      (charge) => isActiveBillingCharge(charge) && Number(charge.amount) > 0,
    ),
    sessionsById,
    selectedMonth: monthKey,
  });

  const anomalies = integrityRows.filter((row) => row.integrity !== 'VALID');
  if (anomalies.length > 0) {
    throw new Error(
      `Invoice blocked: ${anomalies.length} billing ${anomalies.length === 1 ? 'record needs' : 'records need'} service-date review.`,
    );
  }

  const rows = integrityRows
    .filter((row) => row.integrity === 'VALID' && row.serviceMonthKey === monthKey)
    .sort((left, right) =>
      String(left.serviceDate).localeCompare(String(right.serviceDate))
      || left.charge.id.localeCompare(right.charge.id));

  const kidIds = Array.from(new Set(
    rows
      .map((row) => String(row.charge.kidId || row.charge.studentId || '').trim())
      .filter(Boolean),
  ));
  const kidNames: Record<string, string> = {};
  for (const ids of chunkIds(kidIds)) {
    const snapshot = await getDocs(query(
      collection(db, 'kids'),
      where(documentId(), 'in', ids),
    ));
    snapshot.docs.forEach((item) => {
      const data = item.data() as Record<string, unknown>;
      kidNames[item.id] = String(
        data.fullName
          || data.name
          || data.displayName
          || data.studentName
          || data.firstName
          || item.id,
      ).trim();
    });
  }

  return { billing, rows, kidNames };
}

function calculateInvoiceTotals(
  rows: Array<InvoiceChargeRow<ChargeRow>>,
): { classes: number; billed: number; settled: number; due: number; chargeIds: string[] } {
  const totals = rows.reduce((acc, row) => {
    const amount = Math.max(Number(row.charge.amount) || 0, 0);
    const paid = resolveParentMonthlyChargePaidAmount(row.charge, amount);
    acc.classes += 1;
    acc.billed += amount;
    acc.settled += paid;
    acc.due += Math.max(amount - paid, 0);
    acc.chargeIds.push(row.charge.id);
    return acc;
  }, { classes: 0, billed: 0, settled: 0, due: 0, chargeIds: [] as string[] });

  return {
    classes: totals.classes,
    billed: roundCurrency(totals.billed),
    settled: roundCurrency(totals.settled),
    due: roundCurrency(totals.due),
    chargeIds: totals.chargeIds.sort(),
  };
}

function assertInvoiceMatchesBilling(
  billing: ParentMonthCloseBillingSnapshot,
  totals: ReturnType<typeof calculateInvoiceTotals>,
): void {
  const mismatch =
    totals.classes !== billing.billedClassCount
    || !amountMatches(totals.billed, billing.billedAmount)
    || !amountMatches(totals.settled, billing.settledAmount)
    || !amountMatches(totals.due, billing.dueAmount)
    || !sameIds(totals.chargeIds, billing.chargeIds);

  if (mismatch) {
    throw new Error(
      'Invoice is temporarily out of sync with the canonical monthly ledger. Refresh billing and try again.',
    );
  }
}

export async function downloadParentMonthInvoice(
  input: DownloadParentMonthInvoiceInput,
): Promise<DownloadParentMonthInvoiceResult> {
  const { billing, rows, kidNames } = await loadExactInvoiceScope(input);

  if (
    input.expectedFingerprint
    && input.expectedFingerprint !== billing.fingerprint
  ) {
    throw new Error('Billing changed after review. Refresh this parent and review billing again before sending an invoice.');
  }

  if (billing.billedAmount <= EPSILON || billing.billedClassCount <= 0) {
    throw new Error('There are no billable classes for this parent and month.');
  }

  const totals = calculateInvoiceTotals(rows);
  assertInvoiceMatchesBilling(billing, totals);

  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const margin = 44;
  let y = 50;

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(18);
  pdf.text('Tiny Steps Learning', margin, y);
  pdf.setFontSize(15);
  pdf.text('Monthly Invoice', pageWidth - margin, y, { align: 'right' });
  y += 28;

  pdf.setDrawColor(220, 226, 235);
  pdf.line(margin, y, pageWidth - margin, y);
  y += 24;

  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`Parent: ${input.parentName}`, margin, y);
  pdf.text(`Period: ${monthLabel(input.monthKey)}`, pageWidth - margin, y, { align: 'right' });
  y += 18;

  const studentNames = Array.from(new Set(
    rows.map((row) => chargeStudentName(row.charge, kidNames)).filter((name) => name && name !== '—'),
  ));
  if (studentNames.length > 0) {
    pdf.text(`Student(s): ${studentNames.join(', ').slice(0, 90)}`, margin, y);
    y += 18;
  }

  const summaryRows = [
    ['Classes', String(totals.classes)],
    ['Billed', `Rs. ${Math.round(totals.billed).toLocaleString('en-IN')}`],
    ['Paid / applied', `Rs. ${Math.round(totals.settled).toLocaleString('en-IN')}`],
    ['Amount due', `Rs. ${Math.round(totals.due).toLocaleString('en-IN')}`],
  ];
  summaryRows.forEach(([label, value]) => {
    pdf.setFont('helvetica', 'bold');
    pdf.text(label, margin, y);
    pdf.setFont('helvetica', 'normal');
    pdf.text(value, margin + 105, y);
    y += 17;
  });
  y += 14;

  pdf.setFont('helvetica', 'bold');
  pdf.text('Date', margin, y);
  pdf.text('Student', margin + 90, y);
  pdf.text('Amount', pageWidth - margin, y, { align: 'right' });
  y += 8;
  pdf.line(margin, y, pageWidth - margin, y);
  y += 16;

  pdf.setFont('helvetica', 'normal');
  rows.forEach((row) => {
    if (y > 760) {
      pdf.addPage();
      y = 50;
    }
    pdf.text(formatServiceDate(row.serviceDate), margin, y);
    pdf.text(chargeStudentName(row.charge, kidNames).slice(0, 42), margin + 90, y);
    pdf.text(
      `Rs. ${Math.round(Number(row.charge.amount) || 0).toLocaleString('en-IN')}`,
      pageWidth - margin,
      y,
      { align: 'right' },
    );
    y += 18;
  });

  y += 12;
  pdf.line(margin, y, pageWidth - margin, y);
  y += 22;
  pdf.setFont('helvetica', 'bold');
  pdf.text(
    `Amount due: Rs. ${Math.round(totals.due).toLocaleString('en-IN')}`,
    pageWidth - margin,
    y,
    { align: 'right' },
  );

  const safeName = input.parentName
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
  const filename = `tiny-steps-invoice-${safeName || input.parentId}-${input.monthKey}.pdf`;
  pdf.save(filename);

  return {
    classes: totals.classes,
    billed: totals.billed,
    settled: totals.settled,
    due: totals.due,
    filename,
  };
}
