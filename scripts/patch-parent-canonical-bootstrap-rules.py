from pathlib import Path

path = Path('firestore.rules')
text = path.read_text()
marker = """    // ----------------------------
    // PARENT MONTHLY READ MODELS (projection docs)
    // ----------------------------
"""
if marker not in text:
    raise SystemExit('parent monthly read model marker not found')

block = """    // ----------------------------
    // PARENT CANONICAL PROJECTION BOOTSTRAP REQUESTS
    // ----------------------------
    // Existing students may predate P3/P4 projection writers. Parents can create one
    // deterministic request per child/course or child/current-month; backend only can update.
    match /parentProjectionBootstrapRequests/{parentId}/kids/{kidId}/requests/{requestId} {
      allow read: if isAdmin()
        || (isParent() && request.auth.uid == parentId && isParentOfKid(kidId));

      allow create: if isParent()
        && request.auth.uid == parentId
        && isParentOfKid(kidId)
        && request.resource.data.keys().hasOnly([
          'schemaVersion',
          'parentId',
          'kidId',
          'kind',
          'courseId',
          'monthKey',
          'createdAt'
        ])
        && request.resource.data.keys().hasAll([
          'schemaVersion',
          'parentId',
          'kidId',
          'kind',
          'createdAt'
        ])
        && request.resource.data.schemaVersion == 1
        && request.resource.data.parentId == parentId
        && request.resource.data.kidId == kidId
        && request.resource.data.createdAt == request.time
        && (
          (
            request.resource.data.kind == 'course_progress'
            && ('courseId' in request.resource.data)
            && request.resource.data.courseId is string
            && request.resource.data.courseId.matches('^[A-Za-z0-9_-]{1,100}$')
            && !('monthKey' in request.resource.data)
            && requestId == 'v1-course-' + request.resource.data.courseId
          )
          ||
          (
            request.resource.data.kind == 'class_attendance'
            && ('monthKey' in request.resource.data)
            && request.resource.data.monthKey is string
            && request.resource.data.monthKey.matches('^[0-9]{4}-[0-9]{2}$')
            && !('courseId' in request.resource.data)
            && requestId == 'v1-attendance-' + request.resource.data.monthKey
          )
        );

      allow update, delete: if false;
    }

"""

if 'match /parentProjectionBootstrapRequests/' not in text:
    path.write_text(text.replace(marker, block + marker, 1))
