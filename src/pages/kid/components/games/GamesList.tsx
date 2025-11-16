import React from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';

interface GamesListProps {
  kidId?: string;
}

interface Game {
  id: string;
  title: string;
  subject: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  estimatedTime: number;
  highScore?: number;
  lastPlayed?: string;
  icon: string;
  description: string;
  recommended: boolean;
}

export const GamesList: React.FC<GamesListProps> = ({ kidId }) => {
  // Mock data - in real implementation, fetch from Firestore
  const games: Game[] = [
    {
      id: '1',
      title: 'Letter Match',
      subject: 'Phonics',
      difficulty: 'Easy',
      estimatedTime: 8,
      highScore: 95,
      lastPlayed: '2024-01-30',
      icon: '🔤',
      description: 'Match letters with their sounds',
      recommended: true,
    },
    {
      id: '2',
      title: 'Word Builder',
      subject: 'Phonics',
      difficulty: 'Medium',
      estimatedTime: 12,
      highScore: 88,
      lastPlayed: '2024-01-29',
      icon: '🧱',
      description: 'Build words from letter blocks',
      recommended: false,
    },
    {
      id: '3',
      title: 'Story Time',
      subject: 'Reading',
      difficulty: 'Easy',
      estimatedTime: 15,
      highScore: 92,
      lastPlayed: '2024-01-28',
      icon: '📖',
      description: 'Read along with fun stories',
      recommended: true,
    },
    {
      id: '4',
      title: 'Grammar Quest',
      subject: 'Grammar',
      difficulty: 'Medium',
      estimatedTime: 10,
      icon: '⚔️',
      description: 'Adventure through grammar challenges',
      recommended: false,
    },
    {
      id: '5',
      title: 'Speaking Stars',
      subject: 'Public Speaking',
      difficulty: 'Easy',
      estimatedTime: 5,
      icon: '⭐',
      description: 'Practice speaking with confidence',
      recommended: false,
    },
    {
      id: '6',
      title: 'Rhyme Time',
      subject: 'Phonics',
      difficulty: 'Easy',
      estimatedTime: 6,
      highScore: 100,
      lastPlayed: '2024-01-30',
      icon: '🎵',
      description: 'Find words that rhyme',
      recommended: true,
    },
  ];

  const getDifficultyColor = (difficulty: Game['difficulty']) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'Hard':
        return 'bg-red-100 text-red-800';
    }
  };

  const recommendedGames = games.filter(g => g.recommended);
  const otherGames = games.filter(g => !g.recommended);

  return (
    <Card className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-center">Fun Learning Games</h2>

      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-semibold mb-4 text-purple-700">🎯 Recommended for You</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendedGames.map((game) => (
              <div
                key={game.id}
                className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg hover:bg-purple-100 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <span className="text-3xl">{game.icon}</span>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className="font-semibold text-purple-800">{game.title}</h4>
                      <Badge className="text-xs bg-purple-200 text-purple-800">
                        Recommended
                      </Badge>
                    </div>
                    <p className="text-sm text-purple-600 mb-2">{game.description}</p>
                    <div className="flex items-center justify-between text-xs text-purple-700 mb-3">
                      <span>{game.subject}</span>
                      <Badge className={getDifficultyColor(game.difficulty)}>
                        {game.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-purple-600">
                        ⏱️ {game.estimatedTime} min
                        {game.highScore && (
                          <span className="ml-2">🏆 {game.highScore}%</span>
                        )}
                      </div>
                      <Button size="sm" className="bg-purple-600 hover:bg-purple-700">
                        Play Now
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-4 text-blue-700">🎮 All Games</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherGames.map((game) => (
              <div
                key={game.id}
                className="p-4 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors"
              >
                <div className="flex items-start space-x-3">
                  <span className="text-2xl">{game.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-800 mb-1">{game.title}</h4>
                    <p className="text-sm text-blue-600 mb-2">{game.description}</p>
                    <div className="flex items-center justify-between text-xs text-blue-700 mb-3">
                      <span>{game.subject}</span>
                      <Badge className={getDifficultyColor(game.difficulty)}>
                        {game.difficulty}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-blue-600">
                        ⏱️ {game.estimatedTime} min
                        {game.highScore && (
                          <span className="ml-2">🏆 {game.highScore}%</span>
                        )}
                      </div>
                      <Button size="sm" variant="outline" className="border-blue-300 text-blue-700">
                        Play
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-8 p-4 bg-green-50 rounded-lg border border-green-200">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">🎲</span>
          <div>
            <p className="font-semibold text-green-800">Game On!</p>
            <p className="text-sm text-green-700">
              Play games to learn while having fun. Your scores help track your progress!
            </p>
          </div>
        </div>
      </div>
    </Card>
  );
};