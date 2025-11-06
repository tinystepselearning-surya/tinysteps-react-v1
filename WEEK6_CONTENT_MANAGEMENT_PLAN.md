# Week 6: Content & Course Management System - Implementation Plan

**Status**: 🚀 **READY TO START**

## Overview
Week 6 focuses on building a comprehensive Content & Course Management System, enabling admins and learning partners to create, manage, and organize educational content, courses, lessons, and learning paths for students.

---

## 🎯 Objectives

### Primary Goals
1. **Course Management**: Create, edit, delete courses with metadata (phases, difficulty, age groups)
2. **Lesson Planning**: Build lesson structure with activities, resources, and learning objectives
3. **Content Library**: Manage videos, PDFs, images, audio files, and interactive content
4. **Learning Paths**: Create structured learning journeys through phonics phases 0-10
5. **Progress Tracking**: Track student progress through courses and lessons
6. **Resource Management**: Organize teaching materials, worksheets, and assessment tools

### Secondary Goals
- Content versioning and publishing workflow
- Preview functionality for courses and lessons
- Content categorization and tagging
- Search and filter content library
- Content analytics and usage tracking

---

## 📋 Implementation Tasks (Week 6 Todo List)

### Phase 1: Data Layer & Types (Tasks 1-3)
**Task 1: Create Course & Content Types**
- Define Course interface (id, title, description, phase, difficulty, ageRange, thumbnail, lessons[], createdBy)
- Define Lesson interface (id, courseId, title, objectives[], activities[], resources[], duration, order)
- Define Activity interface (id, type: 'video'|'game'|'worksheet'|'quiz', content, duration)
- Define Resource interface (id, type, title, url, fileSize, uploadedBy, uploadedAt)
- Define LearningPath interface (id, title, courses[], prerequisites[], estimatedDuration)
- Define ContentCategory type, ContentTag type
- Add to `app/src/types/content.ts`

**Task 2: Extend Services - Content Management**
- Create `app/src/services/courseService.ts`:
  - getCourses(filter?): Fetch all courses with optional filtering
  - getCourseById(id): Get single course with full details
  - createCourse(data): Create new course
  - updateCourse(id, updates): Update course details
  - deleteCourse(id): Soft delete course
  - publishCourse(id): Change course status to published
  - duplicateCourse(id): Clone existing course
  
- Create `app/src/services/lessonService.ts`:
  - getLessons(courseId): Get all lessons for a course
  - createLesson(courseId, data): Add lesson to course
  - updateLesson(id, updates): Update lesson content
  - deleteLesson(id): Remove lesson
  - reorderLessons(courseId, lessonIds): Change lesson sequence
  
- Create `app/src/services/resourceService.ts`:
  - uploadResource(file, metadata): Upload file to Firebase Storage
  - getResources(type?, category?): List all resources
  - deleteResource(id): Remove resource and file
  - getResourceUrl(id): Get download/stream URL

**Task 3: Create Custom Hooks**
- `app/src/hooks/useCourses.ts`: Fetch and manage courses
- `app/src/hooks/useLessons.ts`: Fetch lessons for a course
- `app/src/hooks/useResources.ts`: Manage content library resources
- `app/src/hooks/useContentSearch.ts`: Search across courses, lessons, resources

### Phase 2: Admin Pages - Course Management (Tasks 4-7)
**Task 4: Courses Overview Page**
- Path: `/surya/courses`
- Features:
  - Grid/list view of all courses
  - Filter by phase (0-10), status (draft/published), difficulty
  - Search by title/description
  - Quick stats: total courses, published, drafts
  - Create new course button
  - Edit/delete/duplicate actions
  - Preview course button
- Components: CourseCard, CourseFilters, CourseStats

**Task 5: Course Builder Page**
- Path: `/surya/courses/create` and `/surya/courses/:id/edit`
- Features:
  - Step 1: Basic Info (title, description, phase, difficulty, age range, thumbnail upload)
  - Step 2: Learning Objectives (add/remove objectives with descriptions)
  - Step 3: Lessons (add/reorder lessons, set durations)
  - Step 4: Resources (attach PDFs, videos, worksheets)
  - Step 5: Review & Publish (preview all data, publish or save as draft)
  - Auto-save draft functionality
  - Rich text editor for descriptions
  - Image upload for thumbnails
