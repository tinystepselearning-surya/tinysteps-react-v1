import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, setDoc, serverTimestamp, collection } from 'firebase/firestore';
import { db } from '../../../lib/firebaseConfig';
import { useAuth } from '../../../hooks/useAuth';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { toast } from '@components/hooks/use-toast';
import { Loader2, Plus, X } from 'lucide-react';

const courseSchema = z.object({
  name: z.string().min(3, "Course name must be at least 3 characters"),
  area: z.enum(['Phonics', 'Grammar', 'Speaking']),
  level: z.number().min(1).max(8),
  description: z.string().min(10, "Description must be at least 10 characters"),
  status: z.enum(['active', 'inactive', 'draft']),
  ratePerSession: z.number().min(100, "Rate must be at least ₹100"),
  durationMinutes: z.number().min(15).max(60),
  sessionFrequency: z.enum(['weekly', 'biweekly', 'monthly']),
  maxStudentsPerSession: z.number().min(1).max(10),
  targetAge: z.array(z.number()).min(1, "At least one target age required"),
  targetGrade: z.array(z.string()).min(1, "At least one target grade required"),
  topics: z.array(z.string()).min(1, "At least one topic required"),
  prerequisites: z.array(z.string()).optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CreateCourseFormProps {
  onSuccess?: (courseId: string) => void;
  onCancel?: () => void;
}

export default function CreateCourseForm({ onSuccess, onCancel }: CreateCourseFormProps) {
  const { user } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentTab, setCurrentTab] = useState('basic');

  const form = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      name: '',
      area: 'Phonics',
      level: 1,
      description: '',
      status: 'draft',
      ratePerSession: 500,
      durationMinutes: 35,
      sessionFrequency: 'weekly',
      maxStudentsPerSession: 3,
      targetAge: [5, 6],
      targetGrade: ['KG', 'Grade 1'],
      topics: [],
      prerequisites: [],
    },
  });

  const onSubmit = async (data: CourseFormData) => {
    if (!user?.uid) {
      toast({ title: 'Error', description: 'User not authenticated', variant: 'destructive' });
      return;
    }

    setIsSubmitting(true);
    try {
      const courseRef = doc(collection(db, 'courses'));
      await setDoc(courseRef, {
        ...data,
        createdBy: user.uid,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      toast({ title: 'Success', description: `Course "${data.name}" created successfully!` });
      onSuccess?.(courseRef.id);
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create course', 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addToArray = (field: 'targetAge' | 'targetGrade' | 'topics' | 'prerequisites', value: string | number) => {
    const current = form.getValues(field) as any[];
    if (!current.includes(value)) {
      form.setValue(field, [...current, value]);
    }
  };

  const removeFromArray = (field: 'targetAge' | 'targetGrade' | 'topics' | 'prerequisites', value: string | number) => {
    const current = form.getValues(field) as any[];
    form.setValue(field, current.filter(item => item !== value));
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <Tabs value={currentTab} onValueChange={setCurrentTab}>
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="basic">Basic Info</TabsTrigger>
                  <TabsTrigger value="pricing">Pricing & Logistics</TabsTrigger>
                  <TabsTrigger value="topics">Topics</TabsTrigger>
                  <TabsTrigger value="prerequisites">Prerequisites</TabsTrigger>
                </TabsList>

                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Phonics Level 1" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="area"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Area *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select area" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Phonics">Phonics</SelectItem>
                              <SelectItem value="Grammar">Grammar</SelectItem>
                              <SelectItem value="Speaking">Speaking</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="level"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Level *</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({length: 8}, (_, i) => (
                                <SelectItem key={i+1} value={(i+1).toString()}>{i+1}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="inactive">Inactive</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description *</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Describe what students will learn in this course..." 
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ratePerSession"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate per Session (₹) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="500" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="durationMinutes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Duration per Session (minutes) *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="35" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sessionFrequency"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Session Frequency *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select frequency" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxStudentsPerSession"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Students per Session *</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="3" 
                              {...field} 
                              onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <FormLabel>Target Age Range *</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {form.watch('targetAge').map((age) => (
                          <Badge key={age} variant="secondary" className="cursor-pointer" onClick={() => removeFromArray('targetAge', age)}>
                            Age {age} <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Select onValueChange={(value) => addToArray('targetAge', parseInt(value))}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Add age" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({length: 10}, (_, i) => i + 3).map((age) => (
                              <SelectItem key={age} value={age.toString()}>{age}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <FormLabel>Target Grades *</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {form.watch('targetGrade').map((grade) => (
                          <Badge key={grade} variant="secondary" className="cursor-pointer" onClick={() => removeFromArray('targetGrade', grade)}>
                            {grade} <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                      </div>
                      <div className="flex gap-2 mt-2">
                        <Select onValueChange={(value) => addToArray('targetGrade', value)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Add grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {['Nursery', 'KG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'].map((grade) => (
                              <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="topics" className="space-y-4">
                  <div>
                    <FormLabel>Topics *</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.watch('topics').map((topic) => (
                        <Badge key={topic} variant="secondary" className="cursor-pointer" onClick={() => removeFromArray('topics', topic)}>
                          {topic} <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input 
                        placeholder="Add topic name" 
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = (e.target as HTMLInputElement).value.trim();
                            if (value) {
                              addToArray('topics', value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add topic name"]') as HTMLInputElement;
                          const value = input?.value.trim();
                          if (value) {
                            addToArray('topics', value);
                            input.value = '';
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="prerequisites" className="space-y-4">
                  <div>
                    <FormLabel>Prerequisites (Optional)</FormLabel>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.watch('prerequisites')?.map((prereq) => (
                        <Badge key={prereq} variant="outline" className="cursor-pointer" onClick={() => removeFromArray('prerequisites', prereq)}>
                          {prereq} <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ))}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Input 
                        placeholder="Add prerequisite course" 
                        onKeyPress={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            const value = (e.target as HTMLInputElement).value.trim();
                            if (value) {
                              addToArray('prerequisites', value);
                              (e.target as HTMLInputElement).value = '';
                            }
                          }
                        }}
                      />
                      <Button 
                        type="button" 
                        variant="outline"
                        onClick={() => {
                          const input = document.querySelector('input[placeholder="Add prerequisite course"]') as HTMLInputElement;
                          const value = input?.value.trim();
                          if (value) {
                            addToArray('prerequisites', value);
                            input.value = '';
                          }
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-end gap-4 pt-6 border-t">
                {onCancel && (
                  <Button type="button" variant="outline" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Create Course
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}