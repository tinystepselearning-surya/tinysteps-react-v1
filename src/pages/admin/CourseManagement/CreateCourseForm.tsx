// src/pages/admin/CourseManagement/CreateCourseForm.tsx
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { useAuth } from '../../../hooks/useAuth';
import { useCreateCourse } from '../../../hooks/courses/useCreateCourse';

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

/** Slug → courses/{slug} */
function slugify(input: string) {
  return input
    .trim()
    .toLowerCase()
    .replace(/['"]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const baseSchema = z.object({
  name: z.string().min(3, 'Course name must be at least 3 characters'),
  area: z.enum(['Phonics', 'Grammar', 'Speaking']),
  level: z.coerce.number().min(1).max(8),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  status: z.enum(['active', 'inactive', 'draft']),
  ratePerSession: z.coerce.number().min(100, 'Rate must be at least ₹100'),
  durationMinutes: z.coerce.number().min(15).max(60),
  sessionFrequency: z.enum(['weekly', 'biweekly', 'monthly']),
  maxStudentsPerSession: z.coerce.number().min(1).max(10),

  // Allow draft creation with empty arrays (but validate on "active")
  targetAge: z.array(z.coerce.number()).default([]),
  targetGrade: z.array(z.string()).default([]),
  topics: z.array(z.string()).default([]),
  prerequisites: z.array(z.string()).default([]),
});

const courseSchema = baseSchema.superRefine((val, ctx) => {
  // Only enforce strict requirements when activating course
  if (val.status === 'active') {
    if (!val.topics?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['topics'],
        message: 'Add at least one topic before setting course to Active.',
      });
    }
    if (!val.targetAge?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetAge'],
        message: 'Add at least one target age before setting course to Active.',
      });
    }
    if (!val.targetGrade?.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['targetGrade'],
        message: 'Add at least one target grade before setting course to Active.',
      });
    }
  }
});

type CourseFormInput = z.input<typeof courseSchema>;
type CourseFormData = z.output<typeof courseSchema>;

interface CreateCourseFormProps {
  onSuccess?: (courseId: string) => void;
  onCancel?: () => void;
}

export default function CreateCourseForm({ onSuccess, onCancel }: CreateCourseFormProps) {
  const { user } = useAuth();
  const createCourse = useCreateCourse();

  const [currentTab, setCurrentTab] = useState('basic');
  const [topicInput, setTopicInput] = useState('');
  const [prereqInput, setPrereqInput] = useState('');

  const isSubmitting =
    (createCourse as any).isPending ?? (createCourse as any).isLoading ?? false;

  const form = useForm<CourseFormInput>({
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

  const watchedName = form.watch('name');
  const computedCourseId = useMemo(() => slugify(watchedName || ''), [watchedName]);

  const addToArray = (
    field: 'targetAge' | 'targetGrade' | 'topics' | 'prerequisites',
    value: string | number
  ) => {
    const current = (form.getValues(field as any) as any[]) ?? [];
    if (!current.includes(value)) {
      form.setValue(field as any, [...current, value], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  };

  const removeFromArray = (
    field: 'targetAge' | 'targetGrade' | 'topics' | 'prerequisites',
    value: string | number
  ) => {
    const current = (form.getValues(field as any) as any[]) ?? [];
    form.setValue(
      field as any,
      current.filter((item) => item !== value),
      { shouldDirty: true, shouldValidate: true }
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

  const onSubmit = async (values: CourseFormInput) => {
    if (!user?.uid) {
      toast({
        title: 'Error',
        description: 'User not authenticated',
        variant: 'destructive',
      });
      return;
    }

    const data: CourseFormData = courseSchema.parse(values);

    const courseId = slugify(data.name);
    if (!courseId) {
      toast({
        title: 'Error',
        description: 'Invalid course name. Please use letters/numbers.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const res = await createCourse.mutateAsync({
        id: courseId,
        data: {
          ...data,
          courseId, // keep inside doc for convenience
        },
        createdBy: user.uid,
      });

      toast({
        title: 'Success',
        description: `Course "${data.name}" created (id: ${res.id})`,
      });

      onSuccess?.(res.id);
      // form.reset(); // optional
    } catch (error: any) {
      console.error('Error creating course:', error);
      toast({
        title: 'Error',
        description: error?.message || 'Failed to create course',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Create New Course</CardTitle>
          {computedCourseId ? (
            <div className="text-xs text-muted-foreground">
              Course ID will be: <span className="font-mono">{computedCourseId}</span>
            </div>
          ) : null}
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
                            <Input placeholder="e.g., Phonics Foundations 1" {...field} />
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
                          <Select onValueChange={field.onChange} value={field.value as any}>
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
                            value={String(field.value ?? '')}
                            onValueChange={field.onChange}
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
                          <Select onValueChange={field.onChange} value={field.value as any}>
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
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Rate per Session (₹) *</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="500"
                              value={(typeof field.value === 'number' || typeof field.value === 'string') ? (field.value as any) : ''}
                              onChange={(e) => field.onChange(e.target.value)}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
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
                              value={(typeof field.value === 'number' || typeof field.value === 'string') ? (field.value as any) : ''}
                              onChange={(e) => field.onChange(e.target.value)}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
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
                          <Select onValueChange={field.onChange} value={field.value as any}>
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
                              value={(typeof field.value === 'number' || typeof field.value === 'string') ? (field.value as any) : ''}
                              onChange={(e) => field.onChange(e.target.value)}
                              onBlur={field.onBlur}
                              name={field.name}
                              ref={field.ref}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="space-y-4">
                    <div>
                      <FormLabel>Target Age Range</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(form.watch('targetAge' as any) ?? []).map((age: any) => (
                          <Badge
                            key={String(age)}
                            variant="secondary"
                            className="cursor-pointer"
                            onClick={() => removeFromArray('targetAge', age)}
                          >
                            Age {age} <X className="ml-1 h-3 w-3" />
                          </Badge>
                        ))}
                      </div>

                      <div className="flex gap-2 mt-2">
                        <Select onValueChange={(v) => addToArray('targetAge', v)}>
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
                      <FormLabel>Target Grades</FormLabel>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {(form.watch('targetGrade' as any) ?? []).map((grade: any) => (
                          <Badge
                            key={String(grade)}
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
                              )
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
                    <FormLabel>Topics {form.watch('status') === 'active' ? '*' : '(optional for Draft)'}</FormLabel>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {(form.watch('topics' as any) ?? []).map((topic: any) => (
                        <Badge
                          key={String(topic)}
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

                    {/* Show schema error if active */}
                    <FormMessage>{form.formState.errors.topics?.message as any}</FormMessage>
                  </div>
                </TabsContent>

                {/* -------------------- Prerequisites -------------------- */}
                <TabsContent value="prerequisites" className="space-y-4">
                  <div>
                    <FormLabel>Prerequisites (Optional)</FormLabel>

                    <div className="flex flex-wrap gap-2 mt-2">
                      {(form.watch('prerequisites' as any) ?? []).map((prereq: any) => (
                        <Badge
                          key={String(prereq)}
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
