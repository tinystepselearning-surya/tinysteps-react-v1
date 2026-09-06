import React from 'react';
import ContentSeoAnalyticsSectionV2, {
  type ContentSeoAnalyticsSectionProps,
} from './ContentSeoAnalyticsSectionV2';

export type { ContentSeoAnalyticsSectionProps } from './ContentSeoAnalyticsSectionV2';

export default function ContentSeoAnalyticsSection(
  props: ContentSeoAnalyticsSectionProps,
): JSX.Element {
  const rangeKey = `${props.startDateKey || ''}:${props.endDateKey || ''}`;
  return <ContentSeoAnalyticsSectionV2 key={rangeKey} {...props} />;
}
