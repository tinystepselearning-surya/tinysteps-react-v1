import React from 'react';
import { Card } from '@components/ui/card';
import { ParentChildSummary } from '../../../../types/Parent';

interface ChildDetailProps {
  child?: ParentChildSummary | null;
}

export const ChildDetail: React.FC<ChildDetailProps> = ({ child }) => {
  if (!child) {
    return (
      <Card className="p-6 text-muted-foreground text-sm">
        Select a child to see more information.
      </Card>
    );
  }

  return (
    <Card className="p-6 space-y-3">
      <h3 className="text-lg font-semibold">{child.fullName}</h3>
      <div className="text-sm text-muted-foreground space-y-1">
        <p>Grade: {child.grade || 'N/A'}</p>
        <p>Status: {child.status || 'active'}</p>
        <p>Courses: {(child.courses || []).join(', ') || '—'}</p>
      </div>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-muted-foreground">Phonics</p>
          <p className="text-2xl font-semibold">{child.phonicsMastery ?? 0}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Grammar</p>
          <p className="text-2xl font-semibold">{child.grammarMastery ?? 0}%</p>
        </div>
        <div>
          <p className="text-xs text-muted-foreground">Speaking</p>
          <p className="text-2xl font-semibold">{child.speakingMastery ?? 0}%</p>
        </div>
      </div>
    </Card>
  );
};
