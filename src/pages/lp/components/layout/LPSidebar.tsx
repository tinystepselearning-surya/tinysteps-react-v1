import type { FC } from 'react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';

interface LPSidebarProps {
  active: string;
  onSelect: (tab: string) => void;
}

const MENU_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'parents', label: 'Parents', icon: '👨‍👩‍👧‍👦' },
  { id: 'teachers', label: 'Teachers', icon: '👩‍🏫' },
  { id: 'tickets', label: 'Support Tickets', icon: '🎫' },
  { id: 'performance', label: 'Performance', icon: '📈' },
  { id: 'region', label: 'Regional Data', icon: '🌍' },
];

export const LPSidebar: FC<LPSidebarProps> = ({ active, onSelect }) => {
  return (
    <aside className="w-64 hidden lg:block">
      <Card className="p-4">
        <nav className="space-y-2">
          {MENU_ITEMS.map((item) => (
            <Button
              key={item.id}
              variant={active === item.id ? 'default' : 'ghost'}
              className="w-full justify-start"
              onClick={() => onSelect(item.id)}
            >
              <span className="mr-2">{item.icon}</span>
              {item.label}
            </Button>
          ))}
        </nav>
      </Card>
    </aside>
  );
};