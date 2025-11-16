import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { ChevronDown } from 'lucide-react';
import { PhonePePaymentModal } from '../../Payments/PhonePePaymentModal';

interface Invoice {
  id: number;
  description: string;
  amount: number;
  dueDate: string;
  status: string;
  courses: string[];
}

export function InvoiceManagement() {
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPhonePeModal, setShowPhonePeModal] = useState(false);
  const [showPaid, setShowPaid] = useState(false);

  const outstandingInvoices: Invoice[] = [
    { id: 1, description: 'November Tuition', amount: 2000, dueDate: '2025-11-15', status: 'OVERDUE', courses: ['Phonics Level 1', 'Grammar Level 1'] },
    { id: 2, description: 'October Tuition', amount: 1500, dueDate: '2025-11-20', status: 'DUE SOON', courses: ['Speaking Level 1'] },
  ];

  const paidInvoices = [
    { id: 3, description: 'September Tuition', amount: 2000, paidDate: '2025-10-01', method: 'UPI' },
  ];

  const handlePayNow = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setShowPhonePeModal(true);
  };

  return (
    <>
      <div className="p-4">
        <h1 className="text-2xl font-bold mb-4">Invoice Management</h1>

        {/* Outstanding Invoices */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>OUTSTANDING INVOICES</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice ID</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {outstandingInvoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell>INV-2025-{invoice.id.toString().padStart(3, '0')}</TableCell>
                    <TableCell>₹{invoice.amount}</TableCell>
                    <TableCell>{invoice.dueDate}</TableCell>
                    <TableCell>
                      <Badge variant={invoice.status === 'OVERDUE' ? 'destructive' : invoice.status === 'DUE SOON' ? 'secondary' : 'default'}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button variant="outline" className="mr-2">View Invoice</Button>
                      <Button onClick={() => handlePayNow(invoice)}>Pay with PhonePe</Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Paid Invoices */}
        <Button variant="outline" onClick={() => setShowPaid(!showPaid)} className="mb-4">
          Paid Invoices <ChevronDown className={`ml-2 transition-transform ${showPaid ? 'rotate-180' : ''}`} />
        </Button>
        {showPaid && (
          <Card>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Invoice ID</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Paid Date</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paidInvoices.map((invoice) => (
                    <TableRow key={invoice.id}>
                      <TableCell>INV-2025-{invoice.id.toString().padStart(3, '0')}</TableCell>
                      <TableCell>₹{invoice.amount}</TableCell>
                      <TableCell>{invoice.paidDate}</TableCell>
                      <TableCell>{invoice.method}</TableCell>
                      <TableCell><Badge variant="default">Paid</Badge></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* PhonePe Modal */}
      {selectedInvoice && (
        <PhonePePaymentModal
          invoiceId={`INV-2025-${selectedInvoice.id.toString().padStart(3, '0')}`}
          amount={selectedInvoice.amount}
          open={showPhonePeModal}
          onClose={() => {
            setShowPhonePeModal(false);
            setSelectedInvoice(null);
          }}
          onSuccess={() => {
            setShowPhonePeModal(false);
            // Refresh invoices
            window.location.reload();
          }}
        />
      )}
    </>
  );
}