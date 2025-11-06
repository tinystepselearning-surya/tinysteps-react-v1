# Tiny Steps v1.0 - Complete Implementation Plan

## 📋 What's Been Created

### 1. **Firestore Security Rules** (`firestore.rules.v1`)
✅ Production-ready security rules with:
- Role-based access control (parent, student, teacher, RM, admin)
- Audit trail enforcement (updatedBy, updatedAt required)
- Resource ownership validation
- Staff-level permissions for shared data
- Username uniqueness validation
- Notifications, tickets, bookmarks, consent management

**Action Required:** Copy `firestore.rules.v1` to `firestore.rules` and deploy

### 2. **Routes Scaffold** (`ROUTES_SCAFFOLD.md`)
✅ Complete route structure for all portals:
- Public routes (home, blog, courses, FAQ, contact)
- Auth routes (login, onboarding)
- Parent portal (6 routes)
- Kids zone (6 routes)  
- Teacher portal (7 routes)
- RM portal (5 routes)
- Admin portal (8 routes)

**Includes:** Folder structure, protected routes, role guards, priority implementation order

### 3. **Cloud Functions Scaffold** (`CLOUD_FUNCTIONS_SCAFFOLD.md`)
✅ Complete functions architecture:
- **Triggers**: onSessionCompleted, onWorksheetSubmitted, onGameMastered, onPaymentReceived
- **Scheduled**: Class reminders (T-24h, T-2h, T-15m), no-show checks, weekly digests
- **Callable**: Payment processing, reschedule requests, invoice generation, substitute assignment
- **Utils**: Audit logging, notifications, summary updates, mastery calculation

---

## 🎯 Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
**Goal:** Core infrastructure working

#### Week 1: Auth & Admin
- [ ] Deploy new Firestore rules
- [ ] Update AuthContext to use role claims
- [ ] Implement ProtectedRoute component with role guards
- [ ] Create all layout components (ParentLayout, TeacherLayout, etc.)
- [ ] Test admin user management with new rules

#### Week 2: Parent Portal MVP
- [ ] Parent Dashboard with child switcher
- [ ] Student profile summary cards
- [ ] Basic curriculum progress display
- [ ] Attendance calendar (read-only)
- [ ] Messages/notes feed

**Acceptance:**
- Parent can log in and see all their children
- Can view each child's progress summary
- Can see upcoming classes
- Dashboard loads in <2s

---

### Phase 2: Teacher Portal (Weeks 3-4)
**Goal:** Teachers can manage classes and update progress

#### Week 3: Calendar & Sessions
- [ ] Teacher calendar (month/week/day views)
- [ ] Session detail modal with join link
- [ ] Mark session as completed
- [ ] Basic post-class form (outcomes, topics covered)
- [ ] Cloud Function: onSessionCompleted trigger

#### Week 4: Student Management
- [ ] Teacher student list
- [ ] Student profile page (timeline, curriculum, progress charts)
- [ ] Update curriculum topic status
- [ ] Update progress with mastery levels
- [ ] Session summary generator (AI suggestions later)

**Acceptance:**
- Teacher can view schedule and join classes
- After class, can mark completed and fill outcomes
- Completion updates attendance, curriculum, progress atomically
- Parent sees updated data within 30s

---

### Phase 3: Kids Zone & Content (Weeks 5-6)
**Goal:** Students can access games and worksheets

#### Week 5: Kids Home & Games
- [ ] Kids Zone homepage (gamified, safe UI)
- [ ] Games library with unlock logic
- [ ] Game player integration (existing games)
- [ ] Game telemetry (start, mastery events)
- [ ] Cloud Function: onGameMastered trigger

#### Week 6: Worksheets
- [ ] Worksheet assignment by teacher
- [ ] Interactive worksheet player
- [ ] Auto-save every 10s
- [ ] Submit and lock answers
- [ ] Cloud Function: onWorksheetSubmitted trigger
- [ ] Teacher grading interface

**Acceptance:**
- Students can access unlocked games
- Playing games updates progress and badges
- Worksheets can be assigned, completed, auto-graded
- Progress updates trigger summary rollups

---

### Phase 4: Payments & RM (Weeks 7-8)
**Goal:** Payment processing and RM operations

#### Week 7: Payments
- [ ] Plans/packages management (admin)
- [ ] Payment gateway integration (Razorpay/Stripe)
- [ ] Manual payment verification workflow
- [ ] Invoice generation (PDF)
- [ ] Parent fees dashboard
- [ ] Cloud Function: processPayment, verifyManualPayment

#### Week 8: RM Portal
- [ ] RM dashboard (cohort health, fees, utilization)
- [ ] Teacher utilization grid
- [ ] Student at-risk flags (low attendance, behind schedule)
- [ ] Fee collection tracking
- [ ] Parent follow-up logs
- [ ] CSV/PDF reports export

**Acceptance:**
- Parents can pay online or upload manual payment proof
- RM can verify manual payments
- Invoices downloadable with GST breakdown
- RM can see teacher capacity and student health
- Fee recovery % calculated correctly

