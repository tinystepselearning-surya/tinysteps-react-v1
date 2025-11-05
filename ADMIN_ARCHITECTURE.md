# Admin Portal - Architecture & Flow

## 🏗️ System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     ADMIN PORTAL SYSTEM                      │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴──────────────┐
                │                            │
        ┌───────▼───────┐           ┌───────▼────────┐
        │  Authentication │           │   Authorization │
        │  (Firebase Auth)│           │  (Firestore)   │
        └───────┬───────┘           └───────┬────────┘
                │                            │
                └─────────────┬──────────────┘
                              │
                    ┌─────────▼──────────┐
                    │   <AdminRoute>      │
                    │   Protection Layer  │
                    └─────────┬──────────┘
                              │
                ┌─────────────┴──────────────┐
                │                            │
        ┌───────▼───────┐           ┌───────▼────────┐
        │  Admin Portal  │           │   Firestore    │
        │   UI Layer     │◄─────────►│   Database     │
        └───────┬───────┘           └────────────────┘
                │
    ┌───────────┼───────────┬───────────┬──────────┐
    │           │           │           │          │
┌───▼───┐  ┌───▼───┐  ┌───▼───┐  ┌───▼───┐  ┌───▼────┐
│ Users │  │Parents│  │Students│ │Teachers│ │Memberships│
└───────┘  └───────┘  └────────┘ └────────┘ └──────────┘
```

## 🔐 Authentication Flow

```
User navigates to /surya
         │
         ▼
┌────────────────────┐
│   AdminLogin.tsx   │ Login page
└────────┬───────────┘
         │ Email + Password
         ▼
┌────────────────────┐
│  Firebase Auth     │ Authenticate
└────────┬───────────┘
         │ User credentials
         ▼
┌────────────────────┐
│  Firestore Query   │ Check role === "admin"
└────────┬───────────┘
         │
    ┌────┴─────┐
    │          │
    ▼          ▼
┌───────┐  ┌──────────┐
│ Deny  │  │  Allow   │
│ ↓     │  │  ↓       │
│/surya │  │localStorage│
└───────┘  │adminAuth  │
           │adminUid   │
           └─────┬─────┘
                 │
                 ▼
         ┌───────────────┐
         │ /surya/dashboard│
         └───────────────┘
```

## 🛣️ Route Structure

```
/surya (AdminLogin)
  │
  ├─ /dashboard (AdminDashboard) ◄── Protected by <AdminRoute>
  │    │
  │    └─ index (AdminOverview)
  │
  ├─ /users (AdminDashboard) ◄── Protected
  │    │
  │    └─ index (UserManagement)
  │
  ├─ /parents (AdminDashboard) ◄── Protected
  │    │
  │    └─ index (ParentManagement)
  │
  ├─ /students (AdminDashboard) ◄── Protected
  │    │
  │    └─ index (StudentManagement)
  │
  ├─ /teachers (AdminDashboard) ◄── Protected
  │    │
  │    └─ index (TeacherManagement) [Planned]
  │
  └─ /memberships (AdminDashboard) ◄── Protected
       │
       └─ index (MembershipManagement)
```

## 📊 Data Relationships

```
┌──────────────────────────────────────────────────────────────┐
│                        FIRESTORE DATABASE                     │
└──────────────────────────────────────────────────────────────┘

Collection: /users
┌─────────────────────────────────────────────────────────┐
│  Document: {uid}                                        │
│  ┌───────────────────────────────────────────────────┐ │
│  │ role: "parent"                                    │ │
│  │ childIds: ["student1", "student2", "student3"]    │ │
│  │ subscription: {                                   │ │
│  │   status: "active",                               │ │
│  │   plan: "yearly"                                  │ │
│  │ }                                                 │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           │ childIds[]
                           ▼
Collection: /students
┌─────────────────────────────────────────────────────────┐
│  Document: {id}                                         │
│  ┌───────────────────────────────────────────────────┐ │
│  │ name: "John Doe"                                  │ │
│  │ parentIds: ["{parent_uid}"]                       │ │
│  │ currentPhase: 3                                   │ │
│  │ ageYears: 6                                       │ │
│  └───────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                           │
                           │ parentIds[]
                           ▼
                    (Bi-directional)
```

## 🔄 Parent-Child Relationship Flow

```
Admin creates parent
         │
         ▼
┌────────────────────┐
│ POST /users/{uid}  │
│ {                  │
│   role: "parent",  │
│   childIds: []     │
│ }                  │
└────────┬───────────┘
         │
         │ Admin clicks "Add Child"
         ▼
┌────────────────────┐
│ POST /students/{id}│
│ {                  │
│   parentIds: [uid] │
│ }                  │
└────────┬───────────┘
         │
         │ Get student ID
         ▼
┌────────────────────────┐
│ UPDATE /users/{uid}    │
│ {                      │
│   childIds: [..., id]  │
│ }                      │
└────────────────────────┘
         │
         ▼