- Components: CourseForm, LessonList, ResourceUploader, StepWizard

**Task 6: Lesson Builder Page**
- Path: `/surya/courses/:courseId/lessons/:lessonId/edit`
- Features:
  - Lesson title and description
  - Learning objectives list
  - Activity builder:
    - Add video activity (YouTube/Firebase video URL, duration)
    - Add game activity (select from game library, configure settings)
    - Add worksheet activity (upload PDF, add instructions)
    - Add quiz activity (create questions, answers, correct answer)
  - Resource library (attach supplementary materials)
  - Duration calculator (sum of all activities)
  - Preview lesson flow
  - Save and continue editing
- Components: ActivityBuilder, VideoUploader, QuizBuilder

**Task 7: Content Library Page**
- Path: `/surya/library`
- Features:
  - Tab navigation: All | Videos | PDFs | Images | Audio
  - Upload new resource button (multi-file upload with drag-and-drop)
  - Grid view with thumbnails
  - File details: name, type, size, uploaded by, uploaded date
  - Search and filter by type/category/tags
  - Bulk select and delete
  - Resource usage tracking (which courses use this resource)
  - Preview modal (video player, PDF viewer, image viewer)
- Components: ResourceGrid, FileUploader, ResourcePreview, UsageTracker

### Phase 3: Learning Paths & Progress (Tasks 8-9)
**Task 8: Learning Paths Page**
- Path: `/surya/learning-paths`
- Features:
  - List of all learning paths (e.g., "Phonics Journey Phase 0-10")
  - Create learning path wizard
  - Add courses to path in sequence
  - Set prerequisites (must complete X before Y)
  - Estimated duration calculation
  - Assign learning path to students/groups
  - Visual flowchart of path progression
- Components: PathBuilder, PathFlowchart, CourseSelector

**Task 9: Student Progress Dashboard**
- Path: `/surya/progress/:studentId`
- Features:
  - Student overview (name, age, current phase)
  - Enrolled courses with completion %
  - Current lesson and next recommended lesson
  - Time spent on each course/lesson
  - Activities completed vs. total
  - Achievements and milestones
  - Progress timeline (visual calendar)
  - Export progress report (PDF)
- Components: ProgressChart, LessonTimeline, AchievementBadges

### Phase 4: Integration & Routes (Task 10)
**Task 10: Update Routes and Navigation**
- Add to `app/src/Routes.tsx`:
  - `/surya/courses` → CoursesOverview
  - `/surya/courses/create` → CourseBuilder
  - `/surya/courses/:id/edit` → CourseBuilder
  - `/surya/courses/:courseId/lessons/:lessonId/edit` → LessonBuilder
  - `/surya/library` → ContentLibrary
  - `/surya/learning-paths` → LearningPaths
  - `/surya/progress/:studentId` → StudentProgress
- Update AdminDashboard sidebar navigation
- Add "Content" section with submenu

---

## 📂 File Structure

```
app/src/
├── types/
│   └── content.ts (NEW - Course, Lesson, Activity, Resource types)
├── services/
│   ├── courseService.ts (NEW - 7 functions)
│   ├── lessonService.ts (NEW - 5 functions)
│   └── resourceService.ts (NEW - 4 functions)
├── hooks/
│   ├── useCourses.ts (NEW)
│   ├── useLessons.ts (NEW)
│   ├── useResources.ts (NEW)
│   └── useContentSearch.ts (NEW)
├── pages/
│   └── admin/
│       ├── courses/
│       │   ├── CoursesOverview.tsx (NEW)
│       │   ├── CourseBuilder.tsx (NEW)
│       │   └── LessonBuilder.tsx (NEW)
│       ├── library/
│       │   └── ContentLibrary.tsx (NEW)
│       ├── learning-paths/
│       │   └── LearningPaths.tsx (NEW)
│       └── progress/
│           └── StudentProgress.tsx (NEW)
├── components/
│   └── content/
│       ├── CourseCard.tsx (NEW)
│       ├── CourseFilters.tsx (NEW)
│       ├── CourseStats.tsx (NEW)
│       ├── CourseForm.tsx (NEW)
│       ├── LessonList.tsx (NEW)
│       ├── ResourceUploader.tsx (NEW)
│       ├── ActivityBuilder.tsx (NEW)
│       ├── VideoUploader.tsx (NEW)
│       ├── QuizBuilder.tsx (NEW)
│       ├── ResourceGrid.tsx (NEW)
│       ├── FileUploader.tsx (NEW)
│       ├── ResourcePreview.tsx (NEW)
│       ├── PathBuilder.tsx (NEW)
│       ├── PathFlowchart.tsx (NEW)
│       ├── ProgressChart.tsx (NEW)
│       ├── LessonTimeline.tsx (NEW)
│       └── AchievementBadges.tsx (NEW)
└── Routes.tsx (MODIFIED - add 7 new routes)
```

