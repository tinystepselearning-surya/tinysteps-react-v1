import React, { useState, useEffect } from 'react';
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
import { auth } from '../../../lib/firebaseConfig';
import {
  DEFAULT_PHONE_COUNTRY_CODE,
  buildPhoneFromParts,
  normalizeCountryCode,
  normalizePhoneLocal,
} from '../../../lib/phone';
const GENERIC_USER_ROLES = [
  'admin',
  'founder',
  'teacher',
  'parent',
  'learningPartner',
] as const;

type GenericUserRole =
  (typeof GENERIC_USER_ROLES)[number];

type GenericCreateUserData =
  Omit<CreateUserData, 'role' | 'status'> & {
    role: GenericUserRole;
    status: 'active' | 'suspended';
  };

const createUserSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().optional(),
  phoneCountryCode: z.string().optional(),
  phoneLocal: z.string().optional(),
  role: z.enum(GENERIC_USER_ROLES),
  status: z.enum(['active', 'suspended']),
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
});

interface CreateUserFormProps {
  onUserCreated: (user: User) => void;
  onClose?: () => void;
}

export function CreateUserForm({ onUserCreated, onClose }: CreateUserFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [activeRole, setActiveRole] = useState<GenericUserRole>('parent');
  const [createdUserData, setCreatedUserData] = useState<any>(null);
  const [isAdminLocal, setIsAdminLocal] = useState<boolean | null>(null);

  const form = useForm<GenericCreateUserData>({
    resolver: zodResolver(createUserSchema),
  defaultValues: {
      email: '',
      password: '',
      name: '',
      phone: '',
      phoneCountryCode: DEFAULT_PHONE_COUNTRY_CODE,
      phoneLocal: '',
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
    },
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setIsAdminLocal(false);
        toast({
          title: 'Authentication Error',
          description: 'You must be logged in to create users.',
          variant: 'destructive',
        });
      } else {
        try {
          const tokenResult = await user.getIdTokenResult(true);
          const isAdminClaim = tokenResult.claims?.admin === true || tokenResult.claims?.role === 'admin';
          if (isAdminClaim) {
            setIsAdminLocal(true);
          } else {
            // No admin assertions found in token; default to false.
            setIsAdminLocal(false);
          }
        } catch (err) {
          setIsAdminLocal(false);
        }
      }
    });

    return () => unsubscribe(); // Ensure cleanup to prevent memory leaks
  }, []);

  const onSubmit = async (data: GenericCreateUserData) => {
    setIsLoading(true);
    try {
      const phoneCountryCode = normalizeCountryCode(String(data.phoneCountryCode || ''));
      const phoneLocal = normalizePhoneLocal(String(data.phoneLocal || ''));
      if ((phoneCountryCode && !phoneLocal) || (!phoneCountryCode && phoneLocal)) {
        toast({
          title: 'Phone details incomplete',
          description: 'Please enter both country code and phone number.',
          variant: 'destructive',
        });
        return;
      }
      const combinedPhone = buildPhoneFromParts(phoneCountryCode, phoneLocal);

      // Ensure auth state is ready and refresh token
      const currentUser = await new Promise<any>((resolve) => {
        if (auth.currentUser) return resolve(auth.currentUser);
        const unsub = auth.onAuthStateChanged((u) => {
          unsub();
          resolve(u);
        });
      });

      if (!currentUser) {
        throw new Error('You must be logged in to create users.');
      }

      // Force refresh so the callable receives the latest claims via the SDK auth context.
      await currentUser.getIdToken(true);

      const submitData: Record<string, any> = {
        ...data,
        phone: combinedPhone || null,
        phoneCountryCode: phoneCountryCode || null,
        phoneLocal: phoneLocal || null,
        displayName: data.name,
        role: activeRole,
        specialization: data.specialization ? data.specialization.split(',').map(s => s.trim()) : undefined,
        paymentMethods: data.paymentMethods ? data.paymentMethods.split(',').map(s => s.trim()) : undefined,
      };

      const createUserFunction = httpsCallable(functions, 'adminCreateUser');
  const result = await createUserFunction(submitData);

      const createdUser = result.data as any;
      if (createdUser && createdUser.success === false) {
        const message = createdUser.error || 'Failed to create user';
        toast({ title: 'Error', description: message, variant: 'destructive' });
        return;
      }

      const resetLink = createdUser?.resetLink || null;
      setCreatedUserData({ ...createdUser, resetLink });
      toast({
        title: 'User created',
        description: createdUser?.uid
          ? `User created successfully (UID: ${createdUser.uid})`
          : 'User created successfully',
      });

      form.reset();
      onUserCreated(result.data as User);
      // After creation, navigate to admin page and highlight new user if possible
      try {
        const createdUid = (result.data as any)?.uid;
        if (createdUid) {
          window.location.href = `/surya?createdUserId=${createdUid}`;
        }
      } catch {
      }
    } catch (error: any) {
      // Provide clearer messaging for common function errors
      const code = error?.code || error?.status || null;
      let description = error?.message || 'Failed to create user. Try again.';
      if (code === 'permission-denied' || description.includes('Only admins')) {
        description = 'You do not have permission to create users. Ensure your account has the Admin role in Firestore or in Auth claims.';
      } else if (code === 'already-exists' || /already exists|already taken|not available/i.test(description)) {
        if (/phone/i.test(description)) {
          description = 'This phone number is already in use. Please use a different phone number.';
        } else {
          description = 'This user ID is already taken or not available. Please try another user ID.';
        }
      }
      toast({
        title: 'Error',
        description,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTabChange = (value: string) => {
    setActiveRole(value as GenericUserRole);
    form.setValue('role', value as GenericUserRole);
    // Reset form when role changes
    form.reset({
      email: form.getValues('email'),
      password: form.getValues('password'),
      name: form.getValues('name'),
      phone: form.getValues('phone'),
      phoneCountryCode: form.getValues('phoneCountryCode') || DEFAULT_PHONE_COUNTRY_CODE,
      phoneLocal: form.getValues('phoneLocal'),
      role: value as GenericUserRole,
      status: 'active',
    });
  };

  return (
    <div className="space-y-4">
      {isAdminLocal === false && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded text-sm text-yellow-700">
          Your account does not appear to have Admin permissions. You will not be able to create users.
        </div>
      )}
      <Tabs value={activeRole} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-2 gap-1 sm:grid-cols-3 lg:grid-cols-5">
          <TabsTrigger value="admin">Admin</TabsTrigger>
          <TabsTrigger value="founder">Founder</TabsTrigger>
          <TabsTrigger value="teacher">Teacher</TabsTrigger>
          <TabsTrigger value="parent">Parent</TabsTrigger>
          <TabsTrigger value="learningPartner">LP</TabsTrigger>
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
                      <Input placeholder="Full Name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="space-y-2">
                <Label>Phone</Label>
                <div className="grid grid-cols-3 gap-2">
                  <FormField
                    control={form.control}
                    name="phoneCountryCode"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <div className="flex h-10 items-center rounded-md border bg-background">
                            <span className="px-3 text-sm text-muted-foreground">+</span>
                            <Input
                              className="border-0 shadow-none focus-visible:ring-0"
                              placeholder="Country"
                              inputMode="numeric"
                              value={field.value || DEFAULT_PHONE_COUNTRY_CODE}
                              onChange={(event) =>
                                field.onChange(event.target.value.replace(/\D/g, ''))
                              }
                            />
                          </div>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="phoneLocal"
                    render={({ field }) => (
                      <FormItem className="col-span-2">
                        <FormControl>
                          <Input
                            placeholder="Phone number"
                            inputMode="numeric"
                            value={field.value || ''}
                            onChange={(event) =>
                              field.onChange(event.target.value.replace(/\D/g, ''))
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>
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
                <FormField
                  control={form.control}
                  name="childIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assign kids (optional)</FormLabel>
                      <div className="mt-2">
                        <KidMultiSelect
                          value={field.value || []}
                          onChange={(ids) => field.onChange(ids)}
                          kids={kids.map(k => ({ id: k.id, name: k.fullName || k.name || k.id }))}
                        />
                      </div>
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
                        <Input placeholder="Full Name" {...field} />
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
              <Button type="submit" disabled={isLoading || isAdminLocal === false}>
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
            {createdUserData?.resetLink && (
              <div className="mt-4">
                <span className="font-medium text-gray-700">Password Reset Link</span>
                <p className="text-xs mt-1 break-all">{createdUserData.resetLink}</p>
                <div className="mt-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      try {
                        navigator.clipboard.writeText(createdUserData.resetLink);
                        toast({ title: 'Copied', description: 'Reset link copied to clipboard' });
                      } catch (err) {
                        toast({ title: 'Copy failed', description: 'Could not copy reset link' });
                      }
                    }}
                  >
                    Copy Reset Link
                  </Button>
                </div>
              </div>
            )}
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
