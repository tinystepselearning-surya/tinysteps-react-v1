import React from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';

interface RegionalDataProps {
  lpId?: string;
}

interface RegionalStats {
  region: string;
  totalFamilies: number;
  totalStudents: number;
  totalRevenue: number;
  growthRate: number;
  topSubject: string;
  avgSatisfaction: number;
}

export const RegionalData: React.FC<RegionalDataProps> = ({ lpId }) => {
  // Mock data - in real implementation, fetch from Firestore
  const regionalStats: RegionalStats[] = [
    {
      region: 'Mumbai',
      totalFamilies: 25,
      totalStudents: 35,
      totalRevenue: 87500,
      growthRate: 15.2,
      topSubject: 'Phonics',
      avgSatisfaction: 4.4,
    },
    {
      region: 'Delhi',
      totalFamilies: 18,
      totalStudents: 24,
      totalRevenue: 60000,
      growthRate: 8.7,
      topSubject: 'Grammar',
      avgSatisfaction: 4.2,
    },
    {
      region: 'Bangalore',
      totalFamilies: 22,
      totalStudents: 31,
      totalRevenue: 77500,
      growthRate: 12.1,
      topSubject: 'Speaking',
      avgSatisfaction: 4.5,
    },
  ];

  const totalStats = regionalStats.reduce(
    (acc, region) => ({
      totalFamilies: acc.totalFamilies + region.totalFamilies,
      totalStudents: acc.totalStudents + region.totalStudents,
      totalRevenue: acc.totalRevenue + region.totalRevenue,
      avgGrowth: acc.avgGrowth + region.growthRate,
      avgSatisfaction: acc.avgSatisfaction + region.avgSatisfaction,
    }),
    { totalFamilies: 0, totalStudents: 0, totalRevenue: 0, avgGrowth: 0, avgSatisfaction: 0 }
  );

  totalStats.avgGrowth /= regionalStats.length;
  totalStats.avgSatisfaction /= regionalStats.length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Families</p>
            <p className="text-3xl font-bold">{totalStats.totalFamilies}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Students</p>
            <p className="text-3xl font-bold">{totalStats.totalStudents}</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Total Revenue</p>
            <p className="text-3xl font-bold">₹{(totalStats.totalRevenue / 1000).toFixed(0)}K</p>
          </div>
        </Card>

        <Card className="p-6">
          <div className="text-center">
            <p className="text-sm text-muted-foreground">Avg Growth</p>
            <p className="text-3xl font-bold text-green-600">+{totalStats.avgGrowth.toFixed(1)}%</p>
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Regional Performance</h3>
          <Button variant="outline">Export Data</Button>
        </div>

        <div className="space-y-4">
          {regionalStats.map((region) => (
            <div key={region.region} className="border rounded p-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-lg font-semibold">{region.region}</h4>
                <Badge variant="secondary">⭐ {region.avgSatisfaction}/5</Badge>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Families</p>
                  <p className="font-semibold">{region.totalFamilies}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Students</p>
                  <p className="font-semibold">{region.totalStudents}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Revenue</p>
                  <p className="font-semibold">₹{(region.totalRevenue / 1000).toFixed(0)}K</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Growth</p>
                  <p className="font-semibold text-green-600">+{region.growthRate}%</p>
                </div>
              </div>

              <div className="mt-3 pt-3 border-t">
                <p className="text-sm">
                  <span className="text-muted-foreground">Top Subject:</span> {region.topSubject}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default RegionalData;