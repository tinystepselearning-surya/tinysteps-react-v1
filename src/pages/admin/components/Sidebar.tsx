// React default import removed
import { Button } from '@components/ui/button';
import { useNavigate } from 'react-router-dom';

interface SidebarProps {
  selectedTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ selectedTab, onTabChange }: SidebarProps) {
  const navigate = useNavigate();
  const tabs = [
    { id: 'users', label: 'User Management', icon: '👥' },
    { id: 'students', label: 'Student Management', icon: '🎓' },
    { id: 'enrollments', label: 'Enrollment Management', icon: '📝' },
    { id: 'relationships', label: 'Relationship Management', icon: '🤝' },
    { id: 'courses', label: 'Course Management', icon: '📚' },
    { id: 'lessons', label: 'Lesson Library', icon: '📖' },
    { id: 'analytics', label: 'Analytics', icon: '📊' },
  ];

  return (
    <aside className="w-64 bg-gray-800 text-white p-6">
      <h2 className="text-2xl font-bold mb-8">Admin Panel</h2>
      <nav className="space-y-2">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={selectedTab === tab.id ? 'default' : 'ghost'}
            className={`w-full justify-start text-left ${
              selectedTab === tab.id
                ? 'bg-blue-600 hover:bg-blue-700'
                : 'text-gray-300 hover:text-white hover:bg-gray-700'
            }`}
            onClick={() => {
              onTabChange(tab.id);
              navigate(`/surya?tab=${tab.id}`);
            }}
          >
            <span className="mr-3">{tab.icon}</span>
            {tab.label}
          </Button>
        ))}
      </nav>
    </aside>
  );
}