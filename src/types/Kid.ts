export interface Kid {
  id: string; // Unique identifier for the kid document
  name: string; // Full name of the child
  birthdate: string; // ISO date string for the child's birthdate
  parentId: string; // UID of the parent user
  teacherId?: string; // UID of the assigned teacher (optional)
  sessionId?: string; // ID of the current session the child is enrolled in (optional)
  progressSummary?: string; // Summary of the child's progress (optional)
  createdAt: string; // ISO date string for when the document was created
  updatedAt: string; // ISO date string for the last update to the document
}