# Worksheets Optimization Architecture

## Goal

Make the curriculum lesson the canonical centre of worksheet distribution and teacher preparation resources.

The workflow is:

1. Admin uploads a worksheet/PDF to Google Drive and pastes the share URL into Tiny Steps.
2. Admin selects the canonical Tiny Steps lesson.
3. The lesson determines the course; course visibility is not independently selected on each worksheet.
4. The worksheet is projected onto the lesson for teachers.
5. Parents receive the worksheet only when the selected child has a valid active enrolment in that lesson's course, with optional child/enrolment narrowing.
6. Teacher class scripts are stored independently on the lesson and are never part of the parent worksheet record.

## Design principles

### 1. Lesson is the canonical teaching context

Every new worksheet must have a `lessonId` and `lessonTitle`.

A lesson connects:

- lesson slides,
- teacher class script,
- one or many worksheets/resources,
- parent practice resources,
- canonical course entitlement.

### 2. Course is derived from the lesson

Admins no longer choose a separate **Course visibility** value while creating each worksheet.

Course resolution follows this order:

1. `lessonCatalog/{lessonId}.courseId` when already mapped.
2. A folder-level course mapping when present.
3. A deterministic unique match using the lesson area + curriculum folder and the existing course catalogue.
4. If no safe unique match exists, worksheet creation is blocked and the admin maps the lesson to a course once.

The one-time mapping is saved on the lesson catalog:

```text
courseId
courseTitle
courseMappedAt
courseMappedBy
courseMappedByEmail
```

When an automatically inferred course is used for a worksheet, the worksheet transaction also persists that canonical `courseId` and `courseTitle` onto the lesson catalog. Future worksheets therefore reuse the lesson mapping.

This prevents contradictory data such as an Advanced Phonics lesson being manually published under Early Phonics.

### 3. Parent enrolment controls visibility

`parentWorksheetLibrary` remains the admin-owned distribution collection. Parents do not receive direct Firestore read permission.

New worksheet records contain:

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
targetStageTags[]        optional narrowing
resourceType
sortOrder
isActive / isArchived
```

`targetCourseIds` is written from the resolved lesson course, not from an independent worksheet form field.

### 4. Teacher resources are projected onto `lessonCatalog`

Teachers already have read access to `lessonCatalog`, while parents do not.

The admin worksheet transaction mirrors a compact teacher-facing projection into:

```text
lessonCatalog/{lessonId}.worksheetResources[]
```

Each projected resource contains:

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

The projection is updated transactionally when a worksheet is created, edited, moved, hidden, archived, restored, or activated.

### 5. Teacher scripts are lesson data, not worksheet data

The class script is stored only on:

```text
lessonCatalog/{lessonId}.teacherScript
```

The admin interface presents the script editor in a separate **Lesson teaching script** card so that the data model is explicit: one lesson script can support zero, one, or many worksheets.

Script audit metadata remains:

```text
teacherScriptUpdatedAt
teacherScriptUpdatedBy
teacherScriptUpdatedByEmail
```

The worksheet transaction never writes `teacherScript`.

### 6. Worksheet activity type is controlled vocabulary

New worksheets use a controlled activity-type selector:

- Practice worksheet
- Revision worksheet
- Reading practice
- Writing practice
- Assessment
- Homework
- Activity
- Challenge
- Supplementary resource

Existing non-standard values remain readable/editable without silently rewriting old data, but new selection is controlled so filtering and analytics remain consistent.

## Admin experience

The primary worksheet form is ordered by instructional context:

1. Lesson / Class
2. Derived lesson course (read-only during normal worksheet entry)
3. Worksheet title
4. Google Drive / HTTPS URL
5. Controlled activity type
6. Sort order
7. Parent guidance
8. Optional child/enrolment/stage overrides
9. Active state

If a lesson lacks a safe course mapping, the same page offers a one-time **Map this lesson to a course** control. This updates the lesson, not the worksheet.

The teacher script is managed in a separate lesson-level card.

The worksheet list supports:

- text search,
- course filter,
- lesson filter,
- status filter,
- activity-type filter,
- edit,
- open,
- hide/activate,
- archive/restore.

The admin navigation label is **Worksheets & Resources** because the same system serves both parent worksheets and teacher preparation resources.

## Teacher experience

The Lesson Library remains the main teacher preparation surface.

Each lesson tile provides:

- **Open lesson** — existing protected lesson-slide access.
- **Worksheet / Worksheets** — opens all active, non-archived resources attached to that lesson.
- **Class script** — opens the private lesson-level teaching script.

A lesson can have multiple worksheets. The worksheet dialog lists each resource separately with its type, guidance and open action.

Worksheet and class-script access do not weaken the existing timed lesson-slide access rules.

## Parent experience

Parents access worksheets under:

```text
Parent Dashboard → Classes → Worksheets
```

The UI groups resources by course and lesson and shows:

- lesson/folder context,
- worksheet title,
- activity type,
- parent guidance,
- Open,
- Download for recognized Google Drive file links.

The selected child's worksheet count is surfaced in the Classes resource row.

## Security model

- `parentWorksheetLibrary`: admin read/write only.
- `getParentWorksheetResources`: parent-only callable.
- The callable verifies authenticated parent role.
- The callable verifies ownership of the selected child.
- The callable resolves active enrolment/course IDs server-side.
- The callable applies course, child and enrolment targeting server-side.
- Only sanitized HTTPS worksheet URLs are returned.
- Teacher scripts and admin audit metadata are never included in the parent response.
- `lessonCatalog`: teacher/admin-readable lesson metadata and resource projection; parents cannot read it directly.

Client-side filtering is therefore presentation only; parent authorization is enforced on the server path.

## Existing sample / legacy records

The two temporary unlinked sample worksheet records used during development are not part of the required migration scope. They may be deleted from Firestore or ignored. This optimization does not require investing in migration logic for those sample records.

Existing historical records continue to normalize safely if they remain present.

## Acceptance criteria

### Admin

- Cannot create a new worksheet without a canonical lesson, resolved lesson course, title and valid HTTPS URL.
- Course is not independently selectable per worksheet.
- Can map a lesson to a course once when automatic resolution is unsafe.
- Can save a lesson class script independently of worksheets.
- Can attach multiple worksheets to one lesson.
- Activity type uses controlled options for new worksheet entry.
- Worksheet management has search and course/lesson/status/type filters.
- Edit/move/hide/archive/restore keeps teacher projections consistent.

### Teacher

- Existing secure lesson opening still works.
- Lesson tiles show worksheet count and script availability.
- One lesson can expose multiple worksheet resources in a dialog.
- Class scripts preserve multiline content and remain teacher-only.

### Parent

- Only resources matching the selected child's active course/enrolment context are returned.
- Resources group by course → lesson.
- Invalid/non-HTTPS links cannot be returned or opened from the UI.
- Script fields are never exposed.

### Quality

- TypeScript typecheck passes.
- ESLint passes.
- Unit tests cover lesson-course resolution and existing worksheet projection/security behavior.
- Production build and CI remain green.