**Total New Files**: 30+
- 1 new type file
- 3 new service files
- 4 new hook files
- 6 new page files
- 16+ new component files
- 1 modified route file

---

## 🗄️ Firestore Collections

### New Collections
```javascript
// courses collection
{
  id: string,
  title: string,
  description: string,
  phase: number, // 0-10 for phonics phases
  difficulty: 'beginner' | 'intermediate' | 'advanced',
  ageRange: { min: number, max: number },
  thumbnailUrl: string,
  status: 'draft' | 'published' | 'archived',
  lessons: string[], // array of lesson IDs
  objectives: string[],
  estimatedDuration: number, // in minutes
  category: string,
  tags: string[],
  createdBy: string, // admin or LP uid
  createdAt: string,
  updatedAt: string,
  publishedAt?: string,
  enrolledStudents: number // count
}

// lessons collection
{
  id: string,
  courseId: string,
  title: string,
  description: string,
  objectives: string[],
  activities: Activity[], // inline activities
  resources: string[], // resource IDs
  order: number, // lesson sequence in course
  duration: number, // in minutes
  createdBy: string,
  createdAt: string,
  updatedAt: string
}

// resources collection
{
  id: string,
  type: 'video' | 'pdf' | 'image' | 'audio' | 'worksheet',
  title: string,
  description?: string,
  url: string, // Firebase Storage URL
  fileName: string,
  fileSize: number,
  mimeType: string,
  category: string,
  tags: string[],
  uploadedBy: string,
  uploadedAt: string,
  usageCount: number, // how many courses use this
  usedIn: string[] // course IDs
}

// learning_paths collection
{
  id: string,
  title: string,
  description: string,
  courses: string[], // ordered array of course IDs
  prerequisites: Record<string, string[]>, // courseId => [prerequisiteCourseId]
  estimatedDuration: number,
  difficulty: string,
  createdBy: string,
  createdAt: string,
  updatedAt: string
}

// student_progress collection
{
  id: string, // studentId_courseId
  studentId: string,
  courseId: string,
  enrolledAt: string,
  startedAt?: string,
  completedAt?: string,
  currentLessonId?: string,
  completedLessons: string[],
  completedActivities: string[],
  progressPercentage: number,
  timeSpent: number, // in minutes
  lastAccessedAt: string
}
```

---

## 🎨 UI/UX Guidelines

### Design Principles
- **Consistent Dark Theme**: Gray-900 background, gray-800 cards (matching admin portal)
- **Content-First**: Large previews, visual thumbnails for courses
- **Drag-and-Drop**: For reordering lessons, uploading files
- **Real-time Preview**: Show content changes immediately
- **Progress Indicators**: Visual bars, percentages, timelines

### Color Coding
- **Draft**: Yellow (amber-500)
- **Published**: Green (green-500)
- **Archived**: Gray (gray-500)
- **Video**: Purple (purple-500)
- **PDF**: Red (red-500)
- **Image**: Blue (blue-500)
- **Audio**: Teal (teal-500)

### Icons (Heroicons)
- Course: AcademicCapIcon
- Lesson: BookOpenIcon
- Activity: PlayIcon
- Resource: DocumentIcon
- Learning Path: MapIcon
- Progress: ChartBarIcon

---

## 🔧 Technical Considerations

