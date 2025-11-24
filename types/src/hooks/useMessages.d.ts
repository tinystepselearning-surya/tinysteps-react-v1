import { Conversation, Message } from '../types/Teacher';
export declare const useMessages: (teacherId?: string) => {
    conversations: Conversation[];
    messages: Message[];
    isLoading: boolean;
    error: Error | null;
    sendMessage: (conversationId: string, content: string) => Promise<void>;
};
