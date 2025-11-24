import type { FC } from 'react';
interface ParentHeaderProps {
    name?: string;
    totalChildren?: number;
    onOpenKidsView?: () => void;
}
export declare const ParentHeader: FC<ParentHeaderProps>;
export {};