### Firebase Storage
- Set up storage buckets for:
  - `/course-thumbnails/`
  - `/lesson-videos/`
  - `/worksheets/`
  - `/resources/`
- Implement upload progress tracking
- File size limits (videos: 100MB, PDFs: 10MB, images: 5MB)
- Security rules for admin/LP only uploads

### Performance Optimizations
- Lazy load course list (pagination: 20 courses per page)
- Cache course thumbnails
- Compress uploaded images
- Video transcoding (use Firebase Extensions)
- Debounced search input

### Validation
- Required fields: title, description, phase
- Title length: 5-100 characters
- Description: 20-500 characters
- Thumbnail: Required, max 5MB, JPG/PNG only
- Lessons: Minimum 1 lesson per course
- Activities: Minimum 1 activity per lesson

---

## 📊 Success Metrics

### Completion Criteria
- ✅ All 10 tasks completed
- ✅ Zero TypeScript errors
- ✅ Build succeeds in < 3s
- ✅ All routes protected with AdminRoute
- ✅ Can create, edit, delete courses
- ✅ Can upload and manage resources
- ✅ Can build complete learning paths
- ✅ Student progress tracked accurately

### Quality Metrics
- Code coverage: Types 100%, Services 80%+, Components 60%+
- Accessibility: WCAG 2.1 AA compliant
- Performance: Page load < 2s, search results < 500ms
- User experience: < 3 clicks to create a course

---

## 🚀 Implementation Strategy

### Week 6 Development Flow
1. **Day 1-2**: Data layer (types, services, hooks) - Bottom-up foundation
2. **Day 3**: CoursesOverview and CourseBuilder pages
3. **Day 4**: LessonBuilder and ContentLibrary pages
4. **Day 5**: LearningPaths and StudentProgress pages
5. **Day 6**: Integration, testing, bug fixes
6. **Day 7**: Documentation and deployment

### Parallel Work Opportunities
- Services and hooks can be built in parallel
- Components can be developed independently
- Pages can be built while components are in progress

---

## 📝 Future Enhancements (Post-Week 6)

### Advanced Features
- **Content Versioning**: Track changes, revert to previous versions
- **Collaborative Editing**: Multiple admins/LPs editing same course
- **AI-Powered Recommendations**: Suggest next lesson based on performance
- **Adaptive Learning**: Adjust difficulty based on student progress
- **Gamification**: Badges, leaderboards, achievement system
- **Live Classes Integration**: Schedule and conduct live sessions
- **Assessment Tools**: Quizzes, tests, automated grading
- **Parent Notifications**: Progress updates, milestone achievements
- **Content Marketplace**: Share/sell courses between institutions
- **Mobile App**: Native apps for students (iOS/Android)

---

## 🔗 Dependencies

### External Libraries (May Need)
- **react-quill** or **draft-js**: Rich text editor for descriptions
- **react-dropzone**: Drag-and-drop file upload
- **react-player**: Video player with controls
- **react-pdf**: PDF viewer component
- **react-flow** or **reactflow**: Visual flowchart for learning paths
- **recharts**: Charts for progress visualization
- **date-fns**: Date formatting and manipulation

### Firebase Services Required
- **Firestore**: Database for courses, lessons, resources
- **Firebase Storage**: File hosting (videos, PDFs, images)
- **Firebase Functions**: Video transcoding, image optimization
- **Firebase Extensions**: (Optional) Video transcoding, image resizing

---

## 📚 Integration with Existing Systems

### Week 1-5 Connections
- **Auth (Week 1)**: Protect course routes with AdminRoute
- **Parent Portal (Week 2)**: Show enrolled courses for children
- **Teacher Portal (Week 3)**: Assign courses to students
- **RM Portal (Week 4)**: Monitor course usage across teachers
- **Admin Portal (Week 5)**: Manage courses, track system-wide progress

---

**Week 6 Status**: 🎯 **READY TO BEGIN**
**Estimated Completion Time**: 5-7 days
**Priority Level**: HIGH (Core feature for platform)
**Complexity**: HIGH (Multiple new systems, file uploads, complex UI)

---

Let's build an amazing Content Management System! 🚀
