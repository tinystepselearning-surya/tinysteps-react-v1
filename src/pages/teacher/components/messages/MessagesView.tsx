import React, { useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Badge } from '@components/ui/badge';
import { useMessages } from '../../hooks/useMessages';
import { Conversation, Message } from '../../../../types/Teacher';
import { format } from 'date-fns';

interface MessagesViewProps {
  teacherId?: string;
}

export const MessagesView: React.FC<MessagesViewProps> = ({ teacherId }) => {
  const { conversations, messages, isLoading, error, sendMessage } = useMessages(teacherId);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [newMessage, setNewMessage] = useState('');

  const conversationMessages = messages.filter(m =>
    selectedConversation?.participants.includes(m.fromId) &&
    selectedConversation?.participants.includes(m.toId)
  ).sort((a, b) => a.timestamp.toMillis() - b.timestamp.toMillis());

  const handleSend = async () => {
    if (!selectedConversation || !newMessage.trim()) return;
    await sendMessage(selectedConversation.id, newMessage);
    setNewMessage('');
  };

  if (isLoading) {
    return <Card className="p-6"><p>Loading messages...</p></Card>;
  }

  if (error) {
    return <Card className="p-6"><p className="text-red-500">{error.message}</p></Card>;
  }

  return (
    <div className="flex gap-6 h-[600px]">
      <div className="w-1/3">
        <Card className="p-4 h-full">
          <h3 className="font-semibold mb-4">Inbox</h3>
          <div className="space-y-2 overflow-y-auto">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-3 rounded cursor-pointer ${
                  selectedConversation?.id === conv.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
                onClick={() => setSelectedConversation(conv)}
              >
                <div className="flex justify-between">
                  <p className="font-medium">{conv.id}</p>
                  {conv.unreadCount > 0 && (
                    <Badge variant="destructive">{conv.unreadCount}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground truncate">
                  {conv.lastMessage.content}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(conv.lastMessage.timestamp.toDate(), 'MMM d, h:mm a')}
                </p>
              </div>
            ))}
          </div>
        </Card>
      </div>
      <div className="flex-1">
        <Card className="p-4 h-full flex flex-col">
          {selectedConversation ? (
            <>
              <h3 className="font-semibold mb-4">{selectedConversation.id}</h3>
              <div className="flex-1 overflow-y-auto space-y-2 mb-4">
                {conversationMessages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-3 rounded max-w-md ${
                      msg.fromId === teacherId ? 'ml-auto bg-blue-100' : 'bg-gray-100'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(msg.timestamp.toDate(), 'h:mm a')}
                    </p>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Textarea
                  placeholder="Type your message..."
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  className="flex-1"
                />
                <Button onClick={handleSend}>Send</Button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">Select a conversation to view messages</p>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};