import type { FC } from 'react';
import { Button } from '@components/ui/button';
import { Card } from '@components/ui/card';

interface LPSidebarProps {
  active: string;
  onSelect: (tab: string) => void;
  messageUnreadCount?: number;
}

const MENU_ITEMS = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'schools', label: 'My Schools', icon: '🏫' },
  { id: 'parents', label: 'Parents', icon: '👨‍👩‍👧‍👦' },
  { id: 'teachers', label: 'Teachers', icon: '👩‍🏫' },
  { id: 'messages', label: 'Messages', icon: '💬' },
  { id: 'tickets', label: 'Support Tickets', icon: '🎫' },
  { id: 'performance', label: 'Performance', icon: '📈' },
  { id: 'region', label: 'Regional Data', icon: '🌍' },
  { id: 'holidays', label: 'Holiday Calendar', icon: '🗓️' },
];

export const LPSidebar: FC<LPSidebarProps> = ({ active, onSelect, messageUnreadCount }) => {
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
              <span className="flex-1 text-left">{item.label}</span>
              {item.id === 'messages' &&
                typeof messageUnreadCount === 'number' &&
                messageUnreadCount > 0 && (
                  <span className="ml-auto rounded-full bg-red-500 px-2 py-0.5 text-xs font-semibold text-white">
                    {messageUnreadCount > 99 ? '99+' : messageUnreadCount}
                  </span>
                )}
            </Button>
          ))}
        </nav>
      </Card>
    </aside>
  );
};
