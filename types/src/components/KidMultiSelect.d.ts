interface KidOption {
    id: string;
    name: string;
}
interface Props {
    value?: string[];
    onChange: (ids: string[]) => void;
    kids: KidOption[];
    placeholder?: string;
}
export default function KidMultiSelect({ value, onChange, kids, placeholder }: Props): import("react/jsx-runtime").JSX.Element;
export {};
