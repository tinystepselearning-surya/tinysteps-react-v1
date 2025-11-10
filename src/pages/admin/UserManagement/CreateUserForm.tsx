import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { httpsCallable } from 'firebase/functions';
import { functions } from '../../../lib/firebaseConfig';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@components/ui/form';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { toast } from '@components/hooks/use-toast';
import { CreateUserData, User } from '../../../types/User';

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  role: z.enum(['admin', 'teacher', 'parent', 'learningPartner', 'kid']),
  status: z.enum(['active', 'suspended', 'archived']),
  // Role-specific fields
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  yearsExperience: z.number().min(0).optional(),
  bio: z.string().optional(),
  address: z.string().optional(),
  city: z.string().optional(),
  state: z.string().optional(),
  pincode: z.string().optional(),
  communicationLanguage: z.string().optional(),
  sessionTime: z.string().optional(),
  paymentMethods: z.string().optional(),
  region: z.string().optional(),
  bankAccountNumber: z.string().optional(),
  bankIfscCode: z.string().optional(),
  bankAccountHolderName: z.string().optional(),
  isKidProfile: z.boolean().optional(),
});

interface CreateUserFormProps {
  onUserCreated: (user: User) => void;
  onClose?: () => void;
}

export function CreateUserForm({ onUserCreated, onClose }: CreateUserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<'admin' | 'teacher' | 'parent' | 'learningPartner' | 'kid'>('parent');
  const [createdUserData, setCreatedUserData] = useState<any>(null);

  const form = useForm<CreateUserData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      email: '',
      password: '',
      name: '',
      phone: '',
      role: 'parent',
      status: 'active',
      qualification: '',
      specialization: '',
      yearsExperience: undefined,
      bio: '',
      address: '',
      city: '',
      state: '',
      pincode: '',
      communicationLanguage: '',
      sessionTime: '',
      paymentMethods: '',
      region: '',
      bankAccountNumber: '',
      bankIfscCode: '',
      bankAccountHolderName: '',
      isKidProfile: false,
    },
  });

  const onSubmit = async (data: CreateUserData) => {
    setIsLoading(true);
    try {
      // Map name to displayName for Cloud Function
      const submitData = {
        ...data,
        displayName: data.name,
        role: activeRole,
        // Handle arrays
        specialization: data.specialization ? data.specialization.split(',').map(s => s.trim()) : undefined,
        paymentMethods: data.paymentMethods ? data.paymentMethods.split(',').map(s => s.trim()) : undefined,
      };

      const createUserFunction = httpsCallable(functions, 'adminCreateUser');
      const result = await createUserFunction(submitData);

      // Store created user data for display
      const createdUser = result.data as any;
      setCreatedUserData(createdUser);

      // Show success with UID if available
      toast({
        title: 'User created',
        description: createdUser?.uid
          ? `User created successfully (UID: ${createdUser.uid})`
          : 'User created successfully',
      });

      form.reset();
      onUserCreated(result.data as User);
      onClose?.();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveRole(value as typeof activeRole);
    form.setValue('role', value as any);
    // Reset form when role changes
    form.reset({
      email: form.getValues('email'),
      password: form.getValues('password'),
      name: form.getValues('name'),
      phone: form.getValues('phone'),
      role: value as any,
      status: 'active',
    });
  };

  return (
    <div className="space-y-4">
      <Tabs value={activeRole} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="teacher">Teacher</TabsTrigger>
          <TabsTrigger value="parent">Parent</TabsTrigger>
          <TabsTrigger value="learningPartner">LP</TabsTrigger>
          <TabsTrigger value="kid">Kid</TabsTrigger>
        </TabsList>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">
            {/* Common Fields */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="user@example.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Password <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="Enter password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Full Name <span className="text-red-500">*</span></FormLabel>
                    <FormControl>
                      <Input placeholder="John Doe" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl>
                      <Input placeholder="+1 (555) 123-4567" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <FormControl>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                        <SelectItem value="archived">Archived</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Role-specific Fields */}
            {activeRole === 'teacher' && (
              <TabsContent value="teacher" className="space-y-4">
                <FormField
                  control={form.control}
                  name="qualification"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Qualification</FormLabel>
                      <FormControl>
                        <Input placeholder="B.Ed, M.Ed" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization</FormLabel>
                      <FormControl>
                        <Input placeholder="Phonics, Grammar, Public Speaking" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="yearsExperience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Years of Experience</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="5"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Brief bio..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            )}

            {activeRole === 'parent' && (
              <TabsContent value="parent" className="space-y-4">
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Input placeholder="Street address" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="city"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>City</FormLabel>
                        <FormControl>
                          <Input placeholder="City" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="state"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>State</FormLabel>
                        <FormControl>
                          <Input placeholder="State" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="pincode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pincode</FormLabel>
                        <FormControl>
                          <Input placeholder="123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="communicationLanguage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Communication Language</FormLabel>
                        <FormControl>
                          <Input placeholder="English" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="sessionTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Preferred Session Time</FormLabel>
                        <FormControl>
                          <Input placeholder="Morning, Evening" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="paymentMethods"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Payment Methods</FormLabel>
                      <FormControl>
                        <Input placeholder="UPI, Bank Transfer, Credit Card" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            )}

            {activeRole === 'learningPartner' && (
              <TabsContent value="learningPartner" className="space-y-4">
                <FormField
                  control={form.control}
                  name="region"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Region</FormLabel>
                      <FormControl>
                        <Input placeholder="Mumbai, Delhi" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="bankAccountHolderName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bank Account Holder Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="bankAccountNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bank Account Number</FormLabel>
                        <FormControl>
                          <Input placeholder="1234567890" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bankIfscCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>IFSC Code</FormLabel>
                        <FormControl>
                          <Input placeholder="ABCD0123456" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </TabsContent>
            )}

            {activeRole === 'kid' && (
              <TabsContent value="kid" className="space-y-4">
                <FormField
                  control={form.control}
                  name="isKidProfile"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value || false}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Is Kid Profile</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>
            )}

            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  form.reset();
                  setCreatedUserData(null);
                  onClose?.();
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Creating...' : 'Create User'}
              </Button>
            </div>
          </form>
        </Form>
        </Tabs>

        {createdUserData && (
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-md">
            <h3 className="text-lg font-semibold text-green-800 mb-2">User Created Successfully!</h3>
            <div className="space-y-2 text-sm">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">User ID (UID):</span>
                  <p className="font-mono text-xs bg-gray-100 p-1 rounded mt-1">{createdUserData.uid}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Email:</span>
                  <p className="text-gray-900">{createdUserData.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="font-medium text-gray-700">Created At:</span>
                  <p className="text-gray-900">
                    {createdUserData.createdAt ? new Date(createdUserData.createdAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Last Updated:</span>
                  <p className="text-gray-900">
                    {createdUserData.updatedAt ? new Date(createdUserData.updatedAt).toLocaleString() : 'N/A'}
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setCreatedUserData(null)}
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }
