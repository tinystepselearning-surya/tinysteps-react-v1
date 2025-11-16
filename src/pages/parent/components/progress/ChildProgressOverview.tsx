import React from 'react';
import { Card } from '@components/ui/card';
import { ChildProgressSnapshot } from '../../../../types/Parent';
import { cn } from '@components/lib/utils';

interface ChildProgressOverviewProps {
  progress: ChildProgressSnapshot[];
}

const getBarColor = (value: number) => {
  if (value >= 67) return 'bg-emerald-500';
  if (value >= 34) return 'bg-amber-400';
  return 'bg-rose-400';
};

export const ChildProgressOverview: React.FC<ChildProgressOverviewProps> = ({ progress }) => {
  if (!progress.length) {
    return <Card className="p-6 text-sm text-muted-foreground">No progress data yet.</Card>;
  }

  return (
    <div className="space-y-4">
      {progress.map((snapshot) => (
        <Card key={snapshot.childId} className="p-4 space-y-3">
          <div>
            <h3 className="text-lg font-semibold">{snapshot.childName}</h3>
            {snapshot.recommendations && (
              <p className="text-sm text-muted-foreground">{snapshot.recommendations}</p>
            )}
          </div>
          {['phonics', 'grammar', 'speaking'].map((topic) => (
            <div key={topic}>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>{topic.charAt(0).toUpperCase() + topic.slice(1)}</span>
                <span>{Number(snapshot[topic as keyof typeof snapshot])}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full">
                <div
                  className={cn('h-2 rounded-full', getBarColor(Number(snapshot[topic as keyof typeof snapshot]) as number))}
                  style={{ width: `${Number(snapshot[topic as keyof typeof snapshot])}%` }}
                />
              </div>
            </div>
          ))}
          {snapshot.recentActivities && snapshot.recentActivities.length > 0 && (
            <div className="text-xs text-muted-foreground">
              <p className="font-semibold">Recent Activities</p>
              <ul className="list-disc ml-4">
                {snapshot.recentActivities.map((activity) => (
                  <li key={activity}>{activity}</li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      ))}
    </div>
  );
};
