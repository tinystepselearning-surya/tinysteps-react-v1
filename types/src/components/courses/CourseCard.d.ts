import React from 'react';
type CourseCardProps = {
    icon: string;
    name: string;
    slug?: string;
    track: 'phonics' | 'grammar' | 'speaking';
    age: string;
    duration: string;
    frequency: string;
    level: string;
    overview: string[];
    outcomes: string[];
    price: string;
    reviews?: string;
};
export declare const CourseCard: React.FC<CourseCardProps>;
export {};
