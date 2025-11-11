import React, { useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { ParentInvoice } from '../../../../types/Parent';
import { PaymentModal } from './PaymentModal';

interface InvoiceListProps {
  invoices: ParentInvoice[];
}

export const InvoiceList: React.FC<InvoiceListProps> = ({ invoices }) => {
  const [selectedInvoice, setSelectedInvoice] = useState<ParentInvoice | null>(null);

  const outstanding = useMemo(() => invoices.filter((invoice) => invoice.status !== 'paid'), [invoices]);

  if (!invoices.length) {
    return <Card className="p-6 text-sm text-muted-foreground">No invoices available.</Card>;
  }

  return (
    <>
      <Card className="p-6 space-y-4">
        <h3 className="text-lg font-semibold">Invoices & Payments</h3>
        {outstanding.length ? (
          outstanding.map((invoice) => (
            <div key={invoice.id} className="border rounded-lg p-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-semibold">Invoice {invoice.id}</p>
                <p className="text-sm text-muted-foreground">Due {invoice.dueDate}</p>
                <p className="text-sm text-muted-foreground">Status: {invoice.status}</p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold">₹{invoice.amount}</p>
                <Button className="mt-2" onClick={() => setSelectedInvoice(invoice)}>
                  Pay Now
                </Button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-sm text-muted-foreground">No outstanding invoices. Thank you!</p>
        )}
      </Card>
      <PaymentModal invoice={selectedInvoice} onClose={() => setSelectedInvoice(null)} />
    </>
  );
};
