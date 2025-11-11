import React, { useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { useAuthStore } from '../../store/useAuthStore';
import { useParentChildren } from './hooks/useParentChildren';
import { useUpcomingSessions } from './hooks/useUpcomingSessions';
import { useInvoices, usePaymentHistory } from './hooks/useInvoices';
import { useChildProgress } from './hooks/useChildProgress';
import { ParentHeader } from './components/layout/ParentHeader';
import { ChildrenCards } from './components/children/ChildrenCards';
import { ChildDetail } from './components/children/ChildDetail';
import { UpcomingSessionsList } from './components/sessions/UpcomingSessionsList';
import { InvoiceList } from './components/payments/InvoiceList';
import { PaymentHistory } from './components/payments/PaymentHistory';
import { ChildProgressOverview } from './components/progress/ChildProgressOverview';
import { ParentChildSummary } from '../../types/Parent';

const AccessNotice = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center h-screen bg-muted/30">
    <Card className="p-8 text-center space-y-2 max-w-md">{children}</Card>
  </div>
);

export default function ParentDashboard() {
  const { user, isLoading } = useAuthStore();
  const parentId = user?.uid;
  const [selectedChild, setSelectedChild] = useState<ParentChildSummary | null>(null);

  const {
    data: children = [],
    isLoading: childrenLoading,
  } = useParentChildren(parentId);
  const childIds = useMemo(() => children.map((child) => child.id), [children]);

  const { data: sessions = [], isLoading: sessionsLoading } = useUpcomingSessions(childIds);
  const { data: invoices = [], isLoading: invoicesLoading } = useInvoices(parentId);
  const { data: payments = [] } = usePaymentHistory(parentId);
  const { data: progress = [], isLoading: progressLoading } = useChildProgress(childIds);

  React.useEffect(() => {
    if (!selectedChild && children.length) {
      setSelectedChild(children[0]);
    }
  }, [children, selectedChild]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="p-6">Checking permissions...</Card>
      </div>
    );
  }

  if (!user || user.role !== 'parent') {
    return <AccessNotice>You do not have permission to access the parent dashboard.</AccessNotice>;
  }

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8 space-y-6">
      <ParentHeader name={user.displayName || user.email} totalChildren={children.length} />

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-4">
          {childrenLoading ? (
            <Card className="p-6 text-sm text-muted-foreground">Loading children...</Card>
          ) : (
            <ChildrenCards childrenData={children} onSelectChild={setSelectedChild} />
          )}
        </div>
        <ChildDetail child={selectedChild} />
      </section>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          {sessionsLoading ? (
            <Card className="p-6 text-sm text-muted-foreground">Loading sessions...</Card>
          ) : (
            <UpcomingSessionsList sessions={sessions} />
          )}
        </div>
        <div className="space-y-4">
          {invoicesLoading ? (
            <Card className="p-6 text-sm text-muted-foreground">Loading invoices...</Card>
          ) : (
            <InvoiceList invoices={invoices} />
          )}
          <PaymentHistory payments={payments} />
        </div>
      </section>

      <section>
        {progressLoading ? (
          <Card className="p-6 text-sm text-muted-foreground">Loading progress...</Card>
        ) : (
          <ChildProgressOverview progress={progress} />
        )}
      </section>
    </div>
  );
}
