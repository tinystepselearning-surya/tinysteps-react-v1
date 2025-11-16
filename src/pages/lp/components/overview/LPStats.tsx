import React, { useEffect, useState } from 'react';
import { Card } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { Spinner } from '../../../../components/ui/spinner'; // Assuming a Spinner component exists
import PropTypes from 'prop-types';

interface LPStatsProps {
  lpId?: string;
}

export const LPStats: React.FC<LPStatsProps> = ({ lpId }) => {
  const [stats, setStats] = useState({
    totalFamilies: 0,
    totalTeachers: 0,
    totalStudents: 0,
    pendingPayments: 0,
    openTickets: 0,
    averageSatisfaction: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!lpId) return;

      const db = getFirestore();
      const statsDocRef = doc(db, 'lpStats', lpId);

      try {
        const statsDoc = await getDoc(statsDocRef);
        // Defensive checks: getDoc mocks in tests may return undefined or a non-standard object
        if (statsDoc && typeof (statsDoc as any).exists === 'function' && (statsDoc as any).exists()) {
          setStats((statsDoc as any).data() as typeof stats);
        } else {
          setError('No statistics found for the given LP ID.');
        }
      } catch (error) {
        console.error('Error fetching LP stats:', error);
        setError('Failed to fetch statistics. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [lpId]);

  if (loading) {
    return (
      <div className="p-6 flex justify-center items-center" role="status">
        <Spinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <p className="text-red-600 font-semibold">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Families</p>
              <p className="text-2xl font-bold">{stats.totalFamilies}</p>
            </div>
            <div className="text-2xl">👨‍👩‍👧‍👦</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Teachers</p>
              <p className="text-2xl font-bold">{stats.totalTeachers}</p>
            </div>
            <div className="text-2xl">👩‍🏫</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Students</p>
              <p className="text-2xl font-bold">{stats.totalStudents}</p>
            </div>
            <div className="text-2xl">🎓</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Pending Payments</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pendingPayments}</p>
            </div>
            <div className="text-2xl">💰</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Open Tickets</p>
              <p className="text-2xl font-bold text-red-600">{stats.openTickets}</p>
            </div>
            <div className="text-2xl">🎫</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Satisfaction</p>
              <p className="text-2xl font-bold text-green-600">{stats.averageSatisfaction}/5</p>
            </div>
            <div className="text-2xl">⭐</div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
            <div>
              <p className="font-medium">New enrollment: New Student</p>
              <p className="text-sm text-muted-foreground">2 hours ago</p>
            </div>
            <Badge variant="secondary">Phonics</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
            <div>
              <p className="font-medium">Payment received: ₹2000</p>
              <p className="text-sm text-muted-foreground">4 hours ago</p>
            </div>
            <Badge variant="default">Paid</Badge>
          </div>

          <div className="flex items-center justify-between p-3 bg-muted/50 rounded">
            <div>
              <p className="font-medium">Support ticket resolved</p>
              <p className="text-sm text-muted-foreground">1 day ago</p>
            </div>
            <Badge variant="outline">Resolved</Badge>
          </div>
        </div>
      </Card>
    </div>
  );
};

LPStats.propTypes = {
  lpId: PropTypes.string.isRequired,
};

export default LPStats;