import React from 'react';
export type DayItem = {
    day?: number | string;
    title?: string;
    learns?: string[];
    activities?: string[];
    homework?: string[];
};
export type WeekItem = {
    title: string;
    focus?: string;
    learns?: string[];
    activities?: string[];
    homework?: string[];
    mastery?: string;
    days?: DayItem[];
};
export declare const WeekAccordion: React.FC<{
    items: WeekItem[];
} & {
    defaultOpenAll?: boolean;
}>;
