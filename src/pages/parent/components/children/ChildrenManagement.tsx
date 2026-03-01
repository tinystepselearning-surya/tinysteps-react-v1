import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../../../components/ui/card';
import { Button } from '../../../../components/ui/button';
import { Badge } from '../../../../components/ui/badge';
import { Input } from '../../../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../components/ui/select';
import { useParentChildren } from '../../hooks/useParentChildren';
import { useAuthStore } from '../../../../store/useAuthStore';
import { masteryLabel, masteryPctFromKey } from '../../../../lib/mastery';

const ChildrenManagement: React.FC = () => {
  const { user } = useAuthStore();
  const { data: children = [], isLoading } = useParentChildren(user?.uid);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('name');
  const [filterStatus, setFilterStatus] = useState('all');

  const filteredAndSortedChildren = children
    .filter(child => {
      const matchesSearch = child.fullName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesFilter = filterStatus === 'all' || child.status === filterStatus;
      return matchesSearch && matchesFilter;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.fullName.localeCompare(b.fullName);
        case 'status':
          return (a.status || '').localeCompare(b.status || '');
        case 'lastActive':
          // For now, sort by name as we don't have lastSessionDate
          return a.fullName.localeCompare(b.fullName);
        default:
          return 0;
      }
    });

  const ProgressBar: React.FC<{ value: any; label: string }> = ({ value, label }) => {
    const pct = masteryPctFromKey(value);
    const labelText = masteryLabel(value);
    return (
      <div className="mb-2">
        <div className="flex justify-between text-xs mb-1">
          <span>{label}</span>
          <span>{labelText}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-1.5">
          <div
            className="bg-blue-600 h-1.5 rounded-full"
            style={{ width: `${pct}%` }}
          ></div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return <div className="p-6">Loading children...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Children Management</h1>
        <Button>Add New Child</Button>
      </div>

      <div className="flex gap-4 mb-6">
        <Input
          placeholder="Search children..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="name">Name</SelectItem>
            <SelectItem value="status">Status</SelectItem>
            <SelectItem value="lastActive">Last Active</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredAndSortedChildren.map((child) => (
          <Card key={child.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center text-2xl font-bold text-blue-600">
                  {child.fullName.charAt(0)}
                </div>
                <div>
                  <CardTitle className="text-lg">{child.fullName}</CardTitle>
                  <p className="text-sm text-gray-600">Grade {child.grade}</p>
                  <Badge variant={child.status === 'active' ? 'default' : 'secondary'}>
                    {child.status === 'active' ? '🟢 Active' : child.status}
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-600">Grade</p>
                  <p className="font-medium">Grade {child.grade || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-gray-600">Enrolled Courses</p>
                  <p className="font-medium">{child.courses?.length || 0} courses</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium mb-2">Progress</p>
                <ProgressBar value={child.phonicsMastery || 0} label="Phonics" />
                <ProgressBar value={child.grammarMastery || 0} label="Grammar" />
                <ProgressBar value={child.speakingMastery || 0} label="Speaking" />
              </div>

              <div className="text-sm text-gray-600">
                <p>Status: {child.status || 'Active'}</p>
              </div>

              <div className="flex flex-wrap gap-2">
                <Button variant="outline" size="sm">View Details</Button>
                <Button variant="outline" size="sm">View Progress</Button>
                <Button variant="outline" size="sm">View Sessions</Button>
                <Button variant="outline" size="sm">Edit Info</Button>
                <Button variant="outline" size="sm">Add New Course</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ChildrenManagement;
