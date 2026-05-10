import React, { useEffect, useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@components/ui/dialog';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { deleteField } from 'firebase/firestore';
import { updateKid } from '../../../services/kidsService';
import { toast } from '@components/hooks/use-toast';
import { Student } from '../../../types/Student';
import { useAuthStore } from '../../../store/useAuthStore';

interface Props {
  student: Student;
  open: boolean;
  onClose: () => void;
  onUpdated?: () => void;
}

const COUNTRY_OPTIONS = [
  { label: 'India', code: 'IN' },
  { label: 'United Arab Emirates', code: 'AE' },
  { label: 'Australia', code: 'AU' },
  { label: 'United States', code: 'US' },
  { label: 'United Kingdom', code: 'GB' },
  { label: 'Singapore', code: 'SG' },
] as const;

const COUNTRY_CODE_REGEX = /^[A-Z]{2}$/;
const COUNTRY_NONE_VALUE = '__none__';

function normalizeCountryCode(value: unknown): string | null {
  if (typeof value !== 'string') return null;
  const normalized = value.trim().toUpperCase();
  if (!normalized) return null;
  if (!COUNTRY_CODE_REGEX.test(normalized)) return null;
  return normalized;
}

function computeAgeYearsFromDob(dob?: string): number | null {
  try {
    if (!dob) return null;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dob);
    if (!m) return null;

    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    if (!Number.isFinite(y) || !Number.isFinite(mo) || !Number.isFinite(d)) return null;

    const birth = new Date(y, mo - 1, d);
    if (Number.isNaN(birth.getTime())) return null;

    const now = new Date();
    let age = now.getFullYear() - birth.getFullYear();
    const hadBirthday =
      now.getMonth() > birth.getMonth() ||
      (now.getMonth() === birth.getMonth() && now.getDate() >= birth.getDate());
    if (!hadBirthday) age -= 1;

    return age >= 0 && age <= 30 ? age : null;
  } catch {
    return null;
  }
}

export default function EditStudentForm({ student, open, onClose, onUpdated }: Props) {
  const { user } = useAuthStore();
  const canEdit = user?.role === 'admin';

  // Prefer Firestore "age" first. Fallbacks only for old data.
  const initialAgeYears = useMemo(() => {
    const directAge = (student as any)?.age;
    if (typeof directAge === 'number' && Number.isFinite(directAge)) return String(directAge);

    const legacyAgeYears = (student as any)?.ageYears;
    if (typeof legacyAgeYears === 'number' && Number.isFinite(legacyAgeYears)) return String(legacyAgeYears);

    const fromDob = computeAgeYearsFromDob((student as any)?.dob || (student as any)?.birthdate);
    return fromDob != null ? String(fromDob) : '';
  }, [student]);

  const [fullName, setFullName] = useState(student.fullName || '');
  const [ageYears, setAgeYears] = useState(initialAgeYears);
  const [grade, setGrade] = useState(student.grade || '');
  const [status, setStatus] = useState(student.status || 'active');
  const [countryCode, setCountryCode] = useState(
    normalizeCountryCode((student as any)?.countryCode) || COUNTRY_NONE_VALUE,
  );
  const [loading, setLoading] = useState(false);

  // ✅ Keep state synced when student changes / dialog opens
  useEffect(() => {
    setFullName(student.fullName || '');
    setAgeYears(initialAgeYears);
    setGrade(student.grade || '');
    setStatus(student.status || 'active');
    setCountryCode(normalizeCountryCode((student as any)?.countryCode) || COUNTRY_NONE_VALUE);
  }, [student, initialAgeYears, open]);

  const handleUpdate = async () => {
    if (!canEdit) return;

    const ageNum = Number(ageYears);
    if (!Number.isFinite(ageNum) || !Number.isInteger(ageNum)) {
      toast({
        title: 'Invalid age',
        description: 'Please enter a whole number (e.g., 5).',
        variant: 'destructive',
      });
      return;
    }
    if (ageNum < 2 || ageNum > 15) {
      toast({
        title: 'Invalid age',
        description: 'Age must be between 2 and 15.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      await updateKid(student.id as string, {
        fullName,
        age: ageNum, // ✅ store only "age" going forward
        grade,
        status,
        countryCode:
          countryCode === COUNTRY_NONE_VALUE
            ? deleteField()
            : (normalizeCountryCode(countryCode) || deleteField()),

        // ✅ Remove legacy fields so we stop storing DOB
        dob: deleteField(),
        birthdate: deleteField(),
        ageYears: deleteField(),
      } as any);

      toast({ title: 'Updated', description: 'Student updated' });
      onUpdated?.();
      onClose();
    } catch (err: any) {
      if ((err as any)?.code === 'permission-denied') {
        toast({
          title: 'Permission denied',
          description: 'You do not have permission to edit student details. Please contact an Admin.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: err.message || 'Update failed',
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Student</DialogTitle>
          <DialogDescription>
            Edit the basic details of the student. Only admins may edit this information.
            <br />
            <span className="text-xs text-muted-foreground">
              We only store age (years). Date of birth is not required.
            </span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-1.5">
            <div className="text-sm font-medium text-foreground">Student name</div>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full Name"
              disabled={!canEdit}
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-foreground">Age (years)</div>
              <div className="text-xs text-muted-foreground">Editable by admin</div>
            </div>
            <Input
              type="number"
              inputMode="numeric"
              min={2}
              max={15}
              step={1}
              value={ageYears}
              onChange={(e) => setAgeYears(e.target.value)}
              placeholder="Enter age, e.g. 5"
              disabled={!canEdit}
            />
          </div>

          <Select value={grade} onValueChange={(value: string) => setGrade(value)} disabled={!canEdit}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Grade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pre-K">Pre-K</SelectItem>
              <SelectItem value="KG">KG</SelectItem>
              <SelectItem value="Grade 1">Grade 1</SelectItem>
              <SelectItem value="Grade 2">Grade 2</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={status}
            onValueChange={(value: 'active' | 'suspended' | 'archived') => setStatus(value)}
            disabled={!canEdit}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>

          <Select value={countryCode} onValueChange={setCountryCode} disabled={!canEdit}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Country (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={COUNTRY_NONE_VALUE}>Other / blank</SelectItem>
              {COUNTRY_OPTIONS.map((option) => (
                <SelectItem key={option.code} value={option.code}>
                  {option.label} — {option.code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button onClick={handleUpdate} disabled={loading || !canEdit}>
            {loading ? 'Saving...' : canEdit ? 'Save Changes' : 'Not Authorized'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
