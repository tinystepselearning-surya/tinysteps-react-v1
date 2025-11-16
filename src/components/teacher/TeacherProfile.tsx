import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';

const TeacherProfile: React.FC = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Profile</h1>
      <Card>
        <CardHeader>
          <CardTitle>Teacher Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Profile settings and information will be displayed here.</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TeacherProfile;