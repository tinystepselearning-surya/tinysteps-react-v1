import type { ReactNode } from "react";
type Item = {
    question: string;
    answer: ReactNode;
};
type Props = {
    items: Item[];
};
export default function Accordion({ items }: Props): import("react/jsx-runtime").JSX.Element;
export {};
//# sourceMappingURL=Accordion.d.ts.map