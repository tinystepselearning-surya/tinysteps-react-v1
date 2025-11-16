import React from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';

interface WorksheetsListProps {
  kidId?: string;
}

interface Worksheet {
  id: string;
  title: string;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTime: number;
  completed: boolean;
  score?: number;
  icon: string;
}

export const WorksheetsList: React.FC<WorksheetsListProps> = ({ kidId }) => {
  // Mock data - in real implementation, fetch from Firestore
  const worksheets: Worksheet[] = [
    {
      id: '1',
      title: 'Letter A Practice',
      subject: 'Phonics',
      difficulty: 'Easy',
      estimatedTime: 10,
      completed: true,
      score: 95,
      icon: '🔤',
    },
    {
      id: '2',
      title: 'Short Vowel Sounds',
      subject: 'Phonics',
      difficulty: 'Medium',
      estimatedTime: 15,
      completed: true,
      score: 88,
      icon: '📝',
    },
    {
      id: '3',
      title: 'Simple Sentences',
      subject: 'Grammar',
      difficulty: 'Easy',
      estimatedTime: 12,
      completed: false,
      icon: '✏️',
    },
    {
      id: '4',
      title: 'Story Comprehension',
      subject: 'Reading',
      difficulty: 'Medium',
      estimatedTime: 20,
      completed: false,
      icon: '📖',
    },
    {
      id: '5',
      title: 'Word Families',
      subject: 'Phonics',
      difficulty: 'Medium',
      estimatedTime: 18,
      completed: false,
      icon: '🏠',
    },
  ];

  const getDifficultyColor = (difficulty: Worksheet['difficulty']) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hard':
        return 'bg-red-100 text-red-800';
    }
  };

  const completedWorksheets = worksheets.filter(w => w.completed);
  const pendingWorksheets = worksheets.filter(w => !w.completed);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">My Worksheets</h2>

      <div className="mb-6">
        <div className="flex items-center justify-center space-x-2 mb-4">
          <span className="text-3xl">📝</span>
          <span className="text-xl font-bold">
            {completedWorksheets.length} of {worksheets.length} Completed
          </span>
        </div>

        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-blue-400 h-3 rounded-full transition-all duration-500"
            style={{ width: `${(completedWorksheets.length / worksheets.length) * 100}%` }}
          />
        </div>
      </div>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-green-700">✅ Completed Worksheets</h3>
          <div className="space-y-3">
            {completedWorksheets.map((worksheet) => (
              <div
                key={worksheet.id}
                className="p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{worksheet.icon}</span>
                    <div>
                      <h4 className="font-semibold text-green-800">{worksheet.title}</h4>
                      <p className="text-sm text-green-600">{worksheet.subject}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getDifficultyColor(worksheet.difficulty)}>
                      {worksheet.difficulty}
                    </Badge>
                    <p className="text-sm text-green-700 mt-1">
                      Score: {worksheet.score}%
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-green-600">
                  <span>⏱️ {worksheet.estimatedTime} minutes</span>
                  <Button variant="outline" size="sm" className="text-green-700 border-green-300">
                    Review Again
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-blue-700">🎯 Available Worksheets</h3>
          <div className="space-y-3">
            {pendingWorksheets.map((worksheet) => (
              <div
                key={worksheet.id}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{worksheet.icon}</span>
                    <div>
                      <h4 className="font-semibold text-blue-800">{worksheet.title}</h4>
                      <p className="text-sm text-blue-600">{worksheet.subject}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge className={getDifficultyColor(worksheet.difficulty)}>
                      {worksheet.difficulty}
                    </Badge>
                  </div>
                </div>
                <div className="mt-2 flex items-center justify-between text-sm text-blue-600">
                  <span>⏱️ {worksheet.estimatedTime} minutes</span>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                    Start Now
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-purple-50 rounded-lg border border-purple-200">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🎨</span>
          <div>
            <p className="font-semibold text-purple-800">Practice Makes Perfect!</p>
            <p className="text-sm text-purple-700">
              Complete worksheets to strengthen your skills and earn more achievements.
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};