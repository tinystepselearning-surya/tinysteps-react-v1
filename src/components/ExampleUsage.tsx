import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { useKidProgress } from '../hooks/useData';

export default function ExampleUsage({ kidId }: { kidId: string }) {
  const { user, isLoading } = useAuth();
  const { data: progress, isLoading: progressLoading } = useKidProgress(kidId);

  if (isLoading || progressLoading) return <div>Loading...</div>;

  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold">User</h2>
      <pre className="mb-4">{JSON.stringify(user, null, 2)}</pre>

      <h2 className="text-lg font-semibold">Kid Progress</h2>
      <pre>{JSON.stringify(progress, null, 2)}</pre>
    </div>
  );
}
