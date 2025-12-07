export type LessonCategory = 'phonics' | 'grammar' | 'speaking';

export interface TeacherLesson {
  id: string;
  title: string;
  category: LessonCategory;
  level?: string;
  ageRange?: string;
  durationMinutes?: number;
  tags?: string[];
  canvaUrl?: string;
  thumbnailUrl?: string;
  isActive?: boolean;
  isDraft?: boolean;
}
