// src/app/routes.tsx
import { lazy, Suspense, type FC } from 'react';
import { createBrowserRouter, Outlet, Navigate } from 'react-router-dom';

const LoginPage = lazy(() => import('../pages/LoginPage'));
const Login = lazy(() => import('../pages/Login'));
const UnauthorizedPage = lazy(() => import('../pages/UnauthorizedPage'));
const NotFoundPage = lazy(() => import('../pages/NotFoundPage'));
const HomePage = lazy(() => import('../pages/HomePage'));
const CurriculumPage = lazy(() => import('../pages/CurriculumPage'));
const CoursesPage = lazy(() => import('../pages/CoursesPage'));
const CourseDetailPage = lazy(() => import('../pages/CourseDetailPage'));
const BlogPage = lazy(() => import('../pages/BlogPage'));
const BlogPostPage = lazy(() => import('../pages/BlogPostPage'));
const PricingPage = lazy(() => import('../pages/PricingPage'));
const ChristmasTreeDecoratePublic = lazy(() => import('../pages/public/seasonal/ChristmasTreeDecoratePublic'));
const FAQPage = lazy(() => import('../pages/FAQPage'));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const WhyTinyStepsPage = lazy(() => import('../pages/WhyTinyStepsPage'));
const ForSchoolsPage = lazy(() => import('../pages/ForSchoolsPage'));

// Course Pages
const PhonicsPage = lazy(() => import('../pages/phonics'));
const GrammarPage = lazy(() => import('../pages/grammar'));
const SpeakingPage = lazy(() => import('../pages/speaking'));
// Parents / Help hub
const ParentsHubPage = lazy(() => import('../pages/parents/ParentsHubPage'));
const ParentGettingStarted = lazy(() => import('../pages/parents/getting-started'));
const ParentChoosingCourse = lazy(() => import('../pages/parents/choosing-course'));
const ParentScheduling = lazy(() => import('../pages/parents/scheduling'));
const ParentPaymentsPage = lazy(() => import('../pages/parents/payments'));
const ParentTracking = lazy(() => import('../pages/parents/tracking-progress'));
const ParentHomework = lazy(() => import('../pages/parents/helping-with-homework'));
const ParentPhonicsMission = lazy(() => import('../pages/parents/phonics-mission'));
const ParentReading = lazy(() => import('../pages/parents/reading-at-home'));
const ParentSpeaking = lazy(() => import('../pages/parents/speech-confidence'));
const ParentCommonMistakes = lazy(() => import('../pages/parents/common-mistakes'));

// Dashboards
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const TeacherStudentTopicProgressPage = lazy(() => import('../pages/teacher/TeacherStudentTopicProgressPage'));
const TeacherDashboard = lazy(() => import('../pages/teacher/TeacherDashboard'));
const LessonLibraryPage = lazy(() => import('../pages/teacher/LessonLibraryPage'));
const DebugLessonLibrary = lazy(() => import('../pages/DebugLessonLibrary'));
import ParentDashboard from '../pages/parent/ParentDashboard';
import ParentProfile from '../pages/parent/Profile';
import ParentPayments from '../pages/parent/Payments';
const KidsPortal = lazy(() => import('../pages/KidsPortal'));
const LPDashboard = lazy(() => import('../pages/lp/LPDashboard'));
const KidsGamesHub = lazy(() => import('../pages/KidsGamesHub'));
const KidsPhonicsLibrary = lazy(() => import('../pages/KidsPhonicsLibrary'));
const KidsPhonicsMission = lazy(() => import('../pages/KidsPhonicsMission'));
const KidsBalloonPop = lazy(() => import('../pages/KidsBalloonPop'));
const SoundDetectiveGame = lazy(() => import('../pages/kids/games/phonics/SoundDetectiveGame'));
const LetterTracingGame = lazy(() => import('../pages/kids/games/phonics/LetterTracingGame'));
const LetterTracingWithSounds = lazy(() => import('../pages/kids/games/phonics/LetterTracingWithSounds'));
const Blend2LettersGame = lazy(() => import('../pages/kids/games/phonics/MyFirstWords/MyFirstWordsGame'));
// BetaAnalytics component removed - file does not exist
// const BetaAnalytics = lazy(
//   () => import('../pages/admin/beta-analytics.jsx') as any,
// );

// Payment Components (all used in /parent routes - made eager to eliminate #426)
import PaymentCallback from '../pages/parent/Payments/PaymentCallback';
import PhonePeCheckout from '../pages/payments/PhonePeCheckout';
import PhonePeCallback from '../pages/payments/PhonePeCallback';

// Layout
import Header from '../components/common/Header';
import RoleGate from '../components/common/RoleGate';
import AnalyticsTracker from '../components/common/AnalyticsTracker';
import FloatingAssistant from '../components/common/FloatingAssistant';
import BackToTopButton from '../components/common/BackToTopButton';
import ScrollToTop from '../components/common/ScrollToTop';

