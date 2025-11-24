import React from 'react';
interface Stat {
    value: string | number;
    label: string;
}
interface ModernCardProps {
    title: string;
    description: string;
    icon?: React.ReactNode;
    image?: string;
    color?: string;
    hoverEffect?: 'lift' | 'glow' | 'scale';
    delay?: number;
    onClick?: () => void;
    badge?: string;
    stats?: Stat[];
    gradient?: boolean;
}
export declare const ModernCard: React.FC<ModernCardProps>;
export {};
