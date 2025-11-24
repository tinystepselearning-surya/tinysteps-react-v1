import { Message, Conversation } from '../../../types/Teacher';
interface UseMessagesResult {
    conversations: Conversation[];
    messages: Message[];
    isLoading: boolean;
    error: Error | null;
    sendMessage: (toId: string, content: string, attachments?: any[]) => Promise<void>;
    markAsRead: (messageId: string) => Promise<void>;
}
export declare const useMessages: (teacherId?: string) => UseMessagesResult;
export {};