const Layout: FC = () => (
  <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fdf4ff,_#f4f8ff_45%,_#ffffff_80%)]">
    <AnalyticsTracker />
    <ScrollToTop />
    <Header />
    <main className="min-h-screen pt-8 md:pt-12 lg:pt-16 pb-16">
      <Suspense fallback={<div className="px-6 py-10 text-sm text-gray-600">Loading…</div>}>
        <Outlet />
      </Suspense>
    </main>
    <Suspense fallback={null}>
      <FloatingAssistant />
      <BackToTopButton />
    </Suspense>
  </div>
);

const router = createBrowserRouter(
  [
    // Public chrome-less seasonal route (renders without main Layout/header)
    { path: 'seasonal/christmas-tree', element: <ChristmasTreeDecoratePublic /> },
    {
      element: <Layout />,
      errorElement: <NotFoundPage />,
      children: [
        // ---------- Public marketing site ----------
        { index: true, element: <HomePage /> },
        { path: 'blog', element: <BlogPage /> },
        { path: 'blog/:slug', element: <BlogPostPage /> },
        { path: 'seasonal/christmas-tree', element: <ChristmasTreeDecoratePublic /> },
        { path: 'pricing', element: <PricingPage /> },
        { path: 'contact', element: <ContactPage /> },
        { path: 'why-tiny-steps', element: <WhyTinyStepsPage /> },
        { path: 'courses', element: <CoursesPage /> },
        { path: 'courses/:courseId', element: <CourseDetailPage /> },
        { path: 'curriculum', element: <CurriculumPage /> },
        // Parents / Help hub
        { path: 'parents', element: <ParentsHubPage /> },
        { path: 'parents/getting-started', element: <ParentGettingStarted /> },
        { path: 'parents/choosing-course', element: <ParentChoosingCourse /> },
        { path: 'parents/scheduling', element: <ParentScheduling /> },
        { path: 'parents/payments', element: <ParentPaymentsPage /> },
        { path: 'parents/tracking-progress', element: <ParentTracking /> },
        { path: 'parents/helping-with-homework', element: <ParentHomework /> },
        { path: 'parents/phonics-mission', element: <ParentPhonicsMission /> },
        { path: 'parents/reading-at-home', element: <ParentReading /> },
        { path: 'parents/speech-confidence', element: <ParentSpeaking /> },
        { path: 'parents/common-mistakes', element: <ParentCommonMistakes /> },
        { path: 'why-us', element: <Navigate to="/why-tiny-steps" replace /> },
        { path: 'faq', element: <FAQPage /> },
        { path: 'phonics', element: <PhonicsPage /> },
        { path: 'grammar', element: <GrammarPage /> },
        { path: 'speaking', element: <SpeakingPage /> },
        { path: 'for-schools', element: <ForSchoolsPage /> },

        // ---------- Public auth routes ----------
        { path: 'login', element: <LoginPage /> },
        { path: 'surya/login', element: <Login /> },
        { path: 'admin/login', element: <Navigate to="/surya/login" replace /> },
        { path: 'Surya/login', element: <Navigate to="/surya/login" replace /> },

        { path: 'teacher/login', element: <LoginPage /> },
        { path: 'parent/login', element: <LoginPage /> },
        { path: 'learning-partner/login', element: <LoginPage /> },
        { path: 'learningpartner/login', element: <LoginPage /> }, // alias

        { path: 'kid/login', element: <Navigate to="/parent/login" replace /> },
        { path: 'unauthorized', element: <UnauthorizedPage /> },

        // Dev helper routes removed: in-app seeding pages have been deleted
        // Temporary dev test route to validate client routing quickly
        { path: 'dev/seed-test', element: <div style={{ padding: 20 }}>Dev route working — seed-test</div> },
        { path: '/dev/seed-test', element: <div style={{ padding: 20 }}>Dev route working — seed-test</div> },
        // DEBUG: Direct lesson library test (bypasses all routing issues)
        { path: 'debug-lessons', element: <DebugLessonLibrary /> },
        // Temporary: public test route for Lesson Library (bypasses RoleGate)
        { path: 'teacher/lessons-test', element: <LessonLibraryPage /> },
        // Also accept absolute path variant to avoid any client-side route normalization issues
        { path: '/teacher/lessons-test', element: <LessonLibraryPage /> },

        // ---------- Admin area – ONLY under /surya ----------
        {
          path: 'surya',
          element: (
            <Suspense fallback={<div className="px-6 py-10 text-sm text-gray-600">Loading…</div>}>
              <RoleGate
                allowedRoles={['admin']}
                loginPath="/surya/login"
              />
            </Suspense>
          ),
          children: [
            { index: true, element: <AdminDashboard /> },
            { path: 'analytics', element: <AdminDashboard /> },
          ],
        },
        { path: 'admin', element: <Navigate to="/surya/login" replace /> },
        { path: 'Surya', element: <Navigate to="/surya" replace /> },

        // ---------- Teacher dashboard ----------
        {
          path: 'teacher',
          element: (
            <Suspense fallback={<div className="px-6 py-10 text-sm text-gray-600">Loading…</div>}>
              <RoleGate
                allowedRoles={['teacher']}
                loginPath="/teacher/login"
              />
            </Suspense>
          ),
          children: [
            { index: true, element: <TeacherDashboard /> },
            // Redirect legacy direct lesson route into dashboard with tab param
            { path: 'lessons', element: <Navigate to="/teacher?tab=lessons" replace /> },
            {
              path: 'students/:kidId/topic-progress',
              element: <TeacherStudentTopicProgressPage />,
            },
          ],
        },
        // Teacher routes with :teacherId param (supports sidebar links)
        {
          path: 'teacher/:teacherId',
          element: (
            <Suspense fallback={<div className="px-6 py-10 text-sm text-gray-600">Loading…</div>}>
              <RoleGate
                allowedRoles={['teacher']}
                loginPath="/teacher/login"
              />
            </Suspense>
          ),
          children: [
            { index: true, element: <TeacherDashboard /> },
            // Redirect parametric teacher lesson URL into canonical dashboard view
            { path: 'lessons', element: <Navigate to="/teacher?tab=lessons" replace /> },
            {
              path: 'students/:kidId/topic-progress',
              element: <TeacherStudentTopicProgressPage />,
            },
          ],
        },
        {
          path: 'teachers',
          element: (
            <Suspense fallback={<div className="px-6 py-10 text-sm text-gray-600">Loading…</div>}>
              <RoleGate
                allowedRoles={['teacher']}
                loginPath="/teacher/login"
              />
            </Suspense>
          ),
          children: [{ index: true, element: <TeacherDashboard /> }],
        },

        // ---------- Parent dashboard + payments ----------
        {
          path: 'parent',
          element: (
            <Suspense fallback={<div className="px-6 py-10 text-sm text-gray-600">Loading…</div>}>
              <RoleGate
                allowedRoles={['parent']}
                loginPath="/parent/login"
              />
            </Suspense>
          ),
          children: [
            { index: true, element: <ParentDashboard /> },
            { path: 'profile', element: <ParentProfile /> },
            { path: 'payments', element: <ParentPayments /> },
            { path: 'kids', element: <ParentDashboard /> },
            { path: 'payments/:invoiceId', element: <PhonePeCheckout /> },
            { path: 'payments/callback', element: <PaymentCallback /> },
            { path: 'payments/phonepe-callback', element: <PhonePeCallback /> },
          ],
        },

        // ---------- Kids Portal (standalone, kid-friendly) ----------
        {
          path: 'kids',
          element: (
            <Suspense fallback={<div className="px-6 py-10 text-sm text-gray-600">Loading…</div>}>
              <RoleGate
                allowedRoles={['kid', 'parent']}
                loginPath="/parent/login"
              />
            </Suspense>
          ),
          children: [
            { index: true, element: <KidsPortal /> },
            { path: 'games', element: <KidsGamesHub /> },
            { path: 'games/phonics', element: <KidsPhonicsLibrary /> },
            { path: 'games/phonics/letter-sound', element: <KidsPhonicsMission /> },
            { path: 'games/phonics/balloon-pop', element: <KidsBalloonPop /> },
            { path: 'games/phonics/letter-tracing', element: <LetterTracingGame /> },
            { path: 'games/phonics/letter-tracing-sounds', element: <LetterTracingWithSounds /> },
            { path: 'games/phonics/my-first-words', element: <Blend2LettersGame /> },
            // Temporary: make /kids/games/speaking safe (redirect to games hub)
            { path: 'games/speaking', element: <KidsGamesHub /> },
            { path: 'games/phonics/sound-detective', element: <SoundDetectiveGame /> },
          ],
        },

        // ---------- Learning Partner dashboard ----------
        {
          path: 'learning-partner',
          element: (
            <Suspense fallback={<div className="px-6 py-10 text-sm text-gray-600">Loading…</div>}>
              <RoleGate
                allowedRoles={['learningPartner']}
                loginPath="/learning-partner/login"
              />
            </Suspense>
          ),
          children: [{ index: true, element: <LPDashboard /> }],
        },
        { path: 'learningpartner', element: <Navigate to="/learning-partner" replace /> },

        // ---------- Misc aliases ----------
        { path: 'kid', element: <Navigate to="/parent/kids" replace /> },
        { path: 'kids/:childId/dashboard', element: <Navigate to="/parent" replace /> },

        // Beta analytics route removed - component file does not exist
        // {
        //   path: 'admin/beta-analytics',
        //   element: (
        //     <Suspense fallback={<div className="px-6 py-10 text-sm text-gray-600">Loading…</div>}>
        //       <RoleGate
        //         allowedRoles={['admin']}
        //         loginPath="/surya/login"
        //       />
        //     </Suspense>
        //   ),
        //   children: [{ index: true, element: <BetaAnalytics /> }],
        // },

        // Topics seeding page removed from admin routes
      ],
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
      v7_fetcherPersist: true,
      v7_normalizeFormMethod: true,
      v7_partialHydration: true,
      v7_skipActionErrorRevalidation: true,
    },
  },
);

export default router;
