import jsPDF from 'jspdf';
import type { ParentLedgerAccountV3 } from './parentPaymentsV3Account';
import { assertParentLedgerAccountV3 } from './parentPaymentsV3Account';

const money = (n: number): string => 'Rs. ' + n.toLocaleString('en-IN', {
  minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
  maximumFractionDigits: 2,
});
const month = (key: string): string => {
  const [y, m] = key.split('-').map(Number);
  return new Intl.DateTimeFormat('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(y, m - 1, 1)));
};
const date = (iso: string): string => {
  const [year, monthNum, day] = iso.split('-').map(Number);
  if (!year || !monthNum || !day) return iso;
  return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' })
    .format(new Date(Date.UTC(year, monthNum - 1, day)));
};

/**
 * Generates a dated, parent-facing cumulative fee statement / invoice.
 * This is intentionally a fresh snapshot, not a persisted or tax-certified
 * invoice. It requires a complete verified server ledger result.
 */
export function downloadParentLedgerV3Invoice(account: ParentLedgerAccountV3): string {
  assertParentLedgerAccountV3(account, account.parentId);
  const pdf = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 42;
  const width = pdf.internal.pageSize.getWidth();
  const right = width - margin;
  const bottom = 792;
  let y = 48;

  const heading = (title: string) => {
    if (y > bottom - 55) page();
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(11);
    pdf.text(title, margin, y);
    y += 16;
  };
  const page = () => {
    pdf.addPage();
    y = 46;
  };
  const ensure = (height = 18) => {
    if (y + height > bottom) page();
  };
  const pair = (label: string, value: string) => {
    ensure(20);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(9);
    pdf.text(label, margin, y);
    pdf.setFont('helvetica', 'bold');
    pdf.text(value, right, y, { align: 'right' });
    y += 17;
  };
  const tableRow = (left: string, middle: string, amount: string, isHeader = false) => {
    ensure(24);
    pdf.setFont('helvetica', isHeader ? 'bold' : 'normal');
    pdf.setFontSize(isHeader ? 8.5 : 8);
    const leftText = pdf.splitTextToSize(left, 91) as string[];
    const middleText = pdf.splitTextToSize(middle, 275) as string[];
    const rowHeight = Math.max(19, Math.max(leftText.length, middleText.length) * 11 + 8);
    ensure(rowHeight);
    pdf.text(leftText, margin, y);
    pdf.text(middleText, margin + 101, y);
    pdf.text(amount, right, y, { align: 'right' });
    y += rowHeight;
    pdf.setDrawColor(229, 233, 240);
    pdf.line(margin, y - 5, right, y - 5);
  };

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(17);
  pdf.text('Tiny Steps Learning', margin, y);
  pdf.setFontSize(12);
  pdf.text('Parent Fee Statement', right, y, { align: 'right' });
  y += 20;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(9);
  pdf.text('Parent: ' + account.parentName.slice(0, 68), margin, y);
  y += 15;
  pdf.text('Prepared: ' + date(account.generatedAt.slice(0, 10)), margin, y);
  pdf.text('Through: ' + (account.asOfDate ? date(account.asOfDate) : 'latest recorded data'), right, y, { align: 'right' });
  y += 28;

  heading('Overall account summary');
  pair('Total class fees billed', money(account.totalBilled));
  pair('Payments received to date', money(account.totalReceived));
  pair('Amount applied to fees', money(account.totalApplied));
  pair('Available advance credit', money(account.availableAdvance));
  pair('Unpaid class charges', money(account.outstandingDue));
  pair('Net account balance' + (account.netDue < 0 ? ' (credit)' : ''), money(Math.abs(account.netDue)));
  y += 12;

  heading('Month-wise class and payment adjustment');
  tableRow('Month', 'Classes / Billed / Applied', 'Due', true);
  for (const m of account.months) {
    tableRow(month(m.monthKey),
      m.classes + ' classes   |   Billed ' + money(m.billed) + '   |   Applied ' + money(m.applied),
      money(m.due));
  }
  y += 16;

  heading('Date-wise classes and attendance');
  tableRow('Class date', 'Student / Course / Attendance', 'Charge', true);
  const rows = [...account.classDetails].sort((a, b) => a.serviceDate.localeCompare(b.serviceDate) || a.id.localeCompare(b.id));
  let currentCourse = '';
  for (const cls of rows) {
    const group = cls.courseName;
    if (group !== currentCourse) {
      ensure(16);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text(group.slice(0, 75), margin, y);
      y += 16;
      currentCourse = group;
    }
    tableRow(date(cls.serviceDate),
      cls.studentName + '  |  ' + cls.attendance + '  |  Applied ' + money(cls.applied),
      money(cls.amount));
  }
  if (!rows.length) tableRow('—', 'No billable classes in this account', money(0));
  y += 16;

  heading('Payments received');
  tableRow('Received', 'Type / Source', 'Amount', true);
  const payments = [...account.receiptDetails]
    .sort((a, b) => a.receivedDate.localeCompare(b.receivedDate) || a.id.localeCompare(b.id));
  for (const receipt of payments) {
    tableRow(date(receipt.receivedDate),
      (receipt.kind === 'advance' ? 'Advance' : 'Regular payment')
      + (receipt.method ? '  |  ' + receipt.method : '')
      + (receipt.reference ? '  |  Ref: ' + receipt.reference : ''),
      money(receipt.amount));
  }
  if (!payments.length) tableRow('—', 'No receipts recorded', money(0));

  ensure(60);
  y += 18;
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  const foot = 'Classes and fees reflect Tiny Steps billing records. Payments reflect verified receipts. '
    + 'Attendance is shown where class records permit verification. '
    + 'Please contact Tiny Steps if you notice a discrepancy.';
  const footLines = pdf.splitTextToSize(foot, right - margin) as string[];
  pdf.text(footLines, margin, y);

  const safeName = account.parentName.replace(/[^A-Za-z0-9_-]+/g, '_').slice(0, 50) || 'parent';
  const filename = 'tiny-steps-parent-statement-' + safeName + '-' + account.generatedAt.slice(0, 10) + '.pdf';
  pdf.save(filename);
  return filename;
}
