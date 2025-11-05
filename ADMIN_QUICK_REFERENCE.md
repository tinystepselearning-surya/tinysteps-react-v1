# Admin Portal - Quick Reference

## 🔑 Access URLs

| Environment | URL |
|-------------|-----|
| **Development** | `http://localhost:5173/surya` |
| **Production** | `https://tinystepslearning.com/surya` |

## 📱 Admin Pages

| Page | Path | Purpose |
|------|------|---------|
| **Login** | `/surya` | Admin authentication |
| **Dashboard** | `/surya/dashboard` | Overview & stats |
| **Users** | `/surya/users` | User management |
| **Parents** | `/surya/parents` | Parent & children |
| **Students** | `/surya/students` | Student management |
| **Memberships** | `/surya/memberships` | Subscription management |

## 🎯 Key Features

### User Management (`/surya/users`)
- ✅ Create users with email/password
- ✅ Assign roles: Admin, Teacher, Parent, Kid
- ✅ Update roles inline
- ✅ Toggle Active/Suspended status
- ✅ Delete users

### Parent Management (`/surya/parents`)
- ✅ Create parent profiles
- ✅ Add children to parents
- ✅ Update subscription status
- ✅ Manage parent-child relationships
- ✅ View all children per parent

### Student Management (`/surya/students`)
- ✅ View all students
- ✅ Filter by phase (0-10)
- ✅ Update student phase
- ✅ View parent associations
- ✅ Phase distribution stats

### Membership Management (`/surya/memberships`)
- ✅ Update subscription status
- ✅ Change plans: Monthly ($99), Yearly ($999), Lifetime ($2999)
- ✅ Toggle auto-renewal
- ✅ Track revenue
- ✅ Filter by status

## 🔐 Security

- **Authentication**: Firebase Auth required
- **Authorization**: Only `role: "admin"` can access
- **Hidden Access**: No visible links from main site
- **Session**: Stored in localStorage
- **Protection**: All routes wrapped with `<AdminRoute>`

## 🚀 First-Time Setup

### 1. Create Admin User in Firebase Console

**Authentication**:
```
Email: admin@tinysteps.com
Password: [strong password]
```

**Firestore** (`/users/{uid}`):
```json
{
  "uid": "[auth UID]",
  "email": "admin@tinysteps.com",
  "displayName": "Super Admin",
  "role": "admin",
  "createdAt": [Timestamp],
  "status": "active"
}
```

### 2. Deploy Security Rules
```bash
firebase deploy --only firestore:rules
```

### 3. Login
Navigate to `/surya` and login with credentials.

## 📊 Database Structure

### Parent Document (`/users/{uid}`)
```typescript
{
  role: "parent",
  childIds: string[],
  subscription: {
    status: "active" | "trial" | "inactive",
    plan: "monthly" | "yearly" | "lifetime",
    startDate: Timestamp,
    endDate: Timestamp,
    autoRenew: boolean
  }
}
```

### Student Document (`/students/{id}`)
```typescript
{
  name: string,
  displayName: string,
  ageYears: number,
  gender: "male" | "female" | "other",
  parentIds: string[],
  currentPhase: 0-10
}
```

## 🎨 UI Components

### Status Badges
- 🟢 **Active** - Green badge
- 🔴 **Suspended** - Red badge
- 🔵 **Trial** - Blue badge
- ⚪ **Inactive** - Gray badge

### Role Badges
- 🔴 **Admin** - Red
- 🟣 **Teacher** - Purple
- 🟢 **Parent** - Green
- 🔵 **Kid** - Blue

### Plan Badges
- **Monthly** - $99/month
- **Yearly** - $999/year
- **Lifetime** - $2999 one-time

## 🛠️ Common Tasks

### Create a New Parent
1. Go to `/surya/parents`
2. Click "Add Parent"
3. Fill: Name, Email, Phone
4. Click "Create Parent"

### Add Child to Parent
1. Go to `/surya/parents`
2. Find parent
3. Click "Add Child"
4. Fill: Name, Display Name, Age, Gender
5. Click "Add Child"

### Update Subscription
1. Go to `/surya/memberships`
2. Find parent
3. Use dropdowns to change:
   - Status (Active/Trial/Inactive/Expired)
   - Plan (Monthly/Yearly/Lifetime)
4. Toggle Auto Renew if needed

### Change User Role
1. Go to `/surya/users`
2. Find user
3. Select new role from dropdown
4. Auto-saves

## 🐛 Troubleshooting

| Error | Solution |
|-------|----------|
| "Access denied" | Verify `role: "admin"` in Firestore |
| "Email already in use" | Delete from Firebase Auth or use different email |
| "Failed to load users" | Deploy Firestore rules, verify admin access |
| Login page loops | Clear localStorage, re-login |

## 📞 Support

- **Guide**: `/ADMIN_PORTAL_GUIDE.md`
- **Implementation**: `/ADMIN_IMPLEMENTATION_SUMMARY.md`
- **Email**: tech@tinystepslearning.com

## ⚠️ Important Notes

1. **Never** add public links to `/surya`
2. **Always** use strong admin passwords
3. **Regularly** export Firestore data
4. **Monitor** admin user list
5. **Logout** when done
6. **Test** in development before production

## 📁 File Locations

```
app/src/
├── pages/admin/
│   ├── AdminLogin.tsx
│   ├── AdminDashboard.tsx
│   ├── AdminOverview.tsx
│   ├── UserManagement.tsx
│   ├── ParentManagement.tsx
│   ├── StudentManagement.tsx
│   └── MembershipManagement.tsx
├── components/admin/
│   └── AdminRoute.tsx
└── utils/
    └── createFirstAdmin.ts
```

## 🎯 Statistics Tracked

- Total users count
- Parents count
- Students count  
- Teachers count
- Active subscriptions
- Monthly revenue
- Students by phase (0-10)
- Average student age

---

**Version**: 1.0.0  
**Last Updated**: November 2025  
**Access**: Hidden (only via `/surya` URL)
