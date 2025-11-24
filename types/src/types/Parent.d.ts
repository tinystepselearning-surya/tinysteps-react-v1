import { Timestamp } from 'firebase/firestore';
export interface ParentChildSummary {
    id: string;
    fullName: string;
    grade?: string;
    avatarUrl?: string;
    courses?: string[];
    status?: 'active' | 'on_break' | 'completed';
    phonicsMastery?: number;
    grammarMastery?: number;
    speakingMastery?: number;
}
export interface ParentSession {
    id: string;
    kidId: string;
    kidName: string;
    courseName: string;
    date: string;
    startTime: string;
    status: 'scheduled' | 'in_progress' | 'completed';
    teacherName?: string;
    joinUrl?: string;
}
export interface ParentInvoiceLineItem {
    enrollmentId: string;
    sessionCount: number;
    rate: number;
    subtotal: number;
}
export interface ParentInvoice {
    id: string;
    parentId: string;
    amount: number;
    dueDate: string;
    status: 'issued' | 'paid' | 'overdue';
    lineItems: ParentInvoiceLineItem[];
    createdAt?: Timestamp;
    paidAt?: Timestamp;
}
export interface ParentPayment {
    id: string;
    invoiceId: string;
    amount: number;
    date: string;
    method: string;
    status: 'completed' | 'refunded';
    receiptUrl?: string;
}
export interface ChildProgressSnapshot {
    childId: string;
    childName: string;
    phonics: number;
    grammar: number;
    speaking: number;
    recommendations?: string;
    recentActivities?: string[];
    timeline?: Array<{
        date: string;
        label: string;
    }>;
}
