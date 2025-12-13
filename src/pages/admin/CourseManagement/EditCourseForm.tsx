// EditCourseForm.tsx
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import type { SubmitHandler } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

import { useAuth } from '../../../hooks/useAuth';
import { useCourse } from '../../../hooks/useData';
import { useUpdateCourse } from '../../../hooks/courses/useUpdateCourse';

import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@components/ui/tabs';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Badge } from '@components/ui/badge';
import { toast } from '@components/hooks/use-toast';
import { Loader2, Plus, X } from 'lucide-react';

const courseSchema = z.object({
  name: z.string().min(3, 'Course name must be at least 3 characters'),
  area: z.enum(['Phonics', 'Grammar', 'Speaking']),
  level: z.number().min(1).max(8),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  status: z.enum(['active', 'inactive', 'draft']),
  ratePerSession: z.number().min(100, 'Rate must be at least ₹100'),
  durationMinutes: z.number().min(15).max(60),
  sessionFrequency: z.enum(['weekly', 'biweekly', 'monthly']),
  maxStudentsPerSession: z.number().min(1).max(10),
  targetAge: z.array(z.number()).min(1, 'At least one target age required'),
  targetGrade: z.array(z.string()).min(1, 'At least one target grade required'),
  topics: z.array(z.string()).min(1, 'At least one topic required'),
  prerequisites: z.array(z.string()).optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface EditCourseFormProps {
  courseId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export default function EditCourseForm({ courseId, onSuccess, onCancel }: EditCourseFormProps) {
  const { user } = useAuth();
  const updateCourse = useUpdateCourse();

  const [currentTab, setCurrentTab] = useState('basic');
  const [topicInput, setTopicInput] = useState('');
  const [prereqInput, setPrereqInput] = useState('');

  const { data: course, isLoading } = useCourse(courseId);

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
    mode: 'onSubmit',
  });

  // ✅ normalize values coming from Firestore/useCourse
  useEffect(() => {
    if (!course) return;

    const safeTargetAge = Array.isArray(course.targetAge)
      ? course.targetAge.map((a: any) => Number(a)).filter((n: number) => Number.isFinite(n))
      : [];

    form.reset({
      name: course.name ?? '',
      area: (course.area as any) ?? 'Phonics',
      level: Number(course.level ?? 1),
      description: course.description ?? '',
      status: (course.status as any) ?? 'draft',
      ratePerSession: Number(course.ratePerSession ?? 500),
      durationMinutes: Number(course.durationMinutes ?? 35),
      sessionFrequency: (course.sessionFrequency as any) ?? 'weekly',
      maxStudentsPerSession: Number(course.maxStudentsPerSession ?? 3),
      targetAge: safeTargetAge,
      targetGrade: Array.isArray(course.targetGrade) ? course.targetGrade : [],
      topics: Array.isArray(course.topics) ? course.topics : [],
      prerequisites: Array.isArray(course.prerequisites) ? course.prerequisites : [],
    });
  }, [course, form]);

  const addToArray = (
    field: 'targetAge' | 'targetGrade' | 'topics' | 'prerequisites',
    value: string | number,
  ) => {
    const current = (form.getValues(field) as any[]) ?? [];
    if (!current.includes(value)) {
      form.setValue(field, [...current, value] as any, { shouldDirty: true, shouldValidate: true });
    }
  };

  const removeFromArray = (
    field: 'targetAge' | 'targetGrade' | 'topics' | 'prerequisites',
    value: string | number,
  ) => {
    const current = (form.getValues(field) as any[]) ?? [];
    form.setValue(
      field,
      current.filter((item) => item !== value) as any,
      { shouldDirty: true, shouldValidate: true },
    );
  };

  const addTopic = () => {
    const v = topicInput.trim();
    if (!v) return;
    addToArray('topics', v);
    setTopicInput('');
  };

  const addPrereq = () => {
    const v = prereqInput.trim();
    if (!v) return;
    addToArray('prerequisites', v);
    setPrereqInput('');
  };

  const onSubmit: SubmitHandler<CourseFormData> = async (data) => {
    if (!user?.uid) {
      toast({ title: 'Error', description: 'User not authenticated', variant: 'destructive' });
      return;
    }

    try {
      await updateCourse.mutateAsync({
        courseId,
        data,
        updatedBy: user.uid,
      });

      toast({ title: 'Success', description: 'Course updated successfully!' });
      onSuccess?.();
    } catch (error: any) {
      console.error('Error updating course:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to update course',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) return <div className="flex justify-center p-8">Loading course...</div>;
  if (!course) return <div className="text-red-600 p-4">Course not found</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Edit Course: {course.name}</CardTitle>
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

                {/* -------------------- Basic -------------------- */}
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
                          <Select
                            value={String(field.value)}
                            onValueChange={(v) => field.onChange(Number(v))}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Array.from({ length: 8 }, (_, i) => (
                                <SelectItem key={i + 1} value={String(i + 1)}>
                                  {i + 1}
                                </SelectItem>
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

                {/* -------------------- Pricing -------------------- */}
                <TabsContent value="pricing" className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="ratePerSession"
                      render={({ field }) => {
                        const value = typeof field.value === 'number' ? field.value : Number(field.value ?? 0);
                        return (
                          <FormItem>
                            <FormLabel>Rate per Session (₹) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="500"
                                value={Number.isFinite(value) ? value : 0}
                                onChange={(e) => field.onChange(Number(e.target.value || 0))}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />

                    <FormField
                      control={form.control}
                      name="durationMinutes"
                      render={({ field }) => {
                        const value = typeof field.value === 'number' ? field.value : Number(field.value ?? 0);
                        return (
                          <FormItem>
                            <FormLabel>Duration per Session (minutes) *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="35"
                                value={Number.isFinite(value) ? value : 0}
                                onChange={(e) => field.onChange(Number(e.target.value || 0))}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
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
                      render={({ field }) => {
                        const value = typeof field.value === 'number' ? field.value : Number(field.value ?? 0);
                        return (
                          <FormItem>
                            <FormLabel>Max Students per Session *</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="3"
                                value={Number.isFinite(value) ? value : 0}
                                onChange={(e) => field.onChange(Number(e.target.value || 0))}
                                onBlur={field.onBlur}
                                name={field.name}
                                ref={field.ref}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        );
                      }}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <FormLabel>Target Age Range *</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {form.watch('targetAge').map((age) => (
                          <Badge
                            key={age}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeFromArray('targetAge', age)}
                          >
                            Age {age} <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-2">
                        <Select onValueChange={(v) => addToArray('targetAge', Number(v))}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Add age" />
                          </SelectTrigger>
                          <SelectContent>
                            {Array.from({ length: 10 }, (_, i) => i + 3).map((age) => (
                              <SelectItem key={age} value={String(age)}>
                                {age}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <FormLabel>Target Grades *</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {form.watch('targetGrade').map((grade) => (
                          <Badge
                            key={grade}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeFromArray('targetGrade', grade)}
                          >
                            {grade} <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-2">
                        <Select onValueChange={(v) => addToArray('targetGrade', v)}>
                          <SelectTrigger className="w-48">
                            <SelectValue placeholder="Add grade" />
                          </SelectTrigger>
                          <SelectContent>
                            {['Nursery', 'KG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'].map(
                              (grade) => (
                                <SelectItem key={grade} value={grade}>
                                  {grade}
                                </SelectItem>
                              ),
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* -------------------- Topics -------------------- */}
                <TabsContent value="topics" className="space-y-4">
                  <div>
                    <FormLabel>Topics *</FormLabel>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.watch('topics').map((topic) => (
                        <Badge
                          key={topic}
                          variant="secondary"
                          className="cursor-pointer"
                          onClick={() => removeFromArray('topics', topic)}
                        >
                          {topic} <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Add topic name"
                        value={topicInput}
                        onChange={(e) => setTopicInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTopic();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={addTopic}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </TabsContent>

                {/* -------------------- Prerequisites -------------------- */}
                <TabsContent value="prerequisites" className="space-y-4">
                  <div>
                    <FormLabel>Prerequisites (Optional)</FormLabel>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {form.watch('prerequisites')?.map((prereq) => (
                        <Badge
                          key={prereq}
                          variant="outline"
                          className="cursor-pointer"
                          onClick={() => removeFromArray('prerequisites', prereq)}
                        >
                          {prereq} <X className="ml-1 h-3 w-3" />
                        </Badge>
                      ))}
                    </div>

                    <div className="flex gap-2 mt-2">
                      <Input
                        placeholder="Add prerequisite course"
                        value={prereqInput}
                        onChange={(e) => setPrereqInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addPrereq();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={addPrereq}>
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

                <Button type="submit" disabled={updateCourse.isPending}>
                  {updateCourse.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Update Course
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
