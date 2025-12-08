# 🎯 How to Add Your Canva Lesson Plan - Step by Step

## Your Canva Link
```
https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed
```

---

## Method 1: Using Firebase Console (Easiest) ✅

### Step 1: Get Your Session ID
First, you need to find the session ID from Firestore. Go to:
- Firebase Console → Firestore Database → `sessions` collection
- Find the session for "Trial class Foundation course"
- Copy the **Document ID** (e.g., `session_phonics_trial_001`)

### Step 2: Add the Lesson Plan URL
1. Click on that session document
2. Click **"Add field"** button
3. Fill in:
   - **Field**: `lessonPlanUrl`
   - **Type**: `string`
   - **Value**: `https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed`
4. Click **Update** or **Save**

**Done!** ✨ The teacher will now see a "View Lesson Plan" button for this session.

---

## Method 2: Using the Script 🖥️

If you have the session ID, run this command:

```bash
cd /Users/tinysteps/Documents/Tinysteps-react-v1

node scripts/add-lesson-plan-to-session.js YOUR_SESSION_ID "https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed"
```

**Example:**
```bash
node scripts/add-lesson-plan-to-session.js session_phonics_trial_001 "https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed"
```

**Output you should see:**
```
Adding lesson plan to session: session_phonics_trial_001
✅ Success! Lesson plan URL added to session.
   Session ID: session_phonics_trial_001
   Lesson Plan URL: https://www.canva.com/design/DAGmsjeOkQU/...

📄 Updated session data:
{
  "id": "session_phonics_trial_001",
  "courseName": "Phonics Foundation Course",
  "lessonPlanUrl": "https://www.canva.com/design/DAGmsjeOkQU/ncrV_WOrvltcm8TR0-75Zg/view?embed",
  ...
}

✨ Script completed successfully!
```

---

## What the Teacher Will See 👩‍🏫

### Before (No Lesson Plan):
```
┌────────────────────────────────────┐
│ 10:00 AM              [Scheduled]  │
│ Phonics Foundation Course          │
│ 3 students                         │
│                                    │
│ [Set Reminder] [View Details]      │
└────────────────────────────────────┘
```

### After (With Lesson Plan):
```
┌────────────────────────────────────┐
│ 10:00 AM              [Scheduled]  │
│ Phonics Foundation Course          │
│ 3 students                         │
│                                    │
│ [📄 View Lesson Plan] ⭐          │
│ [Set Reminder] [View Details]      │
└────────────────────────────────────┘
```

When the teacher clicks **"View Lesson Plan"**, they see:

```
┌─────────────────────────────────────────────────────┐
│ Phonics Foundation Course - 10:00 AM            [X] │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ │
│                                                     │
│ [ Your Canva Presentation Embedded Here ]          │
│                                                     │
│ • Can view all slides                              │
│ • Can navigate through presentation                │
│ • Can use fullscreen                               │
│ • CANNOT download or save                          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 How to Test

1. **Add the lesson plan** (using Method 1 or 2 above)
2. **Login as a teacher** who is assigned to that session
3. **Go to:** Teacher Dashboard → Upcoming Sessions
4. **Look for:** The session with the 📄 "View Lesson Plan" button
5. **Click it** → Modal should open with your Canva presentation
6. **Verify:**
   - ✅ Can see all slides
   - ✅ Can navigate through presentation
   - ✅ Right-click is disabled
   - ✅ No download buttons visible

---

## 🔍 Finding Your Session IDs

If you don't know the session ID, here are ways to find it:

### Option 1: Firebase Console
1. Go to Firebase Console → Firestore
2. Open `sessions` collection
3. Look for sessions where:
   - `courseName` = "Phonics Foundation Course" (or your course)
   - `teacherId` = (your teacher's ID)
   - `date` = upcoming date

### Option 2: Query Firestore
You can also create a simple query to list all sessions:
```javascript
const sessions = await db.collection('sessions')
  .where('courseName', '==', 'Phonics Foundation Course')
  .where('status', '==', 'scheduled')
  .get();

sessions.forEach(doc => {
  console.log('Session ID:', doc.id);
  console.log('Date:', doc.data().date);
  console.log('Time:', doc.data().startTime);
});
```

---

## 📋 Quick Checklist

- [ ] Get Canva embed URL from your design
- [ ] Find the session ID in Firestore
- [ ] Add `lessonPlanUrl` field to the session document
- [ ] Login as the teacher to verify
- [ ] Check that "View Lesson Plan" button appears
- [ ] Click button to open modal
- [ ] Verify Canva presentation loads correctly

---

## ❓ Common Issues

### Issue: Script says "Session not found"
**Solution:** Double-check the session ID. Make sure it exists in Firestore `sessions` collection.

### Issue: Button doesn't appear
**Solution:** Make sure:
1. The `lessonPlanUrl` field exists in the session document
2. The teacher is logged in
3. The session is in the teacher's upcoming sessions (next 7 days)

### Issue: Modal opens but Canva doesn't load
**Solution:** Verify the URL:
1. Must be HTTPS
2. Must end with `/view?embed`
3. Make sure the Canva design is set to "Anyone with link can view"

---

## 🎉 You're All Set!

Your Canva lesson plan link is now ready to be used. Teachers will be able to view it directly from their dashboard without needing to leave the Tiny Steps platform.

**Need help?** Check the full documentation:
- `docs/canva-lesson-plan-quickstart.md`
- `docs/canva-lesson-plan-integration.md`
