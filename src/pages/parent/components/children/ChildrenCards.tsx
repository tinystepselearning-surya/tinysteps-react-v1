import React, { useState } from 'react';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { ParentChildSummary } from '../../../../types/Parent';
import { masteryLabel } from '../../../../lib/mastery';

interface ChildrenCardsProps {
  childrenData: ParentChildSummary[];
  onSelectChild: (child: ParentChildSummary) => void;
}

export const ChildrenCards: React.FC<ChildrenCardsProps> = ({ childrenData, onSelectChild }) => {
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const handleSelect = (child: ParentChildSummary) => {
    setSelectedId(child.id);
    onSelectChild(child);
  };

  if (!childrenData.length) {
    return (
      <Card className="p-6 text-center">
        <p className="text-sm text-muted-foreground">No children linked to your account yet.</p>
      </Card>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {childrenData.map((child) => (
        <Card key={child.id} className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">{child.fullName}</h3>
              <p className="text-sm text-muted-foreground">Grade {child.grade || 'N/A'}</p>
            </div>
            <Badge variant={child.status === 'on_break' ? 'secondary' : 'default'} className="capitalize">
              {child.status?.replace('_', ' ') || 'Active'}
            </Badge>
          </div>
          <div className="text-sm text-muted-foreground space-y-1">
            <p>Courses: {(child.courses || []).join(', ') || '—'}</p>
            <p>
              Phonics {masteryLabel(child.phonicsMastery)} · Grammar {masteryLabel(child.grammarMastery)} · Speaking{' '}
              {masteryLabel(child.speakingMastery)}
            </p>
          </div>
          <Button
            variant={selectedId === child.id ? 'default' : 'secondary'}
            className="w-full"
            onClick={() => handleSelect(child)}
          >
            {selectedId === child.id ? 'Viewing details' : 'View Details'}
          </Button>
        </Card>
      ))}
    </div>
  );
};