┌────────────────────────┐
│ Bi-directional Link    │
│ Created Successfully   │
└────────────────────────┘
```

## 🎨 Component Hierarchy

```
Routes.tsx
  │
  └─ /surya
       │
       ├─ AdminLogin.tsx (Public)
       │
       └─ <AdminRoute> (Protected)
            │
            └─ AdminDashboard.tsx (Layout)
                 │
                 ├─ Sidebar Navigation
                 │
                 └─ <Outlet> (Content)
                      │
                      ├─ AdminOverview.tsx
                      │    ├─ Stats Cards
                      │    └─ Quick Actions
                      │
                      ├─ UserManagement.tsx
                      │    ├─ User Table
                      │    ├─ Create User Modal
                      │    └─ Role Dropdowns
                      │
                      ├─ ParentManagement.tsx
                      │    ├─ Parent Cards
                      │    ├─ Children Lists
                      │    ├─ Add Parent Modal
                      │    └─ Add Child Modal
                      │
                      ├─ StudentManagement.tsx
                      │    ├─ Phase Stats
                      │    ├─ Student Table
                      │    └─ Phase Filters
                      │
                      └─ MembershipManagement.tsx
                           ├─ Revenue Stats
                           ├─ Subscription Table
                           └─ Status Filters
```

## 💾 CRUD Operations Flow

### Create User
```
UserManagement.tsx
  │ Click "Create User"
  ▼
Modal Opens
  │ Fill form
  ▼
handleCreateUser()
  │
  ├─ createUserWithEmailAndPassword() → Firebase Auth
  │
  └─ addDoc(collection(db, "users")) → Firestore
       │
       ▼
    Success → Reload users → Close modal
```

### Update Parent Subscription
```
MembershipManagement.tsx
  │ Select new status from dropdown
  ▼
handleUpdateStatus()
  │
  └─ updateDoc(doc(db, "users", parentId))
       │
       ├─ subscription.status = newStatus
       ├─ subscription.startDate = now
       └─ subscription.endDate = now + duration
            │
            ▼
         Success → Reload memberships
```

### Add Child to Parent
```
ParentManagement.tsx
  │ Click "Add Child" on parent card
  ▼
Modal Opens
  │ Fill child form
  ▼
handleAddChild()
  │
  ├─ addDoc(collection(db, "students")) → Create student
  │     │
  │     └─ { parentIds: [parentId] }
  │
  └─ updateDoc(doc(db, "users", parentId)) → Update parent
        │
        └─ { childIds: [...existing, newStudentId] }
             │
             ▼
          Success → Reload data → Close modal
```

## 🔒 Security Rules Applied

```
Firestore Security Rules
  │
  ├─ /users/{userId}
  │    └─ allow read, write: if hasRole('admin')
  │
  ├─ /students/{studentId}
  │    └─ allow read, write: if hasRole('admin')
  │
  └─ function hasRole(role)
       └─ request.auth != null && 
          get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == role
```

## 📈 Statistics Calculation

```
AdminOverview.tsx → loadStats()
  │
  ├─ getDocs(collection(db, "users"))
  │    │
  │    ├─ Filter role === "parent" → parents count
  │    ├─ Filter role === "teacher" → teachers count
  │    └─ Filter subscription.status === "active" → active subs
  │
  └─ getDocs(collection(db, "students"))
       │
       └─ size → students count

MembershipManagement.tsx → Calculate Revenue
  │
  └─ memberships
       .filter(m => m.status === "active")
       .reduce((sum, m) => sum + m.amount, 0)
       └─ Total monthly revenue

StudentManagement.tsx → Phase Distribution
  │
  └─ Array.from({ length: 11 }, (_, i) => ({
       phase: i,
       count: students.filter(s => s.currentPhase === i).length
     }))
```

## 🎯 Key Design Patterns

### Protected Routes Pattern
```typescript
<Route path="/surya/dashboard" element={
  <AdminRoute>
    <AdminDashboard />
  </AdminRoute>
}>
```

### Layout Pattern
```typescript
<AdminDashboard>  // Sidebar + Header
  <Outlet />       // Page content
</AdminDashboard>
```

### Modal Pattern
```typescript
{showModal && (
  <div className="fixed inset-0 bg-black/50">
    <div className="bg-gray-800 rounded-2xl p-8">
      <form onSubmit={handleSubmit}>
        {/* Form fields */}
      </form>
    </div>
  </div>
)}
```

### Inline Edit Pattern
```typescript
<select
  value={user.role}
  onChange={(e) => handleUpdateRole(user.id, e.target.value)}
>
  <option value="admin">Admin</option>
  <option value="teacher">Teacher</option>
</select>
```

## 📱 Responsive Design Breakpoints

```
Mobile:    < 768px   → Single column, stacked cards
Tablet:    768-1024px → 2 columns, compressed sidebar
Desktop:   > 1024px   → 3+ columns, full sidebar
```

## 🎨 Color Coding System

```
Roles:
  Admin    → Red    (#EF4444)
  Teacher  → Purple (#A855F7)
  Parent   → Green  (#10B981)
  Kid      → Blue   (#3B82F6)

Status:
  Active     → Green  (#10B981)
  Trial      → Blue   (#3B82F6)
  Inactive   → Gray   (#6B7280)
  Suspended  → Red    (#EF4444)
  Expired    → Red    (#DC2626)

Plans:
  Monthly   → Orange (#F97316)
  Yearly    → Sky    (#0EA5E9)
  Lifetime  → Purple (#8B5CF6)
```

---

**Architecture Version**: 1.0.0  
**Last Updated**: November 2025  
**Maintainer**: Tinysteps eLearning Development Team
