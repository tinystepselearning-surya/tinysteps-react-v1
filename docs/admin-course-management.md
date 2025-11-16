Course Management & Student Enrollment - Admin Guide
===============================================

Overview
--------
This document covers the admin workflows for managing courses, assigning courses to students, assigning teachers and Learning Partners (LPs), and viewing enrollments.

Key pages:
- Admin Dashboard -> Course Management: Create, edit, delete courses.
- Admin Dashboard -> Student Management: List students, create/delete students, assign course/teacher/LP.

Course Management
-----------------
1. Open the Admin Dashboard and go to 'Course Management'.
2. Click 'Create Course' to add a new course with title, description, and level.
3. Use 'Edit' to update a course details.
4. Use 'Delete' to remove a course (admin-only).

Student Management
------------------
1. In Student Management, each student row shows enrollments (Course, Teacher, Status).
2. Use 'Assign Course' to add a course enrollment to a student. The system prevents duplicate course enrollments.
3. Use 'Assign Teacher' to assign a teacher to an existing enrollment. This also updates the student's `teacherId`.
4. Use 'Assign LP' to assign a Learning Partner to an existing enrollment and update the kid's `lpId`.
5. Enrollment removal: Admins/LPs can remove enrollments.

Notes
-----
- Enrollments support both `studentId` (legacy) and `kidIds` (current). New enrollment entries include `kidIds` for compatibility.
- Assigning teachers and LPs updates both the enrollment documents and the student `teacherId`/`lpId` fields so permissions and views stay consistent.
- To clean up duplicate enrollments, use the 'admin' tooling or contact platform admin (we can provide a cleanup script upon request).

Next steps
----------
- Add a UI for merging duplicate enrollments if required.
- Add more advanced filtering to Student Management for enrollment status, course and teacher.