---

### Phase 5: Automation & Polish (Weeks 9-10)
**Goal:** Notifications, analytics, compliance

#### Week 9: Notifications
- [ ] Notification service (Email/SMS/WhatsApp)
- [ ] Scheduled reminders (T-24h, T-2h, T-15m)
- [ ] No-show detection (T+30m)
- [ ] Notification preferences
- [ ] In-app notification center
- [ ] Weekly digest emails

#### Week 10: Analytics & Compliance
- [ ] Admin analytics dashboard (active students, MRR, churn)
- [ ] Teacher KPI tracking (utilization %, on-time %, feedback latency)
- [ ] Parent KPI tracking (weekly active %, payment %)
- [ ] Compliance dashboard (consent registry, data access logs)
- [ ] Audit trail viewer
- [ ] Sentry integration for error tracking
- [ ] Web Vitals monitoring

**Acceptance:**
- All stakeholders receive timely notifications
- Analytics match actual data (no expensive aggregations)
- Audit logs capture all critical actions
- Performance targets met (TTFB ≤1s, LCP ≤2.5s)

---

## 📊 Data Model Implementation Checklist

### Collections to Create
- [x] `/users/{uid}` - User profiles (already exists)
- [x] `/usernames/{username}` - Username uniqueness (already exists)
- [ ] `/parents/{parentId}` - Parent profiles
- [ ] `/parents/{parentId}/children/{childId}` - Parent-child links
- [ ] `/students/{studentId}` - Student profiles with summary
- [ ] `/students/{studentId}/attendance/{date}` - Daily attendance
- [ ] `/students/{studentId}/curriculum/{topicId}` - Curriculum status
- [ ] `/students/{studentId}/progress/{topicId}` - Mastery tracking
- [ ] `/teachers/{teacherId}` - Teacher profiles
- [ ] `/teachers/{teacherId}/earnings/{month}` - Monthly earnings
- [ ] `/rms/{rmId}` - RM profiles
- [ ] `/sessions/{sessionId}` - Class sessions
- [ ] `/assignments/{assignmentId}` - Worksheet/game assignments
- [ ] `/submissions/{submissionId}` - Student submissions
- [ ] `/payments/{paymentId}` - Payment records
- [ ] `/plans/{planId}` - Subscription plans
- [ ] `/courses/{courseId}` - Course catalog
- [ ] `/courses/{courseId}/topics/{topicId}` - Course topics
- [ ] `/audit/{eventId}` - Audit trail
- [ ] `/notifications/{notificationId}` - User notifications
- [ ] `/resources/{resourceId}` - Teaching resources
- [ ] `/bookmarks/{bookmarkId}` - Teacher bookmarks
- [ ] `/tickets/{ticketId}` - Support tickets
- [ ] `/tickets/{ticketId}/messages/{messageId}` - Ticket messages
- [ ] `/consent/{consentId}` - User consents

### Summary Documents Pattern
All `/students/{sid}` docs should include denormalized summary:
```typescript
summary: {
  phonicsMastery: 45,      // 0-100%
  grammarMastery: 62,
  speakingMastery: 38,
  weeklyMinutes: 120,       // Last 7 days
  streakDays: 12,
  totalSessionsCompleted: 24,
  worksheetsCompleted: 18,
  gamesCompleted: 32,
  lastActivityAt: Timestamp,
  lastSessionAt: Timestamp,
  updatedAt: Timestamp
}
```

---

## 🛠️ Service Layer Implementation Order

1. **authService.ts** - Login, logout, role guards
2. **studentService.ts** - CRUD + summary updates
3. **sessionService.ts** - Schedule, join, complete
4. **attendanceService.ts** - Mark, request reschedule
5. **progressService.ts** - Update mastery, calculate bands
6. **worksheetService.ts** - Assign, submit, grade
7. **gameService.ts** - Track plays, mastery events
8. **paymentService.ts** - Process, verify, invoice
9. **notificationService.ts** - Send, schedule, templates
10. **analyticsService.ts** - Dashboards, KPIs, reports

---

## 🧪 Testing Strategy

### Unit Tests (Vitest)
- Service layer functions
- Utility functions (date, calculation, validation)
- React hooks

### Integration Tests
- Cloud Functions with Firestore emulator
- Payment gateway (sandbox mode)
- Notification delivery (test numbers)

### E2E Tests (Playwright)
- Parent workflow: Login → View child → Check progress
- Teacher workflow: Login → View calendar → Complete session
- Student workflow: Login → Play game → Submit worksheet
- Payment workflow: Select plan → Pay → Verify invoice

### Performance Tests
- Dashboard load times (<2s target)
- Firestore query optimization
- Bundle size analysis
- Lighthouse scores (90+ target)

---

## 🚀 Deployment Checklist

