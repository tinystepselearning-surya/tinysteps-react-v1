/**
 * Admin Portal Type Definitions
 * Defines all user roles, permissions, and data structures
 */

// User Role Types
export type UserRole = 'parent' | 'student' | 'teacher' | 'learning-partner' | 'admin';

export const USER_ROLES: Record<UserRole, string> = {
  'parent': 'Parent',
  'student': 'Student',
  'teacher': 'Teacher',
  'learning-partner': 'Learning Partner',
  'admin': 'Admin'
};

export const USER_ROLE_OPTIONS = Object.entries(USER_ROLES).map(([value, label]) => ({
  value,
  label
}));

// User Status
export type UserStatus = 'active' | 'suspended' | 'pending';

// Base User Interface
export interface BaseUser {
  uid: string;
  email: string;
  username: string;
  usernameLower: string;
  displayName: string;
  role: UserRole;
  status: UserStatus;
  createdAt: string;
  createdBy?: string;
  updatedAt?: string;
  photoURL?: string;
  phoneNumber?: string;
}

// Parent-specific fields
export interface Parent extends BaseUser {
  role: 'parent';
  children: string[]; // Array of student UIDs
  learningPartnerId?: string; // Assigned Learning Partner UID
}

// Student-specific fields
export interface Student extends BaseUser {
  role: 'student';
  parentId: string; // Required - student must have a parent
  dateOfBirth?: string; // ISO date string
  age?: number; // Calculated from DOB
  grade?: string;
  currentPhase?: number; // Phonics phase (0-10)
  enrolledCourses: string[]; // Array of course IDs
  learningPartnerId?: string; // Inherited from parent or directly assigned
  teacherId?: string; // Assigned teacher UID
  admissionNumber?: string; // Unique admission number (e.g., TS001, TS002)
}

// Teacher-specific fields
export interface Teacher extends BaseUser {
  role: 'teacher';
  subjects?: string[];
  students: string[]; // Array of student UIDs
  learningPartnerId?: string; // Assigned Learning Partner UID
}

// Learning Partner-specific fields
export interface LearningPartner extends BaseUser {
  role: 'learning-partner';
  assignedTeachers: string[]; // Array of teacher UIDs
  assignedParents: string[]; // Array of parent UIDs
  assignedStudents: string[]; // Array of student UIDs (through parents)
}

// Admin-specific fields
export interface Admin extends BaseUser {
  role: 'admin';
  isSuperAdmin?: boolean;
}

// Union type for all users
export type User = Parent | Student | Teacher | LearningPartner | Admin;

// Course Interface
export interface Course {
  id: string;
  name: string;
  description: string;
  type: 'phonics' | 'grammar' | 'public-speaking' | 'other';
  phases?: number[]; // For phonics courses
  isActive: boolean;
  createdAt: string;
}

// Student-Course Enrollment
export interface CourseEnrollment {
  studentId: string;
  courseId: string;
  enrolledAt: string;
  progress?: number; // 0-100
  completedAt?: string;
  status: 'active' | 'completed' | 'dropped';
}

// Permission Interface
export interface Permission {
  id: string;
  name: string;
  description: string;
  roles: UserRole[];
}

// Role Permission Matrix
export const ROLE_PERMISSIONS = {
  'admin': [
    'manage_users',
    'manage_roles',
    'manage_courses',
    'manage_content',
    'view_analytics',
    'manage_billing',
    'manage_settings'
  ],
  'learning-partner': [
    'view_teachers',
    'view_parents',
    'view_students',
    'view_analytics',
    'assign_courses'
  ],
  'teacher': [
    'view_students',
    'manage_lessons',
    'view_progress',
    'give_feedback'
  ],
  'parent': [
    'view_children',
    'view_progress',
    'access_resources',
    'communicate_teacher'
  ],
  'student': [
    'access_courses',
    'play_games',
    'view_own_progress'
  ]
} as const;

// Create User Form Data
export interface CreateUserFormData {
  email: string;
  username: string;
  displayName: string;
  role: UserRole;
  password: string;
  phoneNumber?: string;
  parentId?: string; // Required for students
  learningPartnerId?: string;
  teacherId?: string;
  enrolledCourses?: string[];
  dateOfBirth?: string; // For students - ISO date string
  firstName?: string; // For parents
  lastName?: string; // For parents
  admissionNumber?: string; // Auto-generated for students
}

// System Statistics
export interface SystemStats {
  totalUsers: number;
  activeUsers: number;
  totalParents: number;
  totalStudents: number;
  totalTeachers: number;
  totalLearningPartners: number;
  totalAdmins: number;
  newUsersToday: number;
  newUsersThisWeek: number;
  newUsersThisMonth: number;
  totalSessions: number;
  activeSessions: number;
  completedSessions: number;
  totalRevenue: number;
  monthlyRevenue: number;
  lastUpdated: string;
}

// User Analytics
export interface UserAnalytics {
  userId: string;
  displayName: string;
  role: UserRole;
  lastLogin?: string;
  loginCount: number;
  sessionsCompleted?: number;
  totalActivityTime?: number; // in minutes
  averageSessionDuration?: number; // in minutes
  createdAt: string;
}

// Audit Log Entry
export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: AuditAction;
  entityType: 'user' | 'student' | 'teacher' | 'parent' | 'session' | 'course' | 'system';
  entityId?: string;
  details: string;
  ipAddress?: string;
  metadata?: Record<string, any>;
}

// Audit Actions
export type AuditAction = 
  | 'user_created'
  | 'user_updated'
  | 'user_deleted'
  | 'user_login'
  | 'user_logout'
  | 'role_changed'
  | 'assignment_created'
  | 'assignment_removed'
  | 'course_assigned'
  | 'course_removed'
  | 'session_created'
  | 'session_completed'
  | 'session_cancelled'
  | 'settings_updated'
  | 'system_config_changed';

// System Health
export interface SystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  uptime: number; // percentage
  responseTime: number; // ms
  errorRate: number; // percentage
  activeConnections: number;
  databaseStatus: 'connected' | 'disconnected' | 'error';
  storageUsed: number; // GB
  storageLimit: number; // GB
  lastHealthCheck: string;
}

// Growth Metrics
export interface GrowthMetrics {
  period: 'day' | 'week' | 'month' | 'year';
  userGrowth: number; // percentage
  revenueGrowth: number; // percentage
  engagementGrowth: number; // percentage
  retentionRate: number; // percentage
  churnRate: number; // percentage
}

// System Settings
export interface SystemSettings {
  id: string;
  maintenanceMode: boolean;
  allowNewSignups: boolean;
  requireEmailVerification: boolean;
  maxStudentsPerTeacher: number;
  maxTeachersPerRM: number;
  sessionDurationMinutes: number;
  featureFlags: {
    enableGames: boolean;
    enableVideoLessons: boolean;
    enableLiveClasses: boolean;
    enableNotifications: boolean;
  };
  updatedAt: string;
  updatedBy: string;
}

// Firestore Collection Names
export const COLLECTIONS = {
  USERS: 'users',
  USERNAMES: 'usernames',
  PARENTS: 'parents',
  STUDENTS: 'students',
  TEACHERS: 'teachers',
  LEARNING_PARTNERS: 'learning-partners',
  ADMINS: 'admins',
  COURSES: 'courses',
  ENROLLMENTS: 'enrollments',
  SESSIONS: 'sessions',
  AUDIT_LOGS: 'audit_logs',
  SYSTEM_STATS: 'system_stats',
  SYSTEM_SETTINGS: 'system_settings'
} as const;
