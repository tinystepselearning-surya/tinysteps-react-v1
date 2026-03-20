import React, { useEffect, useMemo, useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { Loader2 } from 'lucide-react';
import { useToast } from '@components/hooks/use-toast';
import { db } from '../../../../lib/firebaseConfig';
import { useAuthStore } from '../../../../store/useAuthStore';

interface TeacherProfileProps {
  teacherId?: string;
}

type PaymentSchedule = 'weekly' | 'biweekly' | 'monthly';

interface TeacherProfileFormData {
  name: string;
  email: string;
  phone: string;
  qualifications: string;
  specializations: string;
  yearsExperience: string;
  languages: string;
  city: string;
  timezone: string;
  emergencyContactName: string;
  emergencyContactPhone: string;
  bio: string;
  bankAccountNumber: string;
  bankAccountHolderName: string;
  bankIfscCode: string;
  upiId: string;
  sessionNotifications: boolean;
  emailAlerts: boolean;
  paymentSchedule: PaymentSchedule;
}

const DEFAULT_PROFILE: TeacherProfileFormData = {
  name: '',
  email: '',
  phone: '',
  qualifications: '',
  specializations: '',
  yearsExperience: '',
  languages: '',
  city: '',
  timezone: '',
  emergencyContactName: '',
  emergencyContactPhone: '',
  bio: '',
  bankAccountNumber: '',
  bankAccountHolderName: '',
  bankIfscCode: '',
  upiId: '',
  sessionNotifications: true,
  emailAlerts: true,
  paymentSchedule: 'weekly',
};

const asString = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return '';
};

const parseCommaSeparated = (value: string): string[] =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

const commaSeparated = (value: unknown): string => {
  if (Array.isArray(value)) {
    return value
      .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
      .join(', ');
  }
  if (typeof value === 'string') return value;
  return '';
};

const normalizePaymentSchedule = (value: unknown): PaymentSchedule => {
  if (value === 'biweekly' || value === 'monthly') return value;
  return 'weekly';
};