### Before v1.0 Launch
- [ ] Firestore rules deployed and tested
- [ ] All Cloud Functions deployed
- [ ] Environment variables configured
- [ ] Payment gateway in production mode
- [ ] reCAPTCHA v3 key added (remove debug mode)
- [ ] Sentry project created and DSN added
- [ ] Email/SMS templates finalized
- [ ] GST invoice format approved
- [ ] Privacy policy & T&C pages
- [ ] GDPR/data consent flows
- [ ] Backup/restore procedure documented
- [ ] Monitoring dashboards configured
- [ ] Support ticket system tested
- [ ] Load testing completed
- [ ] Security audit passed
- [ ] Accessibility audit (WCAG AA minimum)
- [ ] Browser compatibility tested (Chrome, Safari, Firefox, Edge)
- [ ] Mobile responsiveness verified
- [ ] Production domain SSL configured
- [ ] Firebase hosting cache headers optimized

---

## 📈 Success Metrics

### Technical KPIs
- **Uptime**: 99.9%
- **TTFB**: ≤1s
- **LCP**: ≤2.5s
- **Error Rate**: <0.1%
- **Data Freshness**: ≤30s

### User KPIs
- **Parent**:
  - Weekly active parents: >80%
  - On-time payments: >95%
  - Avg reschedule lead time: >6h

- **Student**:
  - Weekly learning minutes: 60-90 min target
  - Topics mastered/week: 2-3
  - Streak retention: >70% for 7+ days

- **Teacher**:
  - Utilization: 75-85%
  - On-time start: >95%
  - Feedback latency: <2h avg
  - Documentation rate: 100%

- **RM**:
  - Fee recovery: >90%
  - Response time to enrollment: <24h
  - Churn prevention: <5% monthly

---

## 🔄 Iterative Development

### Weekly Sprints
- **Monday**: Sprint planning, assign tasks
- **Tuesday-Thursday**: Development
- **Friday**: Code review, testing, demo
- **Deploy to staging**: Friday EOD
- **Production deploy**: Monday (after smoke tests)

### Feature Flags
Use Firebase Remote Config for gradual rollouts:
- Kids Zone games (enable per course)
- Payment methods (online vs manual)
- Notification channels (email/SMS/WhatsApp)
- Advanced analytics features
- AI-powered suggestions

---

## ✅ v1.0 "Done" Definition

A feature is "Done" when:
1. Code reviewed and merged
2. Unit tests passing (>80% coverage)
3. Manual testing completed
4. Firestore rules updated if needed
5. Cloud Functions deployed if applicable
6. Documentation updated
7. Acceptance criteria met
8. No critical bugs
9. Performance targets achieved
10. Deployed to production

---

## 🎓 Next Steps (You)

### Immediate Actions:
1. **Deploy Firestore rules:**
   ```bash
   cp firestore.rules.v1 firestore.rules
   firebase deploy --only firestore:rules
   ```

2. **Create folder structure:**
   ```bash
   cd app/src
   mkdir -p pages/{parent,kids,teacher,rm,admin}
   mkdir -p services hooks types utils contexts
   mkdir -p layouts components/{common,forms,dashboard}
   ```

3. **Start with Parent Dashboard:**
   - Create `ParentLayout.tsx`
   - Create `pages/parent/Dashboard.tsx`
   - Implement `useStudent.ts` hook
   - Add route protection

4. **Implement first Cloud Function:**
   - Start with `onSessionCompleted`
   - Test with Firestore emulator
   - Deploy to staging

### ✅ Questions Answered:
1. **Payment Gateway**: ❌ **None for v1.0** - Manual payment verification only. Payment gateway integration deferred to v2.0.
2. **Notification Provider**: ✅ **WhatsApp Business API** - Primary channel for all notifications (reminders, updates, alerts).
3. **Session Platform**: ✅ **Zoom** - All 1:1 classes will be conducted via Zoom.
4. **Auto-cancellation**: ⏳ **To be decided** - Requires business policy decision on fee impact.
5. **Worksheet Versioning**: ⏳ **To be decided** - Requires educator input on content management.

### 📝 Implementation Notes:
- **Payments**: Use manual upload + admin verification workflow. Store payment proof URLs in Firestore.
- **WhatsApp**: Integrate WhatsApp Business API for notifications. Fallback to SMS/Email if WhatsApp delivery fails.
- **Zoom**: Store Zoom meeting links in session documents. Teachers generate links from their Zoom account.

---

## ✅ Week 1 Foundation - COMPLETED

### Completed Tasks:
- ✅ Deployed new Firestore security rules with role-based access control
- ✅ Created AuthContext with role claims (no Firestore reads for auth)
- ✅ Built ProtectedRoute component with role-based guards
- ✅ Created all 5 layout components:
  - ParentLayout.tsx (indigo theme)
  - KidsLayout.tsx (gamified, colorful)
  - TeacherLayout.tsx (green theme)
  - RMLayout.tsx (orange theme)
  - AdminLayout.tsx (dark theme)

### Next Steps:
Start **Week 2: Parent Portal MVP** implementation. Begin with Parent Dashboard and multi-child switcher.

---

Ready to continue building! 🚀
