import React, { useMemo, useState } from 'react';
import { Input } from '@components/ui/input';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from '@components/ui/dropdown-menu';
import { Button } from '@components/ui/button';
import { cn } from '@components/lib/utils';

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

export default function KidMultiSelect({ value = [], onChange, kids, placeholder = 'Assign kids...' }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return kids;
    return kids.filter(k => (k.name || k.id).toLowerCase().includes(term));
  }, [search, kids]);

  const selectedNames = useMemo(() => {
    const map = new Map(kids.map(k => [k.id, k]));
    return (value || []).map(id => map.get(id)?.name || id);
  }, [value, kids]);

  const toggleId = (id: string, checked: boolean) => {
    const s = new Set(value || []);
    if (checked) s.add(id);
    else s.delete(id);
    onChange(Array.from(s));
  };

  const clear = () => onChange([]);

  return (
    <div className="w-full">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <div className="flex items-center w-full gap-2">
            <Input
              readOnly
              value={selectedNames.join(', ')}
              placeholder={placeholder}
              className={cn('cursor-pointer')}
            />
          </div>
        </DropdownMenuTrigger>

        <DropdownMenuContent className="w-[320px]">
          <div className="p-2">
            <Input placeholder="Search kids..." value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <div className="max-h-48 overflow-y-auto p-1">
            {filtered.map(k => (
              <DropdownMenuCheckboxItem
                key={k.id}
                checked={(value || []).includes(k.id)}
                onCheckedChange={(checked) => toggleId(k.id, !!checked)}
              >
                {k.name || k.id}
              </DropdownMenuCheckboxItem>
            ))}
            {filtered.length === 0 && (
              <div className="px-3 py-2 text-sm text-muted-foreground">No matching kids</div>
            )}
          </div>
          <div className="p-2 flex justify-between">
            <Button variant="ghost" size="sm" onClick={() => onChange(kids.map(k => k.id))}>Select all</Button>
            <Button variant="ghost" size="sm" onClick={clear}>Clear</Button>
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
