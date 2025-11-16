import React from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';

interface ParentsListProps {
  lpId?: string;
}

interface Parent {
  id: string;
  name: string;
  email: string;
  phone: string;
  childrenCount: number;
  totalDue: number;
  lastPayment: string;
  status: 'active' | 'inactive';
}

export const ParentsList: React.FC<ParentsListProps> = ({ lpId }) => {
  // Mock data - in real implementation, fetch from Firestore
  const parents: Parent[] = [
    {
      id: '1',
      name: 'Parent Name',
      email: 'rajesh@example.com',
      phone: '+91 98765 43210',
      childrenCount: 2,
      totalDue: 4000,
      lastPayment: '2025-11-01',
      status: 'active',
    },
    {
      id: '2',
      name: 'Parent Name',
      email: 'email@example.com',
      phone: '+91 98765 43211',
      childrenCount: 1,
      totalDue: 2000,
      lastPayment: '2025-10-15',
      status: 'active',
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Assigned Parents</h2>
        <Button>Add Parent</Button>
      </div>

      <div className="grid gap-4">
        {parents.map((parent) => (
          <Card key={parent.id} className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold">{parent.name}</h3>
                  <Badge variant={parent.status === 'active' ? 'default' : 'secondary'}>
                    {parent.status}
                  </Badge>
                </div>
                <p className="text-muted-foreground">{parent.email}</p>
                <p className="text-muted-foreground">{parent.phone}</p>
                <div className="flex gap-4 text-sm">
                  <span>{parent.childrenCount} children</span>
                  <span>Last payment: {parent.lastPayment}</span>
                </div>
              </div>

              <div className="text-right space-y-2">
                <p className="text-lg font-semibold text-red-600">
                  ₹{parent.totalDue} due
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                  <Button variant="outline" size="sm">
                    Contact
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ParentsList;