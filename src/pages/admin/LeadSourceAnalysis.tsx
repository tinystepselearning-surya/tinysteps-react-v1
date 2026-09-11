import React from 'react';
import LeadSourceAnalysisV5, { type LeadSourceAnalysisProps } from './LeadSourceAnalysisV5';
import ExternalTrafficAnalyticsSection from './ExternalTrafficAnalyticsSection';
import ContentSeoAnalyticsSection from './ContentSeoAnalyticsSection';

export type { LeadSourceAnalysisProps } from './LeadSourceAnalysisV5';

export default function LeadSourceAnalysis(props: LeadSourceAnalysisProps): JSX.Element {
  return (
    <div className="space-y-4">
      <LeadSourceAnalysisV5 {...props} />
      {props.showAttribution !== false ? (
        <>
          <ExternalTrafficAnalyticsSection
            startDateKey={props.startDateKey}
            endDateKey={props.endDateKey}
          />
          <ContentSeoAnalyticsSection
            startDateKey={props.startDateKey}
            endDateKey={props.endDateKey}
          />
        </>
      ) : null}
    </div>
  );
}
