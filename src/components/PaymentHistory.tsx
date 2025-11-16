import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';

const PaymentHistory: React.FC = () => {
  const [filterDate, setFilterDate] = React.useState('');
  const [filterStatus, setFilterStatus] = React.useState('');
  const [filterMethod, setFilterMethod] = React.useState('');

  const payments = [
    { id: 1, invoiceId: 'INV-2025-001', amount: 2000, date: '2025-11-01', method: 'UPI', status: 'Paid' },
    { id: 2, invoiceId: 'INV-2025-002', amount: 1500, date: '2025-10-15', method: 'Bank Transfer', status: 'Paid' },
    { id: 3, invoiceId: 'INV-2025-003', amount: 1000, date: '2025-09-20', method: 'Credit Card', status: 'Refunded' },
  ];

  const filteredPayments = payments.filter(payment => {
    return (!filterDate || payment.date.includes(filterDate)) &&
           (!filterStatus || payment.status === filterStatus) &&
           (!filterMethod || payment.method === filterMethod);
  });

  const handleExport = () => {
    // Implement CSV export
    console.log('Exporting to CSV');
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Payment History</h1>

      {/* Filters */}
      <Card className="mb-4">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <Input
              type="date"
              placeholder="Filter by date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
            />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Paid">Paid</SelectItem>
                <SelectItem value="Refunded">Refunded</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterMethod} onValueChange={setFilterMethod}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Credit Card">Credit Card</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport}>Export CSV</Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Invoice ID</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Date Paid</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Receipt</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPayments.map((payment) => (
                <TableRow key={payment.id}>
                  <TableCell>{payment.invoiceId}</TableCell>
                  <TableCell>₹{payment.amount}</TableCell>
                  <TableCell>{payment.date}</TableCell>
                  <TableCell>{payment.method}</TableCell>
                  <TableCell>
                    <Badge variant={payment.status === 'Paid' ? 'default' : 'secondary'}>
                      {payment.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Button variant="outline" size="sm">Download</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentHistory;