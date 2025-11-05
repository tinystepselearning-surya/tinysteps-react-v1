# Admin Portal Guide

## 🔐 Accessing the Admin Portal

The admin portal is a hidden management interface accessible only through specific URLs:

### Development
```
http://localhost:5173/surya
```

### Production
```
https://tinystepslearning.com/surya
```

**Important**: There are NO visible links to the admin portal from the main website. This is intentional for security.

---

## 📋 Features Overview

The admin portal provides comprehensive user and membership management:

### 1. **Dashboard Overview** (`/surya/dashboard`)
- Total users count
- Parent statistics
- Student statistics
- Teacher statistics
- Active subscriptions count
- Quick action buttons

### 2. **User Management** (`/surya/users`)
- Create new users with email/password
- Assign roles (Admin, Teacher, Parent, Kid)
- Update user roles
- Toggle user status (Active/Suspended)
- Delete users
- View user details (email, role, created date)

### 3. **Parent Management** (`/surya/parents`)
- Create new parent profiles
- Add children to parent accounts
- Manage parent-child relationships
- Update subscription status (Active, Trial, Inactive)
- Remove children from parent accounts
- View all children under each parent

### 4. **Membership Management** (`/surya/memberships`)
- View all parent subscriptions
- Update subscription status
- Change subscription plans (Monthly, Yearly, Lifetime)
- Toggle auto-renewal
- View subscription dates
- Track monthly revenue
- Filter by status (All, Active, Trial, Expired)

### 5. **Roles & Permissions** (Coming Soon)
- Manage role-based access control
- Set custom permissions
- Create new role types

---

## 🚀 First-Time Setup

### Method 1: Using createAdmin Cloud Function (Recommended)

The easiest way to create your first admin user is using the `createAdmin` Cloud Function.

**📖 See detailed guide:** [CREATE_ADMIN_GUIDE.md](./CREATE_ADMIN_GUIDE.md)

**Quick steps:**
1. Create user in Firebase Console → Authentication
2. Set bootstrap token: `firebase functions:config:set bootstrap.token="YOUR_SECRET"`
3. Deploy: `firebase deploy --only functions:createAdmin`
4. Call function with curl (see CREATE_ADMIN_COMMANDS.md for exact command)
5. Verify and clean up

**Benefits:**
- ✅ Automatically sets custom claims
- ✅ Creates Firestore documents
- ✅ Creates username mapping
- ✅ Forces token refresh
- ✅ One command to create admin

### Method 2: Manual Setup (Alternative)

If you prefer manual setup:

### Step 1: Create Admin User

You need to manually create the first admin user in Firebase:

1. **Go to Firebase Console** → Authentication
2. **Add User** with email and password:
   - Email: `admin@tinysteps.com`
   - Password: (choose a strong password)
3. **Copy the UID** of the created user

### Step 2: Create Admin Document

4. **Go to Firebase Console** → Firestore Database
5. **Create a document** in the `users` collection:
   ```
   Collection: users
   Document ID: [paste the UID from step 3]
   Fields:
   {
     "uid": "[same UID]",
     "email": "admin@tinysteps.com",
     "displayName": "Super Admin",
     "role": "admin",
     "createdAt": [Firestore timestamp - now],
     "status": "active"
   }
   ```

### Step 3: Deploy Firestore Rules

Make sure your security rules are deployed:

```bash
firebase deploy --only firestore:rules
```

### Step 4: Login

Navigate to http://localhost:5173/surya or https://tinystepslearning.com/surya and login with your admin credentials.

---

## 📖 Usage Guide

### Creating a New Parent Profile

1. Navigate to `/surya/parents`
2. Click **"+ Add Parent"** button
3. Fill in the form:
   - Display Name
   - Email
   - Phone (optional)
4. Click **"Create Parent"**

### Adding Children to a Parent

1. Navigate to `/surya/parents`
2. Find the parent in the list
3. Click **"+ Add Child"** button
4. Fill in the child's information:
   - Child Name
   - Display Name
   - Age (3-12 years)
   - Gender
5. Click **"Add Child"**

**Note**: The system creates a bi-directional relationship:
- Parent document gets `childIds: [studentId]`
- Student document gets `parentIds: [parentId]`

### Managing Subscriptions

1. Navigate to `/surya/memberships`
2. Find the parent
3. Use the dropdown to change:
   - **Status**: Active, Trial, Inactive, Expired
   - **Plan**: Monthly ($99), Yearly ($999), Lifetime ($2999)
4. Toggle **Auto Renew** on/off
5. Changes are saved automatically

### Creating New Users

1. Navigate to `/surya/users`
2. Click **"+ Create User"** button
3. Fill in the form:
   - Display Name
   - Email
   - Password (min 6 characters)
   - Role (Parent, Teacher, Admin)
4. Click **"Create User"**

**Note**: This creates both:
- Firebase Authentication user
- Firestore `users` document

### Changing User Roles

1. Navigate to `/surya/users`
2. Find the user in the table
3. Use the **Role dropdown** to select new role:
   - Admin
   - Teacher
   - Parent
   - Kid
4. Change is saved immediately

### Suspending Users

1. Navigate to `/surya/users`
2. Find the user
3. Click the **Status button** (Active/Suspended)
4. Status toggles between active and suspended

