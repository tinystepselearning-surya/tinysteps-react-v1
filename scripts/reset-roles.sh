#!/usr/bin/env bash
set -euo pipefail
echo "Purging Admin/Parent/Teacher/LP UI…"

# Static legacy pages
rm -rf public/roles/parent public/roles/teacher public/roles/rm
rm -f  public/roles/login.{html,css,js}

# React pages
rm -rf src/pages/admin src/pages/parent src/pages/teacher src/pages/rm src/pages/roles
rm -f  src/pages/ParentLogin*.tsx src/pages/LearningPartnerLogin.tsx

# Layouts
rm -f src/layouts/{AdminLayout,ParentLayout,RMLayout,TeacherLayout}.tsx

# Components used by those areas
rm -rf src/components/{admin,parent,dashboard}

# Features & role hooks
rm -rf src/features
rm -f  src/hooks/useParent*.ts src/hooks/useTeacher*.ts src/hooks/useRM*.ts \
       src/hooks/useChildren.ts src/hooks/useParent{Payments,Sessions,Tickets}.ts \
       src/hooks/{useStudent,useStudentSummary,useAllUsers,useSystemStats}.ts

# Services & types for those roles
rm -f  src/services/{adminService,parentService,teacherService,rmService,sessionService,studentService,firestoreAdmin}.ts
rm -f  src/types/{admin,parent,rm,student,teacher}.ts

# Routes other than kids (keep kids)
find src/routes -maxdepth 1 -mindepth 1 ! -name kids -exec rm -rf {} +

# Optional: remove route guards only used by dashboards
rm -f src/components/ProtectedRoute.tsx src/components/admin/AdminRoute.tsx

# Build check
npm ci
npm run typecheck || true
npm run build
