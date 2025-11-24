import React from 'react';
import { TeacherSession, AttendanceStatus } from '../../../../types/Teacher';
interface AttendanceFormProps {
    open: boolean;
    session: TeacherSession | null;
    onClose: () => void;
    onSubmit: (data: {
        attendance: Record<string, {
            status: AttendanceStatus;
            notes?: string;
            mastery?: number;
            topics?: string[];
        }>;
        sessionNotes: string;
    }) => Promise<void>;
}
export declare const AttendanceForm: React.FC<AttendanceFormProps>;
export {};
