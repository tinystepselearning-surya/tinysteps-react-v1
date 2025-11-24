import React from 'react';
interface StatCardProps {
    label: string;
    value: number;
    suffix?: string;
    icon?: React.ReactNode;
    decimals?: number;
    className?: string;
}
declare const StatCard: React.FC<StatCardProps>;
export default StatCard;