---

## 🔒 Security Features

### Authentication
- Only users with `role: "admin"` in Firestore can access the portal
- Session is stored in localStorage
- Auto-logout on page refresh if admin role is removed

### Protected Routes
All admin routes are wrapped with `<AdminRoute>` component which:
- Checks Firebase Auth status
- Verifies admin role in Firestore
- Redirects unauthorized users to login page

### Firestore Security Rules
```javascript
// Only admins can read/write users collection
match /users/{userId} {
  allow read, write: if hasRole('admin');
}

// Only admins can read/write all students
match /students/{studentId} {
  allow read, write: if hasRole('admin');
}
```

---

## 📊 Database Structure

### Users Collection (`/users/{uid}`)

**Parent Document**:
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  role: "parent";
  phone?: string;
  childIds: string[];  // Array of student IDs
  subscription: {
    status: "active" | "inactive" | "trial" | "expired";
    plan: "monthly" | "yearly" | "lifetime";
    startDate: Timestamp;
    endDate: Timestamp;
    autoRenew: boolean;
  };
  createdAt: Timestamp;
  status: "active" | "suspended";
}
```

**Teacher Document**:
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  role: "teacher";
  specialization?: string;
  studentIds: string[];  // Array of assigned student IDs
  createdAt: Timestamp;
  status: "active" | "suspended";
}
```

**Admin Document**:
```typescript
{
  uid: string;
  email: string;
  displayName: string;
  role: "admin";
  createdAt: Timestamp;
  status: "active";
}
```

### Students Collection (`/students/{id}`)

```typescript
{
  name: string;
  displayName: string;
  ageYears: number;
  gender: "male" | "female" | "other";
  parentIds: string[];  // Array of parent UIDs
  teacherId?: string;
  currentPhase: number;  // 0-10
  enrolledCourses: string[];
  avatarUrl?: string;
  createdAt: Timestamp;
}
```

---

## 🛠️ Troubleshooting

### "Access denied. Admin privileges required"

**Cause**: Your user doesn't have `role: "admin"` in Firestore

**Solution**:
1. Go to Firebase Console → Firestore
2. Find your user document in `/users/{uid}`
3. Update the `role` field to `"admin"`
4. Logout and login again

### "Cannot create user: auth/email-already-in-use"

**Cause**: The email is already registered in Firebase Authentication

**Solution**:
1. Choose a different email, OR
2. Delete the existing user from Firebase Console → Authentication
3. Try again

### "Failed to load users"

**Cause**: Firestore security rules blocking access

**Solution**:
1. Verify you're logged in as admin
2. Check `firestore.rules` includes admin access
3. Deploy rules: `firebase deploy --only firestore:rules`

### Parent-Child Relationship Not Working

**Cause**: Bi-directional relationship not created properly

**Solution**:
The system automatically creates both sides:
- When you add a child through the UI, both `parent.childIds` and `student.parentIds` are updated
- If manually creating in Firestore, ensure BOTH fields are set

---

## 🎯 Best Practices

### User Creation
- Use company email domain for admins and teachers
- Use parent's real email for parent accounts
- Set strong password requirements (min 8 chars, mixed case, numbers)

### Subscription Management
- Always set Trial status for new parents initially
- Monitor trial expiration dates
- Enable auto-renew only after confirming payment method

### Parent-Child Relationships
- Verify parent identity before adding children
- Keep child ages updated for age-appropriate content
- Don't remove children unless parent requests

### Data Cleanup
- Suspend users instead of deleting (preserves history)
- Delete users only when requested or for compliance
- Backup data before bulk operations

---

## 🔮 Future Enhancements

### Planned Features
- [ ] Bulk user import (CSV)
- [ ] Email notifications for subscription changes
- [ ] Advanced analytics dashboard
- [ ] Student progress reports
- [ ] Teacher assignment management
- [ ] Payment integration (Stripe/PayPal)
- [ ] Automated trial expiration reminders
- [ ] Two-factor authentication for admins
- [ ] Audit log for all admin actions
- [ ] Role permission customization

---

## 📞 Support

For admin portal issues or feature requests, contact:
- **Email**: tech@tinystepslearning.com
- **GitHub**: Create an issue in the repository

---

## ⚠️ Important Notes

1. **No Public Links**: Never add navigation links to `/surya` in the main website
2. **Strong Passwords**: Always use strong admin passwords
3. **Regular Backups**: Export Firestore data regularly
4. **Monitor Access**: Review admin user list periodically
5. **Session Security**: Always logout when done
6. **Role Changes**: Be careful when changing user roles
7. **Production Access**: Use different admin credentials for production vs development

---

## 📝 Admin Portal URLs Reference

| Environment | URL |
|-------------|-----|
| Development | http://localhost:5173/surya |
| Production  | https://tinystepslearning.com/surya |

| Page | Path |
|------|------|
| Login | `/surya` |
| Dashboard | `/surya/dashboard` |
| Users | `/surya/users` |
| Parents | `/surya/parents` |
| Students | `/surya/students` |
| Teachers | `/surya/teachers` |
| Memberships | `/surya/memberships` |
| Roles | `/surya/roles` |

---

**Last Updated**: November 2025
**Version**: 1.0.0
