import React from 'react';
import { Card } from '@components/ui/card';
import { ParentPayment } from '../../../../types/Parent';

interface PaymentHistoryProps {
  payments: ParentPayment[];
}

export const PaymentHistory: React.FC<PaymentHistoryProps> = ({ payments }) => {
  if (!payments.length) {
    return <Card className="p-6 text-sm text-muted-foreground">No payment history yet.</Card>;
  }

  return (
    <Card className="p-6 space-y-3">
      <h3 className="text-lg font-semibold">Payment History</h3>
      {payments.slice(0, 5).map((payment) => (
        <div key={payment.id} className="border rounded-lg p-3 flex flex-col md:flex-row md:items-center md:justify-between text-sm">
          <div>
            <p className="font-medium">{payment.date}</p>
            <p className="text-muted-foreground">Invoice {payment.invoiceId}</p>
          </div>
          <div className="text-right">
            <p className="font-semibold">₹{payment.amount}</p>
            <p className="text-muted-foreground capitalize">{payment.status}</p>
          </div>
        </div>
      ))}
    </Card>
  );
};
