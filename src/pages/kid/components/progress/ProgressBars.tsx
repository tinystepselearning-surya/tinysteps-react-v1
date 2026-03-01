import type { FC } from 'react';
import { Card } from '@components/ui/card';
import { masteryLabel, masteryPctFromKey } from '../../../../lib/mastery';

interface ProgressBarsProps {
  kidId?: string;
}

interface SubjectProgress {
  subject: string;
  progress: number;
  level: string;
  color: string;
  icon: string;
}

export const ProgressBars: FC<ProgressBarsProps> = ({ kidId }) => {
  // Mock data - in real implementation, fetch from Firestore
  const subjects: SubjectProgress[] = [
    {
      subject: 'Phonics',
      progress: 75,
      level: 'Level 2',
      color: 'bg-blue-500',
      icon: '🔤',
    },
    {
      subject: 'Grammar',
      progress: 60,
      level: 'Level 1',
      color: 'bg-green-500',
      icon: '📝',
    },
    {
      subject: 'Public Speaking',
      progress: 45,
      level: 'Level 1',
      color: 'bg-purple-500',
      icon: '🎤',
    },
    {
      subject: 'Reading',
      progress: 85,
      level: 'Level 3',
      color: 'bg-orange-500',
      icon: '📖',
    },
  ];

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">My Learning Progress</h2>

      <div className="space-y-6">
        {subjects.map((subject) => (
          <div key={subject.subject} className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">{subject.icon}</span>
                <div>
                  <h3 className="font-semibold text-lg">{subject.subject}</h3>
                  <p className="text-sm text-gray-600">{subject.level}</p>
                </div>
              </div>
              <span className="text-lg font-bold text-blue-600">
                {masteryLabel(subject.progress)}
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all duration-500 ${subject.color}`}
                style={{ width: `${masteryPctFromKey(subject.progress)}%` }}
              />
            </div>

            <div className="flex justify-between text-sm text-gray-500">
              <span>Keep going! 🎉</span>
              <span>{masteryLabel(subject.progress)}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">⭐</span>
          <div>
            <p className="font-semibold text-yellow-800">Great Progress!</p>
            <p className="text-sm text-yellow-700">
              You're doing amazing! Keep practicing to unlock new levels.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};
