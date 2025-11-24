import React from 'react';
type CollapsibleCardProps = {
    title: string;
    subtext?: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
    className?: string;
    cta?: React.ReactNode;
};
export declare const CollapsibleCard: React.FC<CollapsibleCardProps>;
export {};
