import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';

const ParentProfile: React.FC = () => {
  // Do not include real or demo parent/child data in product builds. Profile data should be fetched.
  const profile = {
    name: '',
    email: '',
    phone: '',
    address: '',
    joined: '',
    children: [] as { name: string; grade: string; status: string }[],
    paymentMethods: [] as string[],
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">My Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Profile Info */}
        <Card>
          <CardHeader>
            <CardTitle>Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <p><strong>Name:</strong> {profile.name || '—'}</p>
            <p><strong>Email:</strong> {profile.email}</p>
            <p><strong>Phone:</strong> {profile.phone}</p>
            <p><strong>Address:</strong> {profile.address}</p>
            <p><strong>Joined:</strong> {profile.joined || '—'}</p>
            <Button className="mt-4">Edit Profile</Button>
          </CardContent>
        </Card>

        {/* Children */}
        <Card>
          <CardHeader>
            <CardTitle>My Children</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.children.length === 0 && <p className="text-sm text-gray-500">No children yet</p>}
            {profile.children.map((child, index) => (
              <div key={index} className="mb-2">
                <p><strong>{child.name}</strong> - {child.grade}</p>
                <Badge variant="default">{child.status}</Badge>
              </div>
            ))}
            <Button className="mt-4">Manage Children</Button>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
          </CardHeader>
          <CardContent>
            {profile.paymentMethods.map((method, index) => (
              <p key={index}>{method}</p>
            ))}
            <Button className="mt-4">Add Payment Method</Button>
          </CardContent>
        </Card>

        {/* Emergency Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Emergency Contact</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Name: {user?.name || 'Parent Name'}</p>
            <p>Phone: 0987654321</p>
            <Button className="mt-4">Edit Contact</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ParentProfile;