# Admin Portal - Quick Start Guide

## 🚀 Getting Started

### Access the Admin Portal

**Development:**
```
http://localhost:5173/surya
```

**Production:**
```
https://tinystepslearning.com/surya
```

---

## 👤 Login

Use your admin credentials:
- Email: `suryaz@tinysteps.com`
- Password: Your admin password

After login, you'll see the admin dashboard with the sidebar menu.

---

## 📚 Common Tasks

### 1. Create a Parent

1. Click **User Management** in sidebar
2. Click **+ Create User**
3. Select Role: **Parent**
4. Fill in details:
   - Full Name: `John Doe`
   - Email: `john@example.com`
   - Username: `johndoe`
   - Password: `SecurePass123`
   - Phone: `+1234567890` (optional)
5. Click **Create Parent**

✅ Parent account created!

---

### 2. Create a Student (Under Parent)

1. Click **User Management** in sidebar
2. Click **+ Create User**
3. Select Role: **Student**
4. Fill in details:
   - Full Name: `Jane Doe`
   - Email: `jane@example.com`
   - Username: `janedoe`
   - Password: `StudentPass123`
5. **Select Parent:** Choose from dropdown (e.g., `John Doe`)
6. Click **Create Student**

✅ Student created and linked to parent!

**What happens:**
- Student document created in Firestore
- Parent's `children` array updated with student UID
- Bi-directional relationship established

---

### 3. Create a Teacher

**Option A: From User Management**
1. Click **User Management** → **+ Create User**
2. Select Role: **Teacher**
3. Fill in details → **Create Teacher**

**Option B: From Teacher Management**
1. Click **Teachers** in sidebar
2. Click **+ Create Teacher**
3. Fill in details
4. Optionally assign a Learning Partner
5. Click **Create Teacher**

---

### 4. Create a Learning Partner

1. Click **Learning Partners** in sidebar
2. Click **+ Create Learning Partner**
3. Fill in details:
   - Full Name: `Sarah Smith`
   - Email: `sarah@tinysteps.com`
   - Username: `sarahsmith`
   - Password: `LPPass123`
4. Click **Create Learning Partner**

---

### 5. Assign Learning Partner to Teacher

1. Click **Learning Partners** in sidebar
2. Find the Learning Partner
3. Click **Manage Assignments**
4. In the **Assign New Teacher** section, click on a teacher
5. Teacher is now assigned!

**Alternative Method:**
1. Click **Teachers** in sidebar
2. Find a teacher without LP assigned
3. Use the dropdown in the **Learning Partner** column
4. Select LP from dropdown

---

### 6. Assign Learning Partner to Parent

1. Click **Learning Partners** in sidebar
2. Find the Learning Partner
3. Click **Manage Assignments**
4. In the **Assign New Parent** section, click on a parent
5. Parent is now assigned!

---

### 7. View All Users by Role

1. Click **User Management** in sidebar
2. Use filter buttons at the top:
   - **All** - Shows all users
   - **Parent** - Shows only parents
   - **Student** - Shows only students
   - **Teacher** - Shows only teachers
   - **Learning Partner** - Shows only LPs
   - **Admin** - Shows only admins

---

### 8. Update User Role

1. Go to **User Management**
2. Find the user in the table
3. Click the **Role** dropdown in their row
4. Select new role
5. Role updated automatically!

---

### 9. Suspend/Activate User

1. Go to **User Management** (or role-specific page)
2. Find the user
3. Click their **Status** badge
4. Status toggles between `active` ↔ `suspended`

---

### 10. Delete a User

1. Go to **User Management** (or role-specific page)
2. Find the user
3. Click **Delete** button
4. Confirm deletion
5. User removed from Firebase Auth and Firestore

**⚠️ Warning:** Deletion is permanent!

---

## 🔐 View Roles & Permissions

1. Click **Roles & Permissions** in sidebar
2. View:
   - Permission cards for each role
   - Complete permission matrix table
   - Role descriptions

---

## 📊 Dashboard Overview

1. Click **Overview** in sidebar
2. View statistics:
   - Total users by role
   - Recent activity
   - System health

---

## 👨‍👩‍👧‍👦 Manage Parents

1. Click **Parents** in sidebar
2. Features:
   - Create new parents
   - Add children to parents
   - View parent-child relationships
   - Manage parent profiles

---

## 🎓 Manage Students

1. Click **Students** in sidebar
2. Features:
   - View all students
   - Filter by phase (0-10)
   - See enrolled courses
   - Manage student profiles

---

## 💳 Manage Memberships

1. Click **Memberships** in sidebar
2. Features:
   - View subscriptions
   - Manage payment plans
   - Handle renewals
   - Track membership status

---

## 🎯 Best Practices

### Creating Students
- ✅ Always select a parent
- ✅ Use clear, identifiable usernames
- ✅ Set secure passwords (min 6 chars)
- ✅ Add phone numbers for contact

### Managing Learning Partners
- ✅ Assign LPs to teachers for oversight
- ✅ Assign LPs to parents for support
- ✅ Use LP dashboard for analytics

### User Management
- ✅ Review users regularly
- ✅ Suspend inactive accounts
- ✅ Keep contact info updated
- ✅ Document role changes

---

## ⚙️ Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Create Modal | `Alt + N` |
| Close Modal | `Esc` |
| Navigate Sidebar | `Arrow Keys` |
| Logout | `Ctrl/Cmd + L` |

---

## 🐛 Troubleshooting

### "Students must have a parent ID"
**Solution:** Make sure you select a parent from the dropdown when creating a student.

### "Username is already taken"
**Solution:** Choose a different username. Usernames must be unique across all users.

### "Permission denied" errors
**Solution:** Ensure you're logged in as admin and your session hasn't expired.

### Can't see new users in list
**Solution:** Refresh the page or navigate away and back to reload data.

---

## 📞 Support

For issues or questions:
1. Check console for error messages (F12)
2. Review Firestore data in Firebase Console
3. Check Firebase Auth user list
4. Verify admin role in custom claims

---

## 🔄 Data Flow Summary

```
Admin Portal
    ↓
Create User
    ↓
Firebase Auth (email/password)
    ↓
Firestore /users/{uid}
    ↓
Username mapping /usernames/{username}
    ↓
Relationships updated (if applicable)
    ↓
Success!
```

---

**Version:** 2.0  
**Last Updated:** November 6, 2025  
**Access:** `/surya`
