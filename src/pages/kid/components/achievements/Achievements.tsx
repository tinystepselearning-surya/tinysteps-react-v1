import React from 'react';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';

interface AchievementsProps {
  kidId?: string;
}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned: boolean;
  earnedDate?: string;
  category: string;
}

export const Achievements: React.FC<AchievementsProps> = ({ kidId }) => {
  // Mock data - in real implementation, fetch from Firestore
  const achievements: Achievement[] = [
    {
      id: '1',
      title: 'First Letter',
      description: 'Learned your first letter sound!',
      icon: '🔤',
      earned: true,
      earnedDate: '2024-01-15',
      category: 'Phonics',
    },
    {
      id: '2',
      title: 'Word Builder',
      description: 'Built your first 5-letter word',
      icon: '🧱',
      earned: true,
      earnedDate: '2024-01-20',
      category: 'Phonics',
    },
    {
      id: '3',
      title: 'Story Teller',
      description: 'Told your first complete story',
      icon: '📖',
      earned: true,
      earnedDate: '2024-01-25',
      category: 'Speaking',
    },
    {
      id: '4',
      title: 'Grammar Guru',
      description: 'Mastered basic sentence structure',
      icon: '🎓',
      earned: false,
      category: 'Grammar',
    },
    {
      id: '5',
      title: 'Reading Champion',
      description: 'Read a full story without help',
      icon: '🏆',
      earned: false,
      category: 'Reading',
    },
    {
      id: '6',
      title: 'Perfect Attendance',
      description: 'Attended all classes this month',
      icon: '📅',
      earned: true,
      earnedDate: '2024-01-30',
      category: 'Attendance',
    },
  ];

  const earnedAchievements = achievements.filter(a => a.earned);
  const upcomingAchievements = achievements.filter(a => !a.earned);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">My Achievements</h2>

      <div className="mb-6">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-3xl">🏆</span>
          <span className="text-xl font-bold">
            {earnedAchievements.length} of {achievements.length} Earned
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-yellow-400 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(earnedAchievements.length / achievements.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-green-700">🎉 Earned Badges</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {earnedAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="p-4 bg-green-50 border-2 border-green-200 rounded-lg text-center hover:bg-green-100 transition-colors"
              >
                <div className="text-4xl mb-2">{achievement.icon}</div>
                <h4 className="font-semibold text-green-800">{achievement.title}</h4>
                <p className="text-sm text-green-600 mb-2">{achievement.description}</p>
                <Badge variant="secondary" className="text-xs">
                  {achievement.category}
                </Badge>
                {achievement.earnedDate && (
                  <p className="text-xs text-gray-500 mt-1">
                    Earned {new Date(achievement.earnedDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-blue-700">🎯 Next Goals</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {upcomingAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className="p-4 bg-gray-50 border-2 border-gray-200 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="text-3xl opacity-50">{achievement.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-700">{achievement.title}</h4>
                    <p className="text-sm text-gray-600">{achievement.description}</p>
                    <Badge variant="outline" className="text-xs mt-1">
                      {achievement.category}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">💪</span>
          <div>
            <p className="font-semibold text-blue-800">Keep Learning!</p>
            <p className="text-sm text-blue-700">
              You're doing great! Complete more activities to earn new badges.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};