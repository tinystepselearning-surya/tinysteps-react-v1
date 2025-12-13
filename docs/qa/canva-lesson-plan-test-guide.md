# Testing Canva Lesson Plan Integration

## Quick Test Guide

### 1. Add a Lesson Plan to a Test Session

Using Firebase Console:
```
1. Go to Firebase Console → Firestore
2. Navigate to: sessions/{sessionId}
3. Add field:
   - Name: lessonPlanUrl
   - Type: string
   - Value: https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed
```

Using the Admin Script:
```bash
cd /Users/tinysteps/Documents/Tinysteps-react-v1
node scripts/add-lesson-plan-to-session.js <sessionId> "https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed"
```

### 2. Verify as a Teacher

1. Login as a teacher
2. Navigate to: Teacher Dashboard → Upcoming Sessions
3. Find the session you updated
4. You should see a "View Lesson Plan" button
5. Click it to open the modal with the embedded Canva

### 3. Test the Modal Features

**Expected Behavior:**
- ✅ Modal opens with Canva embed
- ✅ Full presentation is visible
- ✅ Can navigate through slides
- ✅ Can use fullscreen mode
- ✅ Right-click is disabled on iframe
- ✅ Close button works
- ✅ Click outside modal closes it

**Should NOT be able to:**
- ❌ Download the presentation
- ❌ See download buttons
- ❌ Right-click to save
- ❌ Access edit mode

---

## Example Session Data Structure

```json
{
  "id": "session_abc123",
  "teacherId": "teacher_xyz789",
  "courseId": "phonics_foundation",
  "courseName": "Phonics Foundation Course",
  "date": "2025-12-10",
  "startTime": "10:00",
  "endTime": "10:45",
  "kidIds": ["kid1", "kid2", "kid3"],
  "status": "scheduled",
  "joinUrl": "https://zoom.us/j/123456789",
  "lessonPlanUrl": "https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed",
  "notes": "Trial class for new students",
  "createdAt": "2025-12-08T10:00:00Z",
  "updatedAt": "2025-12-08T10:30:00Z"
}
```

---

## Testing with Different URL Formats

### Valid Canva Embed URLs

✅ `https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed`
✅ `https://www.canva.com/design/ABC123/view?embed`
✅ `https://www.canva.com/design/XYZ789/ncrV_WOrvltcm8TR0-75Zg/view?embed&ui=eyJBIjp7fQ`

### Invalid URLs (should handle gracefully)

❌ `http://insecure-url.com` (not HTTPS)
❌ `not-a-url` (malformed)
❌ Empty string

---

## Component Tree

```
TeacherDashboard
└── UpcomingSessionsView (src/pages/teacher/components/upcoming-sessions/)
    ├── Session Cards (with "View Lesson Plan" button)
    └── CanvaLessonPlanModal (src/pages/teacher/components/lesson-plan/)
        └── Embedded Canva iframe
```

---

## Files Modified/Created

### New Files
1. `src/pages/teacher/components/lesson-plan/CanvaLessonPlanModal.tsx`
2. `docs/canva-lesson-plan-integration.md`
3. `scripts/add-lesson-plan-to-session.js`
4. `docs/testing/canva-lesson-plan-test-guide.md` (this file)

### Modified Files
1. `src/types/Teacher.ts` - Added `lessonPlanUrl?: string` to TeacherSession
2. `src/pages/teacher/components/upcoming-sessions/UpcomingSessionsView.tsx` - Added button and modal
3. `firestore-schemas/sessions-collection-schema.json` - Added lessonPlanUrl field

---

## Manual Testing Checklist

- [ ] Lesson plan button appears only when lessonPlanUrl exists
- [ ] Button has correct icon (FileText) and label
- [ ] Modal opens on button click
- [ ] Modal displays correct session title and course name
- [ ] Canva embed loads correctly
- [ ] Can navigate through Canva slides
- [ ] Fullscreen mode works
- [ ] Close button (X) works
- [ ] Clicking outside modal closes it
- [ ] Right-click on iframe is disabled
- [ ] No download options visible
- [ ] Modal is responsive on mobile
- [ ] Multiple sessions can have different lesson plans
- [ ] Sessions without lessonPlanUrl don't show the button

---

## Browser Compatibility

Test on:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)
- [ ] Mobile Safari (iOS)
- [ ] Chrome Mobile (Android)

---

## Performance Considerations

- Canva embeds are lazy-loaded
- Modal only renders when opened
- No performance impact when closed
- Iframe loads independently from main app

---

## Security Notes

1. **Iframe Sandboxing**: Canva handles security on their end
2. **HTTPS Only**: Only secure URLs are allowed
3. **View-Only**: Teachers cannot modify the original design
4. **No Local Storage**: Content is not cached locally
5. **Content Protection**: Right-click disabled, download prevented

---

## Future Testing

When adding support for other platforms:
- [ ] Google Slides embeds
- [ ] PowerPoint Online embeds
- [ ] PDF viewer embeds
- [ ] YouTube video embeds

