import React from 'react';
import { ParentChildSummary } from '../../../../types/Parent';
interface ChildrenCardsProps {
    childrenData: ParentChildSummary[];
    onSelectChild: (child: ParentChildSummary) => void;
}
export declare const ChildrenCards: React.FC<ChildrenCardsProps>;
export {};
