import React from 'react';
import { TeacherSession } from '../../../../types/Teacher';
interface SessionCardProps {
    session: TeacherSession;
    onMarkAttendance: (session: TeacherSession) => void;
    onComplete: (sessionId: string) => Promise<void>;
}
export declare const SessionCard: React.FC<SessionCardProps>;
export {};
