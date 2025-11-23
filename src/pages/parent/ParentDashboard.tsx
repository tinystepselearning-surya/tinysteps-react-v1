// src/pages/parent/ParentDashboard.tsx
import React, { useState } from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { useParentFilteredChildren } from '../../hooks/useParentFilteredData';

type ParentTab =
  | 'overview'
  | 'children'
  | 'sessions'
  | 'payments'
  | 'kids'
  | 'reports'
  | 'messages'
  | 'notifications'
  | 'settings'
  | 'profile';

const AccessNotice = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-center h-screen bg-muted/30">
    <div className="p-8 text-center space-y-2 max-w-md rounded-lg shadow bg-white">
      {children}
    </div>
  </div>
);

export default function ParentDashboard() {
  const { user, isLoading } = useAuthStore();
  const [activeTab, setActiveTab] = useState<ParentTab>('overview');

  const {
    children: kids,
    loading: kidsLoading,
    error: kidsError,
  } = useParentFilteredChildren();

  // 1) Loading auth
  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center text-gray-600">
        Checking permissions…
      </div>
    );
  }

  // 2) Not logged in
  if (!user) {
    return (
      <AccessNotice>
        <p className="font-semibold mb-1">Not logged in</p>
        <p className="text-sm text-gray-600">
          Please log in with your parent account to view this page.
        </p>
      </AccessNotice>
    );
  }

  // 3) Wrong role
  if (user.role !== 'parent') {
    return (
      <AccessNotice>
        <p className="font-semibold mb-1">Access denied</p>
        <p className="text-sm text-gray-600">
          This dashboard is only for parent accounts.
        </p>
      </AccessNotice>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Simple header */}
      <header className="w-full border-b bg-white px-6 py-4 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">
            Welcome, {user.displayName || user.email}
          </h1>
          <p className="text-xs text-gray-500">
            Tiny Steps Parent Dashboard
          </p>
        </div>
        <div className="text-xs text-gray-400">
          {/* You can add logout / avatar later here */}
          Parent View
        </div>
      </header>

      {/* Main layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left side: simple nav */}
        <aside className="w-56 border-r bg-white p-4 space-y-1 text-sm">
          <NavButton
            label="Dashboard Overview"
            tab="overview"
            activeTab={activeTab}
            onClick={setActiveTab}
          />
          <NavButton
            label={`My Children (${kids.length})`}
            tab="children"
            activeTab={activeTab}
            onClick={setActiveTab}
          />
          <NavButton
            label="Sessions"
            tab="sessions"
            activeTab={activeTab}
            onClick={setActiveTab}
          />
          <NavButton
            label="Payments"
            tab="payments"
            activeTab={activeTab}
            onClick={setActiveTab}
          />
          <NavButton
            label="Kids Page"
            tab="kids"
            activeTab={activeTab}
            onClick={setActiveTab}
          />
          <NavButton
            label="Reports"
            tab="reports"
            activeTab={activeTab}
            onClick={setActiveTab}
          />
          <NavButton
            label="Messages"
            tab="messages"
            activeTab={activeTab}
            onClick={setActiveTab}
          />
          <NavButton
            label="Notifications"
            tab="notifications"
            activeTab={activeTab}
            onClick={setActiveTab}
          />
          <NavButton
            label="Settings"
            tab="settings"
            activeTab={activeTab}
            onClick={setActiveTab}
          />
          <NavButton
            label="Profile"
            tab="profile"
            activeTab={activeTab}
            onClick={setActiveTab}
          />
        </aside>

        {/* Right side: content */}
        <main className="flex-1 overflow-auto p-6 bg-gray-50">
          {activeTab === 'overview' && (
            <OverviewPanel kidsCount={kids.length} />
          )}

          {activeTab === 'children' && (
            <ChildrenPanel
              kids={kids}
              loading={kidsLoading}
              error={kidsError}
            />
          )}

          {activeTab === 'sessions' && (
            <PlaceholderPanel title="Sessions">
              Your upcoming and past sessions will appear here.
            </PlaceholderPanel>
          )}

          {activeTab === 'payments' && (
            <PlaceholderPanel title="Payments">
              Your invoices and payment history will appear here.
            </PlaceholderPanel>
          )}

          {activeTab === 'kids' && (
            <PlaceholderPanel title="Kids Page">
              Kids interactive dashboard will be linked here.
            </PlaceholderPanel>
          )}

          {activeTab === 'reports' && (
            <PlaceholderPanel title="Reports">
              Progress reports and learning summaries will appear here.
            </PlaceholderPanel>
          )}

          {activeTab === 'messages' && (
            <PlaceholderPanel title="Messages">
              Messages between you and teachers/RMs will appear here.
            </PlaceholderPanel>
          )}

          {activeTab === 'notifications' && (
            <PlaceholderPanel title="Notifications">
              All important updates will appear here.
            </PlaceholderPanel>
          )}

          {activeTab === 'settings' && (
            <PlaceholderPanel title="Settings">
              Parent account and preferences configuration.
            </PlaceholderPanel>
          )}

          {activeTab === 'profile' && (
            <PlaceholderPanel title="Profile">
              Parent profile details will be shown here.
            </PlaceholderPanel>
          )}
        </main>
      </div>
    </div>
  );
}

