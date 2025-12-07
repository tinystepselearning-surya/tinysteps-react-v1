# Canva Lesson Plan Integration for Teachers

## Overview

Teachers can now view embedded Canva lesson plans directly from their upcoming sessions page. The lesson plans are displayed in a modal that prevents downloading, ensuring content remains view-only.

---

## For Admins: How to Add Canva Lesson Plans to Sessions

### Step 1: Get the Canva Embed URL

1. Open your Canva design
2. Click **Share** → **More** → **Embed**
3. Copy the embed code or extract the `src` URL from the iframe
4. The URL should look like: `https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed`

### Step 2: Add to Firestore Session Document

Add the `lessonPlanUrl` field to the session document in Firestore:

**Collection:** `sessions`  
**Document ID:** `{sessionId}`

**Field to add:**
```json
{
  "lessonPlanUrl": "https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed"
}
```

### Step 3: Via Firebase Console

1. Go to Firebase Console → Firestore Database
2. Navigate to `sessions` collection
3. Find the session document you want to update
4. Click "Add field"
5. Field name: `lessonPlanUrl`
6. Field type: `string`
7. Field value: Paste the Canva embed URL
8. Click "Update"

### Step 4: Via Admin UI (Future Enhancement)

In the future, admins will be able to add lesson plan URLs directly through the Tiny Steps admin dashboard when creating or editing sessions.

---

## For Teachers: How to View Lesson Plans

### From Upcoming Sessions Page

1. Navigate to **Teacher Dashboard** → **Upcoming Sessions**
2. Find a session that has a lesson plan (indicated by the "View Lesson Plan" button)
3. Click **View Lesson Plan**
4. The lesson plan opens in a modal window
5. You can:
   - View all slides/pages
   - Zoom in/out
   - Navigate through the presentation
   - Use fullscreen mode
6. You **cannot**:
   - Download the presentation
   - Right-click to save
   - Print directly (disabled in embed mode)

### During Live Sessions

- Teachers can share their screen with the lesson plan modal open
- The modal can be resized to fit alongside other teaching tools
- Use the lesson plan as a reference during instruction

---

## Example Canva Embed Code

Here's an example of the full Canva embed HTML (you only need the `src` URL):

```html
<div style="position: relative; width: 100%; height: 0; padding-top: 56.2500%;
 padding-bottom: 0; box-shadow: 0 2px 8px 0 rgba(63,69,81,0.16); margin-top: 1.6em; margin-bottom: 0.9em; overflow: hidden;
 border-radius: 8px; will-change: transform;">
  <iframe loading="lazy" style="position: absolute; width: 100%; height: 100%; top: 0; left: 0; border: none; padding: 0;margin: 0;"
    src="https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed" allowfullscreen="allowfullscreen" allow="fullscreen">
  </iframe>
</div>
```

**Extract only:** `https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed`

---

## Firestore Schema Update

The `sessions` collection now supports the optional `lessonPlanUrl` field:

```typescript
interface TeacherSession {
  id: string;
  teacherId: string;
  courseId: string;
  courseName?: string;
  date: string;
  startTime: string;
  endTime: string;
  kidIds: string[];
  status: 'scheduled' | 'in_progress' | 'completed';
  joinUrl?: string;
  lessonPlanUrl?: string; // NEW: Canva embed URL
  notes?: string;
  attendance?: Record<string, AttendanceStatus>;
  updatedAt?: Timestamp;
  updatedBy?: string;
}
```

---

## Security & Content Protection

### How Download Prevention Works

1. **Iframe Embedding**: Canva's embed mode already restricts downloads
2. **Context Menu Disabled**: Right-click is prevented on the iframe
3. **View-Only Mode**: Teachers can only view and present, not save locally

### What Teachers Can Do

✅ View all slides and pages  
✅ Navigate through the presentation  
✅ Use fullscreen mode for presenting  
✅ Share screen during live sessions

### What Teachers Cannot Do

❌ Download the presentation  
❌ Save images or content locally  
❌ Print directly from the embed  
❌ Access edit mode

---

## Future Enhancements

1. **Bulk Upload**: Admin interface to add lesson plans to multiple sessions
2. **Course Templates**: Pre-assign lesson plans when creating course schedules
3. **Version History**: Track updates to lesson plan URLs
4. **Teacher Notes**: Allow teachers to add private notes alongside lesson plans
5. **Other Platforms**: Support for Google Slides, PowerPoint Online, etc.

---

## Troubleshooting

### Lesson Plan Not Showing

- Ensure `lessonPlanUrl` field exists in the session document
- Verify the URL is a valid Canva embed link (ends with `/view?embed`)
- Check that the Canva design is set to "Anyone with the link can view"

### Modal Not Opening

- Check browser console for errors
- Ensure JavaScript is enabled
- Try refreshing the page
- Clear browser cache

### Iframe Not Loading

- Verify the Canva URL is publicly accessible
- Check if browser extensions are blocking iframes
- Ensure network connection is stable

---

## Support

For technical issues or questions:
- Contact: Tiny Steps Tech Support
- Email: [tech-support-email]
- Admin Dashboard → Help & Support

