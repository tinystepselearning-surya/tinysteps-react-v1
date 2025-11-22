import React, { useEffect, useState } from 'react';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from '../../firebaseConfig';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '../../components/ui/card';

interface AdminUser {
  uid: string;
  email?: string | null;
  displayName?: string | null;
  role?: string;
}

interface FetchAdminStatsResponse {
  admins: AdminUser[];
  count: number;
}

const AdminOverviewCard: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<FetchAdminStatsResponse | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const functions = getFunctions(app, 'asia-south1');
        const fetchAdminStats = httpsCallable(functions, 'fetchAdminStats');

        const result = await fetchAdminStats({ limit: 10 });
        const payload = result.data as FetchAdminStatsResponse;

        setData(payload);
      } catch (err: any) {
        console.error(err);
        setError(err?.message || 'Failed to load admin stats.');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Admin Overview</span>
          {data && (
            <span className="text-xs font-normal text-gray-500">
              Total admins: <span className="font-semibold">{data.count}</span>
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <p className="text-sm text-gray-600">Loading admin stats…</p>
        )}

        {error && (
          <p className="text-sm text-red-600">
            {error}
          </p>
        )}

        {!loading && !error && data && (
          <div className="space-y-3">
            {data.admins.length === 0 && (
              <p className="text-sm text-gray-500">
                No admin records found in <code>users</code> collection.
              </p>
            )}

            {data.admins.length > 0 && (
              <ul className="space-y-2">
                {data.admins.map((adminUser) => (
                  <li
                    key={adminUser.uid}
                    className="flex items-start justify-between rounded-md border border-gray-100 bg-gray-50 px-3 py-2 text-xs"
                  >
                    <div>
                      <div className="font-semibold">
                        {adminUser.displayName || '(No name)'}
                      </div>
                      <div className="text-gray-600 break-all">
                        {adminUser.email || '(No email)'}
                      </div>
                    </div>
                    <div className="ml-3 text-right text-[11px] text-purple-700 font-medium uppercase tracking-wide">
                      {adminUser.role || 'admin'}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminOverviewCard;
