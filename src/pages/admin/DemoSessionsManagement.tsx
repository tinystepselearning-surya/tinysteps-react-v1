import React, { useEffect, useState } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { useToast } from '@components/hooks/use-toast';
import { Card } from '@components/ui/card';
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
  const [leadsReady, setLeadsReady] = useState(false);
  const [demosReady, setDemosReady] = useState(false);
  const [leadError, setLeadError] = useState<string | null>(null);
  const [demoError, setDemoError] = useState<string | null>(null);

  useEffect(() => {
    if (prefetchedLeads) return;
    setLeadsReady(false);
    setLeadError(null);
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
        setLeadError(null);
        setLeadsReady(true);
      },
      (error) => {
        console.error('[LeadFunnelTrendContainer] leads load failed', error);
        setLeads([]);
        setLeadError(error.message || 'Lead analytics source could not be loaded.');
        setLeadsReady(false);
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
    setDemosReady(false);
    setDemoError(null);
    return listenAllDemoSessions(
      (next) => {
        setDemos(next.filter((demo) => !isArchived(demo as DemoSession & { archived?: boolean })));
        setDemoError(null);
        setDemosReady(true);
      },
      (error) => {
        console.error('[LeadFunnelTrendContainer] demos load failed', error);
        setDemos([]);
        setDemoError(error.message || 'Demo analytics source could not be loaded.');
        setDemosReady(false);
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
  const resolvedLeadsReady = Boolean(prefetchedLeads) || leadsReady;
  const resolvedDemosReady = Boolean(prefetchedDemos) || demosReady;
  const sourceError = leadError || demoError;

  if (sourceError) {
    return (
      <Card role="alert" className="border-rose-200 bg-rose-50 p-5 text-rose-900">
        <h3 className="text-sm font-semibold">Growth &amp; Admissions analytics unavailable</h3>
        <p className="mt-1 text-xs leading-5">
          {sourceError} Funnel totals and Brick 8 certification are withheld so a failed read cannot look like legitimate zero performance.
        </p>
      </Card>
    );
  }

  if (!resolvedLeadsReady || !resolvedDemosReady) {
    return (
      <Card role="status" aria-live="polite" className="border-slate-200 bg-white p-5">
        <div className="text-sm font-semibold text-slate-900">Loading Growth &amp; Admissions analytics…</div>
        <p className="mt-1 text-xs text-slate-500">Waiting for both lead and demo snapshots before showing funnel metrics.</p>
      </Card>
    );
  }

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