export const TeacherProfile: React.FC<TeacherProfileProps> = ({ teacherId }) => {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [profile, setProfile] = useState<TeacherProfileFormData>(DEFAULT_PROFILE);
  const [savedProfile, setSavedProfile] = useState<TeacherProfileFormData>(DEFAULT_PROFILE);

  const resolvedTeacherId = useMemo(() => teacherId || user?.uid || '', [teacherId, user?.uid]);

  useEffect(() => {
    let cancelled = false;

    const loadProfile = async () => {
      if (!resolvedTeacherId) {
        if (!cancelled) {
          setIsLoading(false);
          setProfile((prev) => ({
            ...prev,
            name: user?.displayName || '',
            email: user?.email || '',
          }));
          setSavedProfile((prev) => ({
            ...prev,
            name: user?.displayName || '',
            email: user?.email || '',
          }));
        }
        return;
      }

      setIsLoading(true);
      try {
        const ref = doc(db, 'users', resolvedTeacherId);
        const snap = await getDoc(ref);
        const data = snap.data() || {};
        const preferences =
          typeof data.preferences === 'object' && data.preferences !== null
            ? (data.preferences as Record<string, unknown>)
            : {};
        const displayName = asString(data.name || data.displayName) || user?.displayName || '';
        const email = asString(data.email) || user?.email || '';
        const next: TeacherProfileFormData = {
          name: displayName,
          email,
          phone: asString(data.phone),
          qualifications: asString(data.qualification || data.qualifications),
          specializations: commaSeparated(data.specializations || data.specialization),
          yearsExperience: asString(data.yearsExperience),
          languages: commaSeparated(data.languagesSpoken || data.languages),
          city: asString(data.city),
          timezone: asString(data.timezone),
          emergencyContactName: asString(data.emergencyContactName),
          emergencyContactPhone: asString(data.emergencyContactPhone),
          bio: asString(data.bio),
          bankAccountNumber: asString(data.bankAccountNumber || data.bankAccount),
          bankAccountHolderName: asString(data.bankAccountHolderName),
          bankIfscCode: asString(data.bankIfscCode),
          upiId: asString(data.upiId),
          sessionNotifications:
            typeof preferences.sessionNotifications === 'boolean'
              ? preferences.sessionNotifications
              : true,
          emailAlerts: typeof preferences.emailAlerts === 'boolean' ? preferences.emailAlerts : true,
          paymentSchedule: normalizePaymentSchedule(preferences.paymentSchedule),
        };
        if (!cancelled) {
          setProfile(next);
          setSavedProfile(next);
        }
      } catch (err) {
        console.error('Failed to load teacher profile', err);
        if (!cancelled) {
          toast({
            title: 'Failed to load profile',
            description: 'Please refresh and try again.',
            variant: 'destructive',
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    loadProfile();
    return () => {
      cancelled = true;
    };
  }, [resolvedTeacherId, toast, user?.displayName, user?.email]);

  const handleCancel = () => {
    setProfile(savedProfile);
    setIsEditing(false);
  };

  const handleSave = async () => {
    if (!resolvedTeacherId) {
      toast({
        title: 'Profile unavailable',
        description: 'Please sign in again and retry.',
        variant: 'destructive',
      });
      return;
    }

    setIsSaving(true);
    try {
      const specializationList = parseCommaSeparated(profile.specializations);
      const languagesList = parseCommaSeparated(profile.languages);
      const yearsExperienceRaw = profile.yearsExperience.trim();
      const yearsExperienceParsed = yearsExperienceRaw ? Number(yearsExperienceRaw) : null;
      const yearsExperience =
        yearsExperienceParsed !== null && Number.isFinite(yearsExperienceParsed) && yearsExperienceParsed >= 0
          ? Math.floor(yearsExperienceParsed)
          : null;

      const payload = {
        phone: profile.phone.trim(),
        qualification: profile.qualifications.trim(),
        qualifications: profile.qualifications.trim(),
        specialization: specializationList,
        specializations: specializationList,
        yearsExperience,
        languagesSpoken: languagesList,
        languages: languagesList,
        city: profile.city.trim(),
        timezone: profile.timezone.trim(),
        emergencyContactName: profile.emergencyContactName.trim(),
        emergencyContactPhone: profile.emergencyContactPhone.trim(),
        bio: profile.bio.trim(),
        bankAccountNumber: profile.bankAccountNumber.trim(),
        bankAccount: profile.bankAccountNumber.trim(),
        bankAccountHolderName: profile.bankAccountHolderName.trim(),
        bankIfscCode: profile.bankIfscCode.trim(),
        upiId: profile.upiId.trim(),
        preferences: {
          sessionNotifications: profile.sessionNotifications,
          emailAlerts: profile.emailAlerts,
          paymentSchedule: profile.paymentSchedule,
        },
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, 'users', resolvedTeacherId), payload, { merge: true });
      setSavedProfile(profile);
      setIsEditing(false);
      toast({
        title: 'Profile updated',
        description: 'Your details have been saved.',
      });
    } catch (err) {
      console.error('Failed to save teacher profile', err);
      toast({
        title: 'Save failed',
        description: 'Could not update profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12 text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        Loading profile…
      </div>
    );
  }

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
            <Button onClick={() => (isEditing ? handleCancel() : setIsEditing(true))} className="mt-2">
              {isEditing ? 'Cancel' : 'Edit Profile'}
            </Button>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <Label>Name</Label>
            <Input value={profile.name} readOnly className="bg-slate-50 text-slate-700" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={profile.email} readOnly className="bg-slate-50 text-slate-700" />
          </div>
          <div>
            <Label>Phone</Label>
            <Input
              value={profile.phone}
              onChange={(e) => setProfile(p => ({ ...p, phone: e.target.value }))}
              disabled={!isEditing}
              placeholder="+91 98765 43210"
            />
          </div>
          <div>
            <Label>Qualifications</Label>
            <Input
              value={profile.qualifications}
              onChange={(e) => setProfile(p => ({ ...p, qualifications: e.target.value }))}
              disabled={!isEditing}
              placeholder="B.Ed, M.Ed, TESOL"
            />
          </div>
          <div>
            <Label>Years of Experience</Label>
            <Input
              value={profile.yearsExperience}
              onChange={(e) => setProfile(p => ({ ...p, yearsExperience: e.target.value }))}
              disabled={!isEditing}
              inputMode="numeric"
              placeholder="5"
            />
          </div>
          <div>
            <Label>Languages</Label>
            <Input
              value={profile.languages}
              onChange={(e) => setProfile(p => ({ ...p, languages: e.target.value }))}
              disabled={!isEditing}
              placeholder="English, Hindi"
            />
          </div>
          <div className="col-span-2">
            <Label>Specializations</Label>
            <Input
              value={profile.specializations}
              onChange={(e) => setProfile(p => ({ ...p, specializations: e.target.value }))}
              disabled={!isEditing}
              placeholder="Phonics, Grammar, Public Speaking"
            />
          </div>
          <div>
            <Label>City</Label>
            <Input
              value={profile.city}
              onChange={(e) => setProfile(p => ({ ...p, city: e.target.value }))}
              disabled={!isEditing}
              placeholder="Hyderabad"
            />
          </div>
          <div>
            <Label>Timezone</Label>
            <Input
              value={profile.timezone}
              onChange={(e) => setProfile(p => ({ ...p, timezone: e.target.value }))}
              disabled={!isEditing}
              placeholder="Asia/Kolkata"
            />
          </div>
          <div>
            <Label>Emergency Contact Name</Label>
            <Input
              value={profile.emergencyContactName}
              onChange={(e) => setProfile(p => ({ ...p, emergencyContactName: e.target.value }))}
              disabled={!isEditing}
              placeholder="Contact person"
            />
          </div>
          <div>
            <Label>Emergency Contact Phone</Label>
            <Input
              value={profile.emergencyContactPhone}
              onChange={(e) => setProfile(p => ({ ...p, emergencyContactPhone: e.target.value }))}
              disabled={!isEditing}
              placeholder="+91 90000 00000"
            />
          </div>
          <div className="col-span-2">
            <Label>Bio</Label>
            <Textarea
              value={profile.bio}
              onChange={(e) => setProfile(p => ({ ...p, bio: e.target.value }))}
              disabled={!isEditing}
              placeholder="Short teaching bio"
            />
          </div>
          <div>
            <Label>Bank Account Number</Label>
            <Input
              value={profile.bankAccountNumber}
              onChange={(e) => setProfile(p => ({ ...p, bankAccountNumber: e.target.value }))}
              disabled={!isEditing}
              placeholder="000123456789"
            />
          </div>
          <div>
            <Label>Bank Account Holder Name</Label>
            <Input
              value={profile.bankAccountHolderName}
              onChange={(e) => setProfile(p => ({ ...p, bankAccountHolderName: e.target.value }))}
              disabled={!isEditing}
              placeholder="As per bank records"
            />
          </div>
          <div>
            <Label>IFSC Code</Label>
            <Input
              value={profile.bankIfscCode}
              onChange={(e) => setProfile(p => ({ ...p, bankIfscCode: e.target.value }))}
              disabled={!isEditing}
              placeholder="SBIN0000001"
            />
          </div>
          <div>
            <Label>UPI ID</Label>
            <Input
              value={profile.upiId}
              onChange={(e) => setProfile(p => ({ ...p, upiId: e.target.value }))}
              disabled={!isEditing}
              placeholder="teacher@upi"
            />
          </div>
        </div>
        {isEditing && (
          <Button onClick={handleSave} className="mt-4" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        )}
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Label>Session Notifications</Label>
            <input
              type="checkbox"
              checked={profile.sessionNotifications}
              onChange={(e) => setProfile((p) => ({ ...p, sessionNotifications: e.target.checked }))}
              disabled={!isEditing}
            />
          </div>
          <div className="flex items-center gap-4">
            <Label>Email Alerts</Label>
            <input
              type="checkbox"
              checked={profile.emailAlerts}
              onChange={(e) => setProfile((p) => ({ ...p, emailAlerts: e.target.checked }))}
              disabled={!isEditing}
            />
          </div>
          <div className="flex items-center gap-4">
            <Label>Payment Schedule</Label>
            <Select
              value={profile.paymentSchedule}
              onValueChange={(value) => setProfile((p) => ({ ...p, paymentSchedule: value as PaymentSchedule }))}
              disabled={!isEditing}
            >
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Select schedule" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="biweekly">Biweekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>
    </div>
  );
};
