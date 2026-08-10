# Worksheets Optimization Architecture

## Goal

Make lesson delivery the centre of the resource model instead of treating worksheets as a separate parent-only library.

The workflow is:

1. Admin uploads the PDF/worksheet to Google Drive and pastes the share URL into Tiny Steps.
2. Admin attaches the worksheet to a canonical Tiny Steps lesson and a course.
3. The worksheet becomes visible to teachers from that lesson tile.
4. The worksheet becomes visible to parents only when the selected child is enrolled in the targeted course, with optional child/enrolment narrowing.
5. Admin may paste a private teacher class script against the same lesson.
6. Teachers can open the class script directly from the lesson tile; parents cannot read it.

This follows the common LMS pattern used by platforms such as Google Classroom and Canvas: resources belong to a curriculum unit/topic/module first, and audience rules determine who can see them.

## Design principles

### 1. Lesson is the canonical teaching context

Every new worksheet must have a `lessonId` and `lessonTitle`.

This creates a durable relationship between:

- lesson slides,
- worksheets/homework/revision resources,
- teacher class script,
- parent practice resources.

A worksheet should not depend on a manually typed lesson name alone.

### 2. Course enrolment controls parent visibility

`parentWorksheetLibrary` remains the admin-owned distribution collection, but parents have no direct Firestore read permission. `getParentWorksheetResources` verifies the authenticated parent, selected child ownership, and active enrolments server-side before returning a parent-safe projection.

New worksheet records include:

```text
lessonId
lessonTitle
lessonFolderId
lessonFolderTitle
courseId
courseTitle
targetLessonIds[]
targetCourseIds[]
targetKidIds[]          optional narrowing
targetEnrollmentIds[]   optional narrowing
resourceType
sortOrder
isActive / isArchived
```

The normal workflow requires a course. Child and enrolment targeting are advanced overrides only.

### 3. Teacher resources are projected onto lessonCatalog

Teachers already have read access to `lessonCatalog`, while parents do not. The admin worksheet transaction therefore mirrors a small teacher-facing worksheet projection into:

```text
lessonCatalog/{lessonId}.worksheetResources[]
```

Each projected resource contains only the information teachers need:

```text
id
title
url
description
resourceType
sortOrder
active
archived
targetCourseIds
```

The projection is updated transactionally when a worksheet is created, edited, moved to another lesson, hidden, archived, or restored. Worksheet saves never write `teacherScript`; only the explicit class-script action can change or clear it.

This avoids broadening teacher access to the parent distribution collection.

### 4. Teacher scripts remain private

The class script is stored on:

```text
lessonCatalog/{lessonId}.teacherScript
```

It is never copied into `parentWorksheetLibrary`.

`lessonCatalog` is readable by teachers/admins and not parents under the current Firestore rules, so no security-rule expansion is required.

Audit metadata is retained using `teacherScriptUpdatedAt`, `teacherScriptUpdatedBy`, and `teacherScriptUpdatedByEmail`.

### 5. Parent UI remains backward compatible

Existing legacy worksheet records still normalize and display.

New lesson-linked records group by immutable `courseId + lessonId`; titles are display labels only. A focused responsive component renders course → lesson → resource. Legacy records without `lessonId` are isolated under **Legacy / General Resources**.

Recognized Google Drive file URLs receive a safe download action; other HTTPS links receive Open only.

## Admin experience

The primary form is intentionally ordered by instructional context:

1. Lesson / Class
2. Course visibility
3. Worksheet title
4. Google Drive / HTTPS URL
5. Activity type
6. Sort order
7. Parent guidance
8. Teacher class script (saved independently)
9. Optional child/enrolment/stage overrides

Admin can also:

- edit a worksheet,
- open the source link,
- hide/activate it,
- archive/restore it,
- identify records that still need migration from the legacy model.

## Teacher experience

The Lesson Library continues to use the secure existing lesson-slide access mechanism.

Each lesson tile now has three actions:

- **Open lesson** — existing protected Canva lesson access.
- **Worksheet(s)** — opens the resources attached to that lesson.
- **Class script** — opens the private teacher-facing script.

Search includes lesson title/tags and worksheet title/type.

Today’s Sessions also has a Resources action. It uses `lessonId`/`plannedLessonId` when a canonical association exists. Legacy sessions are never matched by title or lesson-number parsing; instead, the dialog offers a course-scoped lesson chooser based on explicit projected course IDs.

The worksheet and script controls are preparation resources; they do not weaken the existing 50-minute lesson-slide access restriction.

## Parent experience

Parents continue to access resources under:

```text
Parent Dashboard → Classes → Worksheets
```

Visibility is determined entirely by the callable's server-resolved selected child and active enrolment context. New resources are grouped by immutable course and lesson IDs, with display titles, worksheet type, and guidance beneath them. Only validated HTTPS URLs are returned and opened.

Google Drive permissions still determine whether the parent can view/download the underlying file. Admin should therefore use an appropriate view-only share permission for parent worksheets.

## Security model

- `parentWorksheetLibrary`: admin reads/writes only; parents and teachers cannot read documents or dump the collection.
- `getParentWorksheetResources`: parent-only callable; verifies canonical/legacy child ownership, resolves active course/enrolment IDs, applies all targeting, sanitizes URLs, and returns no script/audit metadata.
- `lessonCatalog`: teacher/admin-facing lesson metadata, resource projection, and class script.
- Parent never has permission to read `lessonCatalog`.
- Teacher never needs permission to read `parentWorksheetLibrary`.

This keeps role boundaries explicit.

## Legacy migration

This release is backward compatible and does not require a destructive migration.

Recommended migration procedure:

1. Open each legacy worksheet in Admin → Parent Worksheets.
2. Select its correct Lesson / Class.
3. Select its course visibility.
4. Confirm title/activity type/order.
5. Save.

Saving converts the record into the lesson-linked schema and creates its teacher projection.

Until migrated, intentionally parent-targeted legacy items remain visible under Legacy / General Resources, but do not appear as a worksheet button on a lesson tile.

Re-save worksheet records created by an earlier PR build so their teacher projection gains `targetCourseIds`; this enables the safe course-scoped chooser for legacy sessions without a canonical lesson field.

## Storage decision

The current catalogue is small enough that keeping one script and a compact worksheet projection array on each `lessonCatalog` document remains comfortably below Firestore's document limit. This avoids an unnecessary migration and keeps teacher reads straightforward. The parent callable never returns catalogue data. If projected resource counts or scripts grow materially, the documented next step is a teacher-only subcollection with `worksheetCount`/`hasTeacherScript` summary fields and lazy loading.

## Acceptance criteria

### Admin

- Cannot create a new worksheet without a lesson, course, title, and valid HTTPS URL.
- Can save class script independently of a worksheet.
- Editing a worksheet can move it from one lesson to another without leaving a stale teacher resource behind.
- Hide/archive/restore states propagate to the teacher resource projection.

### Teacher

- Existing secure lesson slide opening still works.
- Lesson tiles show worksheet count and class-script availability.
- Worksheet dialog only shows active, non-archived resources.
- Class-script dialog preserves multiline text and offers copy-to-clipboard.

### Parent

- Only resources matching the selected child's active course/enrolment context are displayed.
- New resources group by immutable course + lesson identity.
- Legacy resources remain readable.
- Invalid/non-HTTPS links cannot be returned or opened from the UI.

### Quality

- TypeScript typecheck passes.
- ESLint passes.
- Unit tests cover lesson metadata, legacy compatibility, URL validation, and visibility matching.
- Production build and existing CI remain green.
