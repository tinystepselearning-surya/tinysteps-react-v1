import React from 'react';
type SmartCardProps = {
    title: string;
    description?: string;
    badge?: string;
    cta?: React.ReactNode;
    children?: React.ReactNode;
    className?: string;
};
export default function SmartCard({ title, description, badge, cta, children, className }: SmartCardProps): import("react/jsx-runtime").JSX.Element;
export {};
