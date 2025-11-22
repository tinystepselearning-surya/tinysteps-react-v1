import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Input } from '@components/ui/input';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuCheckboxItem, } from '@components/ui/dropdown-menu';
import { Button } from '@components/ui/button';
import { cn } from '@components/lib/utils';
export default function KidMultiSelect({ value = [], onChange, kids, placeholder = 'Assign kids...' }) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const filtered = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term)
            return kids;
        return kids.filter(k => (k.name || k.id).toLowerCase().includes(term));
    }, [search, kids]);
    const selectedNames = useMemo(() => {
        const map = new Map(kids.map(k => [k.id, k]));
        return (value || []).map(id => { var _a; return ((_a = map.get(id)) === null || _a === void 0 ? void 0 : _a.name) || id; });
    }, [value, kids]);
    const toggleId = (id, checked) => {
        const s = new Set(value || []);
        if (checked)
            s.add(id);
        else
            s.delete(id);
        onChange(Array.from(s));
    };
    const clear = () => onChange([]);
    return (_jsx("div", { className: "w-full", children: _jsxs(DropdownMenu, { open: open, onOpenChange: setOpen, children: [_jsx(DropdownMenuTrigger, { asChild: true, children: _jsx("div", { className: "flex items-center w-full gap-2", children: _jsx(Input, { readOnly: true, value: selectedNames.join(', '), placeholder: placeholder, className: cn('cursor-pointer') }) }) }), _jsxs(DropdownMenuContent, { className: "w-[320px]", children: [_jsx("div", { className: "p-2", children: _jsx(Input, { placeholder: "Search kids...", value: search, onChange: (e) => setSearch(e.target.value) }) }), _jsxs("div", { className: "max-h-48 overflow-y-auto p-1", children: [filtered.map(k => (_jsx(DropdownMenuCheckboxItem, { checked: (value || []).includes(k.id), onCheckedChange: (checked) => toggleId(k.id, !!checked), children: k.name || k.id }, k.id))), filtered.length === 0 && (_jsx("div", { className: "px-3 py-2 text-sm text-muted-foreground", children: "No matching kids" }))] }), _jsxs("div", { className: "p-2 flex justify-between", children: [_jsx(Button, { variant: "ghost", size: "sm", onClick: () => onChange(kids.map(k => k.id)), children: "Select all" }), _jsx(Button, { variant: "ghost", size: "sm", onClick: clear, children: "Clear" })] })] })] }) }));
}
