/**
 * Content Management Type Definitions
 * Defines types for courses, lessons, activities, resources, and learning paths
 */

// Content Status
export type ContentStatus = 'draft' | 'published' | 'archived';

// Content Difficulty Levels
export type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced';

// Resource Types
export type ResourceType = 'video' | 'pdf' | 'image' | 'audio' | 'worksheet' | 'document';

// Activity Types
export type ActivityType = 'video' | 'game' | 'worksheet' | 'quiz' | 'reading' | 'discussion';

// Age Range
export interface AgeRange {
  min: number;
  max: number;
}

// Course Interface
export interface Course {
  id: string;
  title: string;
  description: string;
  phase: number; // 0-10 for phonics phases
  difficulty: DifficultyLevel;
  ageRange: AgeRange;
  thumbnailUrl?: string;
  status: ContentStatus;
  lessons: string[]; // Array of lesson IDs (ordered)
  objectives: string[]; // Learning objectives
  estimatedDuration: number; // in minutes
  category: string;
  tags: string[];
  createdBy: string; // Admin or LP uid
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  enrolledStudents: number; // Count of enrolled students
  completionRate?: number; // Average completion rate (0-100)
}

// Lesson Interface
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  description: string;
  objectives: string[]; // Lesson-specific learning objectives
  activities: Activity[]; // Inline activities array
  resources: string[]; // Resource IDs for supplementary materials
  order: number; // Lesson sequence in course (0-based index)
  duration: number; // in minutes (calculated from activities)
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// Activity Interface
export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  description?: string;
  content: ActivityContent; // Type-specific content
  duration: number; // in minutes
  required: boolean; // Whether activity must be completed
  order: number; // Order within lesson
}

// Activity Content (type-specific)
export type ActivityContent = 
  | VideoActivityContent
  | GameActivityContent
  | WorksheetActivityContent
  | QuizActivityContent
  | ReadingActivityContent
  | DiscussionActivityContent;

export interface VideoActivityContent {
  type: 'video';
  videoUrl: string; // YouTube URL or Firebase Storage URL
  thumbnail?: string;
  transcript?: string;
  captions?: boolean;
}

export interface GameActivityContent {
  type: 'game';
  gameId: string; // Reference to game in games collection
  gameName: string;
  gameUrl: string; // Route to game (/games/spellbee, etc.)
  settings?: Record<string, any>; // Game-specific settings
}

export interface WorksheetActivityContent {
  type: 'worksheet';
  fileUrl: string; // PDF URL
  fileName: string;
  instructions?: string;
  answersUrl?: string; // Optional answer key URL
}

export interface QuizActivityContent {
  type: 'quiz';
  questions: QuizQuestion[];
  passingScore: number; // 0-100
  allowRetry: boolean;
  showCorrectAnswers: boolean;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer';
  options?: string[]; // For multiple choice
  correctAnswer: string | number; // Answer index for MC, true/false, or exact text
  explanation?: string;
  points: number;
}

export interface ReadingActivityContent {
  type: 'reading';
  content: string; // Rich text HTML or markdown
  wordCount?: number;
  readingLevel?: number; // Grade level
}

export interface DiscussionActivityContent {
  type: 'discussion';
  prompt: string;
  guidelines?: string[];
  moderatorNotes?: string;
}

// Resource Interface
export interface Resource {
  id: string;
  type: ResourceType;
  title: string;
  description?: string;
  url: string; // Firebase Storage URL
  fileName: string;
  fileSize: number; // in bytes
  mimeType: string;
  category: string;
  tags: string[];
  uploadedBy: string; // Admin or LP uid
  uploadedAt: string;
  updatedAt?: string;
  usageCount: number; // How many courses use this resource
  usedIn: string[]; // Course IDs where this resource is used
  thumbnailUrl?: string; // For images/videos
}