/** Left nav button */
interface NavButtonProps {
  label: string;
  tab: ParentTab;
  activeTab: ParentTab;
  onClick: (tab: ParentTab) => void;
}

const NavButton: React.FC<NavButtonProps> = ({
  label,
  tab,
  activeTab,
  onClick,
}) => {
  const isActive = tab === activeTab;
  return (
    <button
      type="button"
      onClick={() => onClick(tab)}
      className={`w-full text-left px-3 py-2 rounded-md transition text-xs ${
        isActive
          ? 'bg-indigo-600 text-white font-semibold'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
};

/** Overview tab panel */
const OverviewPanel: React.FC<{ kidsCount: number }> = ({ kidsCount }) => (
  <div className="space-y-4">
    <h2 className="text-xl font-bold mb-2">Dashboard Overview</h2>
    <div className="grid gap-4 md:grid-cols-3">
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-xs text-gray-500 mb-1">Children Linked</p>
        <p className="text-2xl font-bold">{kidsCount}</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-xs text-gray-500 mb-1">Upcoming Sessions</p>
        <p className="text-2xl font-bold">–</p>
      </div>
      <div className="bg-white rounded-lg shadow p-4">
        <p className="text-xs text-gray-500 mb-1">Active Courses</p>
        <p className="text-2xl font-bold">–</p>
      </div>
    </div>
  </div>
);

/** Children tab panel */
type AnyChild = {
  id?: string;
  uid?: string;
  fullName?: string;
  displayName?: string;
  name?: string;
  age?: number | string | null;
  grade?: string | null;
  enrollmentCount?: number;
  averageMastery?: number;
};

interface ChildrenPanelProps {
  kids: AnyChild[];
  loading: boolean;
  error: string | null;
}

const ChildrenPanel: React.FC<ChildrenPanelProps> = ({
  kids,
  loading,
  error,
}) => {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold mb-2">
        My Children ({kids.length})
      </h2>

      {loading && <div>Loading children…</div>}
      {error && <div className="text-red-600 text-sm">Error: {error}</div>}

      {!loading && !error && kids.length === 0 && (
        <div className="text-gray-600 text-sm">
          No children registered yet.
        </div>
      )}

      {!loading && !error && kids.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {kids.map((child) => (
            <ChildCard
              key={child.id || child.uid || String(child.fullName)}
              child={child}
            />
          ))}
        </div>
      )}
    </div>
  );
};

const ChildCard: React.FC<{ child: AnyChild }> = ({ child }) => {
  const name =
    child.fullName || child.displayName || child.name || 'Unnamed child';
  const age = child.age ?? '-';
  const grade = child.grade ?? '-';
  const enrollmentCount = child.enrollmentCount ?? 0;
  const avgMastery = child.averageMastery ?? 0;

  return (
    <div className="border rounded-lg p-4 hover:shadow-lg transition bg-white text-sm">
      <h3 className="font-bold text-base mb-1">{name}</h3>
      <p className="text-gray-600">
        Age: {age} | Grade: {grade}
      </p>
      <p>Active Courses: {enrollmentCount}</p>
      <p>Average Mastery: {avgMastery}%</p>
      <button className="mt-2 text-blue-600 text-xs">
        View Progress
      </button>
    </div>
  );
};

/** Generic placeholder for tabs we haven’t wired yet */
const PlaceholderPanel: React.FC<{
  title: string;
  children: React.ReactNode;
}> = ({ title, children }) => (
  <div className="space-y-3">
    <h2 className="text-xl font-bold mb-1">{title}</h2>
    <div className="bg-white rounded-lg shadow p-4 text-sm text-gray-600">
      {children}
      <p className="mt-2 text-xs text-gray-400">
        (This section is a placeholder. We’ll wire the full component
        here later.)
      </p>
    </div>
  </div>
);
