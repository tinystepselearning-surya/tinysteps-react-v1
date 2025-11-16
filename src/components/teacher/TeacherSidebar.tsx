import React from 'react';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { Calendar, Users, TrendingUp, DollarSign, MessageSquare, BarChart3, Clock, User, Bell } from 'lucide-react';

interface SidebarItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
}

const sidebarItems: SidebarItem[] = [
  { id: 'today', label: 'Today\'s Sessions', icon: <Calendar className="w-4 h-4" /> },
  { id: 'upcoming', label: 'Upcoming Sessions', icon: <Clock className="w-4 h-4" /> },
  { id: 'students', label: 'Students', icon: <Users className="w-4 h-4" /> },
  { id: 'progress', label: 'Progress', icon: <TrendingUp className="w-4 h-4" /> },
  { id: 'earnings', label: 'Earnings', icon: <DollarSign className="w-4 h-4" /> },
  { id: 'analytics', label: 'Analytics', icon: <BarChart3 className="w-4 h-4" /> },
  { id: 'messages', label: 'Messages', icon: <MessageSquare className="w-4 h-4" />, badge: '3' },
  { id: 'schedule', label: 'Schedule', icon: <Calendar className="w-4 h-4" /> },
  { id: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
  { id: 'notifications', label: 'Notifications', icon: <Bell className="w-4 h-4" />, badge: '5' },
];

interface TeacherSidebarProps {
  activeTab?: string;
  onTabChange?: (tab: string) => void;
}

const TeacherSidebar: React.FC<TeacherSidebarProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-200">
        <h2 className="text-xl font-bold text-gray-900">Teacher Dashboard</h2>
        <p className="text-sm text-gray-600 mt-1">Manage your sessions and students</p>
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
            {item.badge && (
              <Badge variant="secondary" className="ml-auto">
                {item.badge}
              </Badge>
            )}
          </Button>
        ))}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <div className="text-xs text-gray-500">
          <p>Next session: 2:00 PM</p>
          <p>Students: 12 active</p>
        </div>
      </div>
    </div>
  );
};

export default TeacherSidebar;