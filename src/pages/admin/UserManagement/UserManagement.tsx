import React, { useState } from 'react';
import { Card } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@components/ui/dialog';
import { Alert, AlertDescription } from '@components/ui/alert';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebaseConfig';
import { useAuthStore } from '../../../store/useAuthStore';

interface CreateUserFormData {
  email: string;
  displayName: string;
  phone: string;
  role: 'admin' | 'teacher' | 'parent' | 'learningPartner' | 'kid';

  // Teacher fields
  qualification?: string;
  specialization?: string[];
  yearsExperience?: number;
  bio?: string;

  // Parent fields
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  communicationLanguage?: string;
  sessionTime?: string;
  paymentMethods?: string[];

  // LP fields
  region?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankAccountHolderName?: string;

  status?: 'active' | 'suspended' | 'archived';
}

const specializationOptions = [
  'Phonics', 'Grammar', 'Public Speaking', 'Reading', 'Writing', 'Mathematics'
];

const paymentMethodOptions = ['UPI', 'Bank Transfer', 'Credit Card', 'Cash'];

export default function UserManagement() {
  const { user } = useAuthStore();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState<CreateUserFormData>({
    email: '',
    displayName: '',
    phone: '',
    role: 'parent',
    status: 'active'
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleInputChange = (field: keyof CreateUserFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSpecializationChange = (specialization: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      specialization: checked
        ? [...(prev.specialization || []), specialization]
        : (prev.specialization || []).filter(s => s !== specialization)
    }));
  };

  const handlePaymentMethodChange = (method: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      paymentMethods: checked
        ? [...(prev.paymentMethods || []), method]
        : (prev.paymentMethods || []).filter(m => m !== method)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const createUserFunction = httpsCallable(functions, 'adminCreateUser');
      const result = await createUserFunction(formData);

      const data = result.data as any;
      if (data.success) {
        setSuccess(data.message);
        // Reset form
        setFormData({
          email: '',
          displayName: '',
          phone: '',
          role: 'parent',
          status: 'active'
        });
        setTimeout(() => {
          setIsDialogOpen(false);
          setSuccess(null);
        }, 3000);
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderRoleSpecificFields = () => {
    switch (formData.role) {
      case 'teacher':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="qualification">Qualification</Label>
              <Input
                id="qualification"
                value={formData.qualification || ''}
                onChange={(e) => handleInputChange('qualification', e.target.value)}
                placeholder="e.g., B.Ed, M.A English"
              />
            </div>
            <div>
              <Label>Specialization</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {specializationOptions.map(spec => (
                  <div key={spec} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`spec-${spec}`}
                      checked={(formData.specialization || []).includes(spec)}
                      onChange={(e) => handleSpecializationChange(spec, e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`spec-${spec}`} className="text-sm">{spec}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="yearsExperience">Years of Experience</Label>
              <Input
                id="yearsExperience"
                type="number"
                value={formData.yearsExperience || ''}
                onChange={(e) => handleInputChange('yearsExperience', parseInt(e.target.value) || 0)}
                placeholder="e.g., 5"
              />
            </div>
            <div>
              <Label htmlFor="bio">Bio</Label>
              <textarea
                id="bio"
                value={formData.bio || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('bio', e.target.value)}
                placeholder="Brief description about the teacher..."
                rows={3}
                className="w-full px-3 py-2 border rounded-md resize-none"
              />
            </div>
          </div>
        );

      case 'parent':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="address">Address</Label>
                <Input
                  id="address"
                  value={formData.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Street address"
                />
              </div>
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={formData.city || ''}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={formData.state || ''}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="State"
                />
              </div>
              <div>
                <Label htmlFor="pincode">Pincode</Label>
                <Input
                  id="pincode"
                  value={formData.pincode || ''}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  placeholder="Pincode"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="communicationLanguage">Communication Language</Label>
                <Select value={formData.communicationLanguage || 'English'} onValueChange={(value) => handleInputChange('communicationLanguage', value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Hindi">Hindi</SelectItem>
                    <SelectItem value="Tamil">Tamil</SelectItem>
                    <SelectItem value="Telugu">Telugu</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="sessionTime">Preferred Session Time</Label>
                <Input
                  id="sessionTime"
                  value={formData.sessionTime || ''}
                  onChange={(e) => handleInputChange('sessionTime', e.target.value)}
                  placeholder="e.g., 4:00 PM"
                />
              </div>
            </div>
            <div>
              <Label>Payment Methods</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                {paymentMethodOptions.map(method => (
                  <div key={method} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id={`payment-${method}`}
                      checked={(formData.paymentMethods || []).includes(method)}
                      onChange={(e) => handlePaymentMethodChange(method, e.target.checked)}
                      className="rounded"
                    />
                    <Label htmlFor={`payment-${method}`} className="text-sm">{method}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'learningPartner':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="region">Region</Label>
              <Select value={formData.region || ''} onValueChange={(value) => handleInputChange('region', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select region" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="North India">North India</SelectItem>
                  <SelectItem value="South India">South India</SelectItem>
                  <SelectItem value="East India">East India</SelectItem>
                  <SelectItem value="West India">West India</SelectItem>
                  <SelectItem value="Central India">Central India</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium">Bank Details</h4>
              <div>
                <Label htmlFor="bankAccountHolderName">Account Holder Name</Label>
                <Input
                  id="bankAccountHolderName"
                  value={formData.bankAccountHolderName || ''}
                  onChange={(e) => handleInputChange('bankAccountHolderName', e.target.value)}
                  placeholder="Full name as per bank"
                />
              </div>
              <div>
                <Label htmlFor="bankAccountNumber">Account Number</Label>
                <Input
                  id="bankAccountNumber"
                  value={formData.bankAccountNumber || ''}
                  onChange={(e) => handleInputChange('bankAccountNumber', e.target.value)}
                  placeholder="Bank account number"
                />
              </div>
              <div>
                <Label htmlFor="bankIfscCode">IFSC Code</Label>
                <Input
                  id="bankIfscCode"
                  value={formData.bankIfscCode || ''}
                  onChange={(e) => handleInputChange('bankIfscCode', e.target.value)}
                  placeholder="e.g., SBIN0001234"
                />
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">User Management</h2>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>Create New User</Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New User</DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert>
                  <AlertDescription className="text-green-700">{success}</AlertDescription>
                </Alert>
              )}

              {/* Basic Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Basic Information</h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      required
                      placeholder="user@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="displayName">Display Name *</Label>
                    <Input
                      id="displayName"
                      value={formData.displayName}
                      onChange={(e) => handleInputChange('displayName', e.target.value)}
                      required
                      placeholder="Full name"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+91 9876543210"
                    />
                  </div>
                  <div>
                    <Label htmlFor="role">Role *</Label>
                    <Select value={formData.role} onValueChange={(value: any) => handleInputChange('role', value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="teacher">Teacher</SelectItem>
                        <SelectItem value="parent">Parent</SelectItem>
                        <SelectItem value="learningPartner">Learning Partner</SelectItem>
                        <SelectItem value="kid">Kid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status || 'active'} onValueChange={(value: any) => handleInputChange('status', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Role-specific fields */}
              {renderRoleSpecificFields()}

              {/* Submit buttons */}
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create User'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="p-6">
        <div className="text-center text-gray-500">
          <p>User management interface will be displayed here</p>
          <p className="text-sm mt-2">Use the "Create New User" button to add new users to the system</p>
        </div>
      </Card>
    </div>
  );
}