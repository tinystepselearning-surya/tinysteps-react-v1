import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { useToast } from '@components/hooks/use-toast';
import { db } from '../../lib/firebaseConfig';
import type { DemoSession } from '../../types/models';
import { listenAllDemoSessions } from '../../services/demoSessionsService';
import LegacyDemoSessionsManagement from './LegacyDemoSessionsManagement';
import LeadFunnelTrendAnalysis from './LeadFunnelTrendAnalysis';
import type { LeadFunnelLead } from './leadFunnelAnalytics';

interface DemoSessionsManagementProps {
  openCreateRequestSignal?: number;
  mode?: 'full' | 'trend_only';
}

type LeadSnapshotRecord = LeadFunnelLead & {
  archived?: boolean;
};

const isArchived = (value: { archived?: boolean } | null | undefined): boolean => value?.archived === true;

function LeadFunnelTrendContainer() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<LeadSnapshotRecord[]>([]);
  const [demos, setDemos] = useState<DemoSession[]>([]);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, 'leads'),
      (snapshot) => {
        const next = snapshot.docs
          .map((docSnap) => ({
            id: docSnap.id,
            ...(docSnap.data() as Omit<LeadSnapshotRecord, 'id'>),
          }))
          .filter((lead) => !isArchived(lead));
        setLeads(next);
      },
      (error) => {
        console.error('[LeadFunnelTrendContainer] leads load failed', error);
        toast({
          title: 'Failed to load lead analytics',
          description: error.message,
          variant: 'destructive',
        });
      },
    );
    return unsubscribe;
  }, [toast]);

  useEffect(() => {
    return listenAllDemoSessions(
      (next) => setDemos(next.filter((demo) => !isArchived(demo as DemoSession & { archived?: boolean }))),
      (error) => {
        console.error('[LeadFunnelTrendContainer] demos load failed', error);
        toast({
          title: 'Failed to load demo analytics',
          description: error.message,
          variant: 'destructive',
        });
      },
    );
  }, [toast]);

  return <LeadFunnelTrendAnalysis leads={leads} demos={demos} />;
}

export default function DemoSessionsManagement({
  openCreateRequestSignal = 0,
  mode = 'full',
}: DemoSessionsManagementProps) {
  if (mode === 'trend_only') {
    return <LeadFunnelTrendContainer />;
  }

  return (
    <LegacyDemoSessionsManagement
      openCreateRequestSignal={openCreateRequestSignal}
      mode="full"
    />
  );
}
