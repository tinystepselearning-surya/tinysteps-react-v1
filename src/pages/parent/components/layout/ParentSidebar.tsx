import { memo, type FC, type ReactNode } from 'react';
import { Button } from '../../../../components/ui/button';
import { Home, TrendingUp, Lightbulb, FileText, User, CreditCard } from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: ReactNode;
}

const sidebarItems: SidebarItem[] = [
  { id: 'dashboard', label: 'Overview', icon: <Home className="w-4 h-4" /> },
  { id: 'games-progress', label: 'Games Progress', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'skills', label: 'Skills', icon: <Lightbulb className="w-4 h-4" /> },
  { id: 'reports', label: 'Reports', icon: <FileText className="w-4 h-4" /> },
  { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  { id: 'payments', label: 'Payments', icon: <CreditCard className="w-4 h-4" /> },
];

interface ParentSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const ParentSidebarComponent: FC<ParentSidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Parent Dashboard</h2>
        <p className="text-sm text-gray-600 mt-1">Track your children's progress</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {sidebarItems.map((item) => (
          <Button
            key={item.id}
            variant={activeTab === item.id ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => onTabChange?.(item.id)}
          >
            {item.icon}
            <span className="ml-3">{item.label}</span>
          </Button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>Next session: 4:00 PM</p>
          <p>Outstanding: ₹2,000</p>
        </div>
      </div>
    </div>
  );
};

const ParentSidebar = memo(ParentSidebarComponent);

export default ParentSidebar;