// Learning Path Interface
export interface LearningPath {
  id: string;
  title: string;
  description: string;
  courses: string[]; // Ordered array of course IDs
  prerequisites: Record<string, string[]>; // courseId => [prerequisiteCourseIds]
  estimatedDuration: number; // Total duration in minutes
  difficulty: DifficultyLevel;
  category: string;
  tags: string[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  enrolledStudents: number;
  completionRate?: number;
}

// Student Progress Interface
export interface StudentProgress {
  id: string; // studentId_courseId
  studentId: string;
  courseId: string;
  enrolledAt: string;
  startedAt?: string;
  completedAt?: string;
  currentLessonId?: string;
  completedLessons: string[]; // Lesson IDs
  completedActivities: string[]; // Activity IDs
  progressPercentage: number; // 0-100
  timeSpent: number; // in minutes
  lastAccessedAt: string;
  quizScores?: Record<string, number>; // activityId => score
  achievements?: string[]; // Achievement IDs
}

// Content Search Result
export interface ContentSearchResult {
  type: 'course' | 'lesson' | 'resource';
  id: string;
  title: string;
  description?: string;
  thumbnailUrl?: string;
  relevanceScore: number; // Search relevance (0-100)
}

// Form Data Types
export interface CreateCourseFormData {
  title: string;
  description: string;
  phase: number;
  difficulty: DifficultyLevel;
  ageRange: AgeRange;
  objectives: string[];
  category: string;
  tags: string[];
  thumbnail?: File; // File for upload
}

export interface CreateLessonFormData {
  title: string;
  description: string;
  objectives: string[];
  duration: number;
}

export interface UploadResourceFormData {
  type: ResourceType;
  title: string;
  description?: string;
  category: string;
  tags?: string[];
  thumbnailUrl?: string;
}

// Filter Options
export interface CourseFilters {
  status?: ContentStatus;
  phase?: number;
  difficulty?: DifficultyLevel;
  category?: string;
  tags?: string[];
  createdBy?: string;
  searchTerm?: string;
}

export interface ResourceFilters {
  type?: ResourceType;
  category?: string;
  tags?: string[];
  uploadedBy?: string;
  searchTerm?: string;
}

// Course Statistics
export interface CourseStats {
  totalCourses: number;
  publishedCourses: number;
  draftCourses: number;
  archivedCourses: number;
  totalLessons: number;
  totalActivities: number;
  totalResources: number;
  avgCompletionRate: number;
  totalEnrollments: number;
}

// Content Categories (can be extended)
export const CONTENT_CATEGORIES = {
  PHONICS: 'Phonics',
  GRAMMAR: 'Grammar',
  VOCABULARY: 'Vocabulary',
  READING: 'Reading',
  WRITING: 'Writing',
  SPEAKING: 'Speaking',
  LISTENING: 'Listening',
  GENERAL: 'General'
} as const;

export type ContentCategory = typeof CONTENT_CATEGORIES[keyof typeof CONTENT_CATEGORIES];

// Phonics Phases
export const PHONICS_PHASES = [
  { value: 0, label: 'Phase 0 - Pre-phonics' },
  { value: 1, label: 'Phase 1 - Environmental sounds' },
  { value: 2, label: 'Phase 2 - Basic sounds' },
  { value: 3, label: 'Phase 3 - Letter sounds' },
  { value: 4, label: 'Phase 4 - Adjacent consonants' },
  { value: 5, label: 'Phase 5 - Alternative spellings' },
  { value: 6, label: 'Phase 6 - Spelling rules' },
  { value: 7, label: 'Phase 7 - Advanced phonics' },
  { value: 8, label: 'Phase 8 - Fluent reading' },
  { value: 9, label: 'Phase 9 - Complex words' },
  { value: 10, label: 'Phase 10 - Mastery' }
] as const;

// Firestore Collections
export const CONTENT_COLLECTIONS = {
  COURSES: 'courses',
  LESSONS: 'lessons',
  RESOURCES: 'resources',
  LEARNING_PATHS: 'learning_paths',
  STUDENT_PROGRESS: 'student_progress',
  COURSE_ENROLLMENTS: 'course_enrollments'
} as const;

// Default Values
export const DEFAULT_COURSE: Partial<Course> = {
  status: 'draft',
  difficulty: 'beginner',
  phase: 0,
  ageRange: { min: 3, max: 8 },
  lessons: [],
  objectives: [],
  estimatedDuration: 0,
  tags: [],
  enrolledStudents: 0,
  completionRate: 0
};

export const DEFAULT_LESSON: Partial<Lesson> = {
  objectives: [],
  activities: [],
  resources: [],
  order: 0,
  duration: 0
};

export const DEFAULT_ACTIVITY: Partial<Activity> = {
  required: true,
  duration: 5,
  order: 0
};
