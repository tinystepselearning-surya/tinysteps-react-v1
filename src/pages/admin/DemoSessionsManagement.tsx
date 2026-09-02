import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { useToast } from '@components/hooks/use-toast';
import { db } from '../../lib/firebaseConfig';
import type { DemoSession } from '../../types/models';
import { listenAllDemoSessions } from '../../services/demoSessionsService';
import LegacyDemoSessionsManagement from './LegacyDemoSessionsManagement';
import LeadFunnelTrendAnalysis from './LeadFunnelTrendAnalysis';
import AnalyticsV3CertificationSection from './AnalyticsV3CertificationSection';
import type { LeadFunnelLead } from './leadFunnelAnalytics';

interface DemoSessionsManagementProps {
  openCreateRequestSignal?: number;
  mode?: 'full' | 'trend_only';
  leads?: LeadFunnelLead[];
  demos?: DemoSession[];
  showTrendAnalytics?: boolean;
  analyticsStartKey?: string;
  analyticsEndKey?: string;
  analyticsVariant?: 'full' | 'summary';
}

type LeadSnapshotRecord = LeadFunnelLead & {
  archived?: boolean;
};

const isArchived = (value: { archived?: boolean } | null | undefined): boolean => value?.archived === true;

function LeadFunnelTrendContainer({
  prefetchedLeads,
  prefetchedDemos,
  startKey,
  endKey,
  variant = 'full',
}: {
  prefetchedLeads?: LeadFunnelLead[];
  prefetchedDemos?: DemoSession[];
  startKey?: string;
  endKey?: string;
  variant?: 'full' | 'summary';
}) {
  const { toast } = useToast();
  const [leads, setLeads] = useState<LeadSnapshotRecord[]>([]);
  const [demos, setDemos] = useState<DemoSession[]>([]);

  useEffect(() => {
    if (prefetchedLeads) return;
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
  }, [prefetchedLeads, toast]);

  useEffect(() => {
    if (prefetchedDemos) return;
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
  }, [prefetchedDemos, toast]);

  const resolvedLeads = prefetchedLeads || leads;
  const resolvedDemos = prefetchedDemos || demos;

  return (
    <>
      <LeadFunnelTrendAnalysis
        leads={resolvedLeads}
        demos={resolvedDemos}
        startKey={startKey}
        endKey={endKey}
        variant={variant}
      />
      {variant === 'full' ? (
        <div className="mt-4">
          <AnalyticsV3CertificationSection
            leads={resolvedLeads}
            demos={resolvedDemos}
            startKey={startKey}
            endKey={endKey}
          />
        </div>
      ) : null}
    </>
  );
}

export default function DemoSessionsManagement({
  openCreateRequestSignal = 0,
  mode = 'full',
  leads,
  demos,
  showTrendAnalytics = false,
  analyticsStartKey,
  analyticsEndKey,
  analyticsVariant = 'full',
}: DemoSessionsManagementProps) {
  if (mode === 'trend_only') {
    if (!showTrendAnalytics) return null;
    return (
      <LeadFunnelTrendContainer
        prefetchedLeads={leads}
        prefetchedDemos={demos}
        startKey={analyticsStartKey}
        endKey={analyticsEndKey}
        variant={analyticsVariant}
      />
    );
  }

  return (
    <LegacyDemoSessionsManagement
      openCreateRequestSignal={openCreateRequestSignal}
      mode="full"
    />
  );
}
