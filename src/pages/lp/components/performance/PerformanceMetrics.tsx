import type { FC } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';

interface PerformanceMetricsProps {
  lpId?: string;
}

export const PerformanceMetrics: FC<PerformanceMetricsProps> = ({ lpId }) => {
  // Mock data - in real implementation, fetch from Firestore
  const metrics = {
    totalRevenue: 125000,
    monthlyGrowth: 12.5,
    customerSatisfaction: 4.3,
    teacherUtilization: 85,
    studentRetention: 92,
    averageSessionDuration: 32,
  };

  const reports = [
    { name: 'Monthly Revenue Report', date: 'Nov 2025', status: 'ready' },
    { name: 'Teacher Performance Review', date: 'Oct 2025', status: 'ready' },
    { name: 'Student Progress Summary', date: 'Nov 2025', status: 'generating' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-bold">₹{metrics.totalRevenue.toLocaleString()}</p>
              <p className="text-sm text-green-600">+{metrics.monthlyGrowth}% this month</p>
            </div>
            <div className="text-2xl">💰</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Customer Satisfaction</p>
              <p className="text-2xl font-bold">{metrics.customerSatisfaction}/5</p>
              <p className="text-sm text-green-600">↑ 0.2 from last month</p>
            </div>
            <div className="text-2xl">⭐</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Teacher Utilization</p>
              <p className="text-2xl font-bold">{metrics.teacherUtilization}%</p>
              <p className="text-sm text-muted-foreground">Target: 80-90%</p>
            </div>
            <div className="text-2xl">👩‍🏫</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Student Retention</p>
              <p className="text-2xl font-bold">{metrics.studentRetention}%</p>
              <p className="text-sm text-green-600">↑ 3% from last month</p>
            </div>
            <div className="text-2xl">🎓</div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Avg Session Duration</p>
              <p className="text-2xl font-bold">{metrics.averageSessionDuration} min</p>
              <p className="text-sm text-muted-foreground">Target: 30-35 min</p>
            </div>
            <div className="text-2xl">⏱️</div>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Generated Reports</h3>
          <Button>Generate New Report</Button>
        </div>

        <div className="space-y-3">
          {reports.map((report, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded">
              <div>
                <p className="font-medium">{report.name}</p>
                <p className="text-sm text-muted-foreground">{report.date}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className={`px-2 py-1 text-xs rounded ${
                  report.status === 'ready' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {report.status}
                </span>
                {report.status === 'ready' && (
                  <Button variant="outline" size="sm">
                    Download
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default PerformanceMetrics;