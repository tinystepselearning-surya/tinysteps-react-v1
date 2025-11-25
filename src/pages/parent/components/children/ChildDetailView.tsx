import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../../components/ui/tabs';
import { ParentChildSummary } from '../../../../types/Parent';

interface ChildDetailViewProps {
  childId?: string;
}

const ChildDetailView: React.FC<ChildDetailViewProps> = ({ childId }) => {
  const [selectedChild, setSelectedChild] = useState<ParentChildSummary | null>(null);

  const ProgressBar: React.FC<{ value: number; label: string }> = ({ value, label }) => (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-2">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full"
          style={{ width: `${value}%` }}
        ></div>
      </div>
    </div>
  );

  const child = selectedChild;

  if (!child) {
    return (
      <div className="p-6">
        <h1 className="text-xl font-semibold mb-2">No child selected</h1>
        <p className="text-sm text-gray-600">
          Please select a child from your list to view detailed progress and enrollment information.
        </p>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center text-3xl font-bold text-blue-600">
              {child?.fullName ? child.fullName.charAt(0) : '—'}
            </div>
            <div>
              <h1 className="text-2xl font-bold">{child.fullName}</h1>
              <p className="text-gray-600">Grade {child.grade}</p>
              <Badge variant={child.status === 'active' ? 'default' : 'secondary'}>
                {child.status}
              </Badge>
            </div>
        </div>
        <Button>Edit Child Info</Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="sessions">Sessions</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Child Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Full Name</p>
                  <p className="font-medium">{child.fullName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Grade</p>
                  <p className="font-medium">Grade {child.grade}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <Badge variant={child.status === 'active' ? 'default' : 'secondary'}>
                    {child.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Enrolled Courses</p>
                  <p className="font-medium">{child.courses?.length || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Current Enrollments</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {(child?.courses || []).map((course, index) => (
                  <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <p className="font-medium">{course}</p>
                      <p className="text-sm text-gray-600">Teacher: —</p>
                      <p className="text-sm text-gray-600">LP: —</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">Progress: 8/12 sessions</p>
                      <p className="text-sm text-gray-600">Mastery: 75%</p>
                      <p className="text-sm text-gray-600">Start: Nov 1, 2025</p>
                      <p className="text-sm text-gray-600">End: Dec 15, 2025</p>
                      <Badge variant="default">Active</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Phonics Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Current Level</p>
                  <p className="font-medium">Level 2</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Mastery</p>
                  <p className="font-medium">{child.phonicsMastery}%</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Topics Completed</p>
                  <p className="font-medium">8/12</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Learning Pace</p>
                  <Badge variant="default">On track</Badge>
                </div>
              </div>
              <ProgressBar value={child.phonicsMastery || 0} label="Overall Progress" />
              <div>
                <p className="text-sm font-medium mb-2">Topics Breakdown</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Phoneme A</span>
                    <Badge variant="default">✅ Mastered</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Phoneme E</span>
                    <Badge variant="default">✅ Mastered</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Phoneme I</span>
                    <Badge variant="secondary">🔄 In progress</Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Grammar Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressBar value={child.grammarMastery || 0} label="Grammar Mastery" />
              <p className="text-sm text-gray-600 mt-2">Similar breakdown as Phonics...</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Speaking Progress</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressBar value={child.speakingMastery || 0} label="Speaking Mastery" />
              <p className="text-sm text-gray-600 mt-2">Similar breakdown as Phonics...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Sessions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Mock session data */}
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Nov 15, 2025 - 4:00 PM</p>
                    <p className="text-sm text-gray-600">Phonics Level 2</p>
                    <p className="text-sm text-gray-600">Teacher: Anjali Varma</p>
                  </div>
                  <div className="text-right">
                    <Badge variant="default">Completed</Badge>
                    <p className="text-sm mt-1">Mastery: +5%</p>
                    <Button variant="outline" size="sm" className="mt-2">View Details</Button>
                  </div>
                </div>
                {/* More sessions... */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Performance Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Strengths</h3>
                <p className="text-sm text-gray-600">Great at phoneme recognition and basic grammar structures.</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Areas to Improve</h3>
                <p className="text-sm text-gray-600">Speaking pace needs work - child tends to speak slowly.</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Teacher Recommendations</h3>
                <p className="text-sm text-gray-600">Practice speaking exercises at home, focus on confidence building.</p>
              </div>
              <div>
                <h3 className="font-medium mb-2">Parent Guidance</h3>
                <p className="text-sm text-gray-600">Encourage daily reading practice and conversation at home.</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Peer Comparison</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span>Phonics</span>
                  <Badge variant="default">Above average</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Grammar</span>
                  <Badge variant="secondary">On average</Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span>Speaking</span>
                  <Badge variant="destructive">Below average</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChildDetailView;
