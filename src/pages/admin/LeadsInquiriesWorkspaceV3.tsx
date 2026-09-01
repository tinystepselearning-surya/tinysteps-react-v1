import React from 'react';
import LeadOperationalCommandCenter from './LeadOperationalCommandCenter';
import LeadsInquiriesWorkspaceV2, { type LeadsWorkspaceView } from './LeadsInquiriesWorkspaceV2';

export type { LeadsWorkspaceView } from './LeadsInquiriesWorkspaceV2';

interface LeadsInquiriesWorkspaceV3Props {
  view?: LeadsWorkspaceView;
  onViewChange?: (nextView: LeadsWorkspaceView) => void;
}

export default function LeadsInquiriesWorkspaceV3({
  view = 'leads',
  onViewChange,
}: LeadsInquiriesWorkspaceV3Props): JSX.Element {
  if (view === 'demos') {
    return <LeadsInquiriesWorkspaceV2 view={view} onViewChange={onViewChange} />;
  }

  return (
    <div className="space-y-4">
      <LeadOperationalCommandCenter />
      <div id="lead-workflow-core">
        <LeadsInquiriesWorkspaceV2 view={view} onViewChange={onViewChange} />
      </div>
    </div>
  );
}
