import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';

const ParentSettings: React.FC = () => {
  const [profile, setProfile] = React.useState({
    name: '',
    email: '',
    phone: '',
    address: ''
  });

  const handleSaveProfile = () => {
    console.log('Saving profile:', profile);
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Settings</h1>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="payment">Payment Methods</TabsTrigger>
          <TabsTrigger value="preferences">Preferences</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Edit Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Name</Label>
                <Input value={profile.name} placeholder="Full name" onChange={(e) => setProfile({...profile, name: e.target.value})} />
              </div>
              <div>
                <Label>Email</Label>
                <Input value={profile.email} placeholder="name@example.com" onChange={(e) => setProfile({...profile, email: e.target.value})} />
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} />
              </div>
              <div>
                <Label>Address</Label>
                <Input value={profile.address} onChange={(e) => setProfile({...profile, address: e.target.value})} />
              </div>
              <Button onClick={handleSaveProfile}>Save Changes</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payment">
          <Card>
            <CardHeader>
              <CardTitle>Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Add UPI ID, Bank Account, or Card details here.</p>
              <Button>Add Payment Method</Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="preferences">
          <Card>
            <CardHeader>
              <CardTitle>Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <p>Notification preferences, language, etc.</p>
              <Button>Update Preferences</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ParentSettings;