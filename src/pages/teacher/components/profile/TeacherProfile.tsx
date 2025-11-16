import React, { useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Label } from '@components/ui/label';
import { useAuthStore } from '../../../../store/useAuthStore';

interface TeacherProfileProps {
  teacherId?: string;
}

export const TeacherProfile: React.FC<TeacherProfileProps> = ({ teacherId }) => {
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: user?.displayName || '',
    email: user?.email || '',
    phone: '',
    qualifications: '',
    specializations: '',
    bio: '',
    bankAccount: '',
  });

  const handleSave = () => {
    // Save logic
    setIsEditing(false);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center gap-6">
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-2xl">👨‍🏫</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold">{profile.name}</h2>
            <p className="text-muted-foreground">{profile.email}</p>
            <Button onClick={() => setIsEditing(!isEditing)} className="mt-2">
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Name</Label>
            <Input
              value={profile.name}
              onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label>Email</Label>
            <Input
              value={profile.email}
              onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={profile.phone}
              onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
          <div>
            <Label>Qualifications</Label>
            <Input
              value={profile.qualifications}
              onChange={(e) => setProfile(p => ({ ...p, qualifications: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
          <div className="col-span-2">
            <Label>Specializations</Label>
            <Input
              value={profile.specializations}
              onChange={(e) => setProfile(p => ({ ...p, specializations: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
          <div className="col-span-2">
            <Label>Bio</Label>
            <Textarea
              value={profile.bio}
              onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
          <div className="col-span-2">
            <Label>Bank Account (for payments)</Label>
            <Input
              value={profile.bankAccount}
              onChange={(e) => setProfile(p => ({ ...p, bankAccount: e.target.value }))}
              disabled={!isEditing}
            />
          </div>
        </div>
        {isEditing && (
          <Button onClick={handleSave} className="mt-4">
            Save Changes
          </Button>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Label>Session Notifications</Label>
            <input type="checkbox" />
          </div>
          <div className="flex items-center gap-4">
            <Label>Email Alerts</Label>
            <input type="checkbox" />
          </div>
          <div className="flex items-center gap-4">
            <Label>Payment Schedule</Label>
            <select>
              <option>Weekly</option>
              <option>Monthly</option>
            </select>
          </div>
        </div>
      </Card>
    </div>
  );
};