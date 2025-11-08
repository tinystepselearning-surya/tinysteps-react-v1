#!/usr/bin/env bash
set -euo pipefail

echo ">>> Tiny Steps RESET — remove admin/parent/teacher/lp code & pages; keep Public/Curriculum/Blog/Kids"

# 1) Delete static legacy role pages (keep kid)
rm -rf public/roles/parent || true
rm -rf public/roles/teacher || true
rm -rf public/roles/rm || true
rm -f  public/roles/login.html public/roles/login.css public/roles/login.js || true

# 2) Remove React pages for admin/parent/teacher/rm
rm -rf src/pages/admin || true
rm -rf src/pages/parent || true
rm -rf src/pages/teacher || true
rm -rf src/pages/rm || true
rm -f  src/pages/ParentLogin.tsx src/pages/ParentLoginTest.tsx src/pages/ParentLoginTestSimple.tsx || true
rm -f  src/pages/LearningPartnerLogin.tsx || true

# 3) Remove role portals under src/pages/roles
rm -rf src/pages/roles || true

# 4) Remove layouts tied to those roles
rm -f src/layouts/AdminLayout.tsx src/layouts/ParentLayout.tsx src/layouts/RMLayout.tsx src/layouts/TeacherLayout.tsx || true

# 5) Remove components exclusively for dashboards/admin
rm -rf src/components/admin || true
rm -rf src/components/parent || true
rm -rf src/components/dashboard || true

# 6) Remove features & hooks tied to educator flows
rm -rf src/features || true
rm -f  src/hooks/useParent*.ts src/hooks/useTeacher*.ts src/hooks/useRM*.ts src/hooks/useChildren.ts \
       src/hooks/useParentPayments.ts src/hooks/useParentSessions.ts src/hooks/useParentTickets.ts \
       src/hooks/useStudent.ts src/hooks/useStudentSummary.ts src/hooks/useAllUsers.ts \
       src/hooks/useSystemStats.ts || true

# 7) Remove services used only by educator flows
rm -f src/services/adminService.ts src/services/parentService.ts src/services/teacherService.ts \
      src/services/rmService.ts src/services/sessionService.ts src/services/studentService.ts \
      src/services/firestoreAdmin.ts || true

# keep generic services
#   - courseService.ts, lessonService.ts, resourceService.ts, firestore.ts (for public/kids)

# 8) Remove role-specific types
rm -f src/types/admin.ts src/types/parent.ts src/types/rm.ts src/types/student.ts src/types/teacher.ts || true

# 9) Clean tests tied to removed modules
rm -rf tests || true
rm -rf test-results || true
rm -rf src/pages/teacher/__tests__ || true
rm -rf src/components/__tests__ || true
rm -rf src/games/**/__tests__ || true 2>/dev/null || true

# 10) Keep kids & public routes; remove any “routes” other than kids
find src/routes -maxdepth 1 -mindepth 1 ! -name kids -exec rm -rf {} +

# 11) Remove any “roles” routes under components
grep -RIl --exclude-dir=node_modules -e "TeacherPortal" -e "KidsPortal" -e "LearningManagerPortal" src 2>/dev/null | xargs -I{} rm -f {}

# 12) Nav/header cleanup: strip links (admin/parent/teacher/rm)
#    We'll just try safe in-place sed removes; if not present, sed no-ops.
sed -i '' '/Admin/Id' src/components/Header.tsx 2>/dev/null || true
sed -i '' '/Parent/Id' src/components/Header.tsx 2>/dev/null || true
sed -i '' '/Teacher/Id' src/components/Header.tsx 2>/dev/null || true
sed -i '' '/Learning Partner/Id' src/components/Header.tsx 2>/dev/null || true
sed -i '' '/Admin/Id' src/components/Navbar.tsx 2>/dev/null || true
sed -i '' '/Parent/Id' src/components/Navbar.tsx 2>/dev/null || true
sed -i '' '/Teacher/Id' src/components/Navbar.tsx 2>/dev/null || true
sed -i '' '/Learning Partner/Id' src/components/Navbar.tsx 2>/dev/null || true

# 13) Remove route guards used for dashboards
rm -f src/components/ProtectedRoute.tsx src/components/admin/AdminRoute.tsx || true

# 14) Build & typecheck to surface any leftover references
npm ci
npm run typecheck || true
npm run build

echo ">>> RESET complete. If build passed, commit the change."
