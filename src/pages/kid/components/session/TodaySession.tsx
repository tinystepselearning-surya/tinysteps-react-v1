import React from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Clock, Video, Users } from 'lucide-react';

interface TodaySessionProps {
  kidId?: string;
}

interface SessionInfo {
  id: string;
  subject: string;
  teacherName: string;
  time: string;
  duration: number;
  joinUrl: string;
  isGroup: boolean;
  status: 'upcoming' | 'starting' | 'in-progress';
}

export const TodaySession: React.FC<TodaySessionProps> = ({ kidId }) => {
  // Mock data - in real implementation, fetch from Firestore
  const session: SessionInfo = {
    id: 'session-1',
    subject: 'Phonics Fun',
    teacherName: 'Ms. Sarah',
    time: '10:00 AM',
    duration: 35,
    joinUrl: 'https://zoom.us/j/123456789',
    isGroup: false,
    status: 'upcoming',
  };

  const getStatusColor = (status: SessionInfo['status']) => {
    switch (status) {
      case 'in-progress':
        return 'bg-green-100 text-green-800';
      case 'starting':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: SessionInfo['status']) => {
    switch (status) {
      case 'in-progress':
        return 'Class in Progress';
      case 'starting':
        return 'Starting Soon';
      default:
        return 'Upcoming';
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold text-blue-800">Today's Session</h2>
        <Badge className={getStatusColor(session.status)}>
          {getStatusText(session.status)}
        </Badge>
      </div>

      <div className="space-y-4">
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
            📚
          </div>
          <div>
            <h3 className="text-xl font-semibold">{session.subject}</h3>
            <p className="text-gray-600">with {session.teacherName}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Clock className="w-5 h-5 text-blue-600" />
            <span className="font-medium">{session.time}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Video className="w-5 h-5 text-blue-600" />
            <span className="font-medium">{session.duration} minutes</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="font-medium">
            {session.isGroup ? 'Group Class' : '1-on-1 Session'}
          </span>
        </div>

        <div className="pt-4 border-t">
          <Button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 text-lg"
            onClick={() => window.open(session.joinUrl, '_blank')}
          >
            🚀 Join Class Now
          </Button>
        </div>
      </div>
    </Card>
  );
};