# 🎨 Canva Lesson Plan Integration - Quick Start

## ✅ What's Been Implemented

Teachers can now **view Canva lesson plans** directly from their upcoming sessions page. The lesson plans open in a modal that **prevents downloading** while allowing full viewing and presentation capabilities.

---

## 🚀 Quick Setup for Admins

### Option 1: Firebase Console (Easiest)

1. Open [Firebase Console](https://console.firebase.google.com/)
2. Go to: **Firestore Database** → `sessions` → `{your-session-id}`
3. Click **Add field**
4. Set:
   - Field: `lessonPlanUrl`
   - Type: `string`
   - Value: `https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed`
5. Save ✅

### Option 2: Admin Script

```bash
cd /Users/tinysteps/Documents/Tinysteps-react-v1
node scripts/add-lesson-plan-to-session.js <SESSION_ID> "<CANVA_EMBED_URL>"
```

**Example:**
```bash
node scripts/add-lesson-plan-to-session.js abc123 "https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed"
```

**Note:** The script uses ES modules. Make sure you have the Firebase Admin SDK service account key file in the project root.

---

## 📋 How to Get Canva Embed URL

1. Open your Canva design
2. Click **Share** → **More** → **Embed**
3. Copy the `src` URL from the iframe code:

```html
<iframe src="https://www.canva.com/design/DAGmsjeOkQU/.../view?embed" ...>
```

4. Use only: `https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed`

---

## 👩‍🏫 How Teachers Use It

1. Go to: **Teacher Dashboard** → **Upcoming Sessions**
2. Find a session with a lesson plan
3. Click: **"View Lesson Plan"** button (has 📄 icon)
4. Modal opens with full Canva presentation
5. Can view, navigate, and present (but **cannot download**)

---

## 🔒 Security Features

✅ View-only access (no editing)  
✅ Right-click disabled  
✅ Download prevented  
✅ Content protection enabled  
✅ HTTPS URLs only  

❌ Cannot save locally  
❌ Cannot print directly  
❌ Cannot access Canva edit mode  

---

## 📁 Files Created/Modified

### New Files
- `src/pages/teacher/components/lesson-plan/CanvaLessonPlanModal.tsx`
- `scripts/add-lesson-plan-to-session.js`
- `docs/canva-lesson-plan-integration.md`
- `docs/testing/canva-lesson-plan-test-guide.md`

### Modified Files
- `src/types/Teacher.ts` (added `lessonPlanUrl` field)
- `src/pages/teacher/components/upcoming-sessions/UpcomingSessionsView.tsx`
- `firestore-schemas/sessions-collection-schema.json`

---

## 🧪 Testing

### Quick Test
1. Add lesson plan URL to any session (see "Quick Setup" above)
2. Login as the teacher assigned to that session
3. Go to Upcoming Sessions tab
4. Click "View Lesson Plan" button
5. Verify modal opens with Canva embed

### Full Test Checklist
See: `docs/testing/canva-lesson-plan-test-guide.md`

---

## 📚 Full Documentation

- **Admin Guide**: `docs/canva-lesson-plan-integration.md`
- **Test Guide**: `docs/testing/canva-lesson-plan-test-guide.md`
- **Script Reference**: `scripts/add-lesson-plan-to-session.js`

---

## 🔮 Future Enhancements

- Admin UI for bulk lesson plan upload
- Support for Google Slides, PowerPoint Online
- Teacher notes alongside lesson plans
- Version history for lesson plan updates
- Course-level template assignment

---

## 💡 Example Use Case

**Scenario:** Trial class for Phonics Foundation Course

```javascript
// Session data in Firestore
{
  "id": "trial_phonics_dec10",
  "courseName": "Phonics Foundation Course",
  "date": "2025-12-10",
  "startTime": "10:00",
  "lessonPlanUrl": "https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed"
}
```

**Teacher Experience:**
1. Opens upcoming sessions
2. Sees "Trial class Foundation course" session
3. Clicks "View Lesson Plan"
4. Reviews the Canva presentation
5. Presents during the live class by sharing screen

---

## ❓ Troubleshooting

| Issue | Solution |
|-------|----------|
| Button not showing | Verify `lessonPlanUrl` exists in Firestore |
| Modal not opening | Check browser console for errors |
| Iframe not loading | Ensure Canva URL is publicly accessible |
| Wrong session shown | Check `selectedSession` state handling |

---

## 📞 Support

For questions or issues:
- Check: `docs/canva-lesson-plan-integration.md`
- Review: `docs/testing/canva-lesson-plan-test-guide.md`
- Contact: Tiny Steps Tech Team

---

**Ready to use! 🎉**
