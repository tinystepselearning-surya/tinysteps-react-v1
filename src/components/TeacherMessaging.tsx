import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Badge } from '@components/ui/badge';

const TeacherMessaging: React.FC = () => {
  const [selectedTeacher, setSelectedTeacher] = React.useState('');
  const [message, setMessage] = React.useState('');

  // Do not include demo teacher or child names in the build.
  const teachers: { id: string; name: string; child?: string; lastMessage?: string; unread?: number; online?: boolean }[] = [];

  const messages: { id: number; sender: 'teacher' | 'parent'; text: string; time?: string; attachments?: string[] }[] = [];

  const handleSendMessage = () => {
    console.log('Sending message:', message);
    setMessage('');
  };

  return (
    <div className="p-4 flex gap-4">
      {/* Teacher List */}
      <Card className="w-1/3">
        <CardHeader>
          <CardTitle>Teachers</CardTitle>
        </CardHeader>
        <CardContent>
          {teachers.length === 0 && <p className="text-sm text-gray-500">No teachers found. Connect a teacher to start messaging.</p>}
          {teachers.map(teacher => (
            <div
              key={teacher.id}
              className={`p-2 cursor-pointer rounded ${selectedTeacher === teacher.id ? 'bg-blue-100' : ''}`}
              onClick={() => setSelectedTeacher(teacher.id)}
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold">
                  {teacher.name[0]}
                </div>
                <div>
                  <p className="font-bold">{teacher.name}</p>
                  <p className="text-sm text-gray-600">{teacher.child}</p>
                  <p className="text-sm">{teacher.lastMessage}</p>
                </div>
                {teacher.unread > 0 && <Badge>{teacher.unread}</Badge>}
                <Badge variant={teacher.online ? 'default' : 'secondary'}>
                  {teacher.online ? 'Online' : 'Offline'}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Chat */}
      <Card className="flex-1">
        <CardHeader>
          <CardTitle>Messages</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col h-96">
          <div className="flex-1 overflow-y-auto">
            {messages.map(msg => (
              <div key={msg.id} className={`mb-2 ${msg.sender === 'parent' ? 'text-right' : 'text-left'}`}>
                <div className={`inline-block p-2 rounded ${msg.sender === 'parent' ? 'bg-blue-200' : 'bg-gray-200'}`}>
                  <p>{msg.text}</p>
                  {msg.attachments.map(att => <p key={att} className="text-sm underline">{att}</p>)}
                  <p className="text-xs">{msg.time}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type a message..."
            />
            <Button onClick={handleSendMessage}>Send</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherMessaging;