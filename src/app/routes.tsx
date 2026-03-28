// src/app/routes.tsx
import { lazy, Suspense, useEffect, useState, type FC } from 'react';
import { createBrowserRouter, Outlet, Navigate, useLocation, redirect, type LoaderFunctionArgs } from 'react-router-dom';

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
const TeamPage = lazy(() => import('../pages/TeamPage'));
const SummerCampsPage = lazy(() => import('../pages/SummerCampsPage'));
const SummerCampProgramPage = lazy(() => import('../pages/SummerCampProgramPage'));

// Course Pages
const PhonicsPage = lazy(() => import('../pages/phonics'));
const GrammarPage = lazy(() => import('../pages/grammar'));
const SpeakingPage = lazy(() => import('../pages/speaking'));
const PhonicsClassesForKidsPage = lazy(() => import('../pages/PhonicsClassesForKidsPage'));
const OnlinePhonicsReadingClassesPage = lazy(() => import('../pages/public/OnlinePhonicsReadingClassesPage'));
const EnglishGrammarWritingClassesPage = lazy(() => import('../pages/public/EnglishGrammarWritingClassesPage'));
const PublicSpeakingCommunicationKidsPage = lazy(() => import('../pages/public/PublicSpeakingCommunicationKidsPage'));
const BestOnlinePhonicsClassesIndiaPage = lazy(() => import('../pages/public/BestOnlinePhonicsClassesIndiaPage'));
const PhonicsAppsPreschoolersIndiaPage = lazy(() => import('../pages/public/PhonicsAppsPreschoolersIndiaPage'));
const PhonicsGamesPreschoolersPage = lazy(() => import('../pages/public/PhonicsGamesPreschoolersPage'));
const LearningGamesMarketingPage = lazy(() => import('../pages/public/LearningGamesMarketingPage'));
const BookDemoPage = lazy(() => import('../pages/public/BookDemoPage'));
const CareersPage = lazy(() => import('../pages/public/CareersPage'));
const LearningPartnerPage = lazy(() => import('../pages/public/LearningPartnerPage'));
const PrivacyPolicyPage = lazy(() => import('../pages/PrivacyPolicyPage'));
const TermsAndConditionsPage = lazy(() => import('../pages/TermsAndConditionsPage'));
const RefundGuaranteePage = lazy(() => import('../pages/RefundGuaranteePage'));
const CometCourierGame = lazy(() => import('../pages/dev/CometCourierGame'));
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
const KidsEnglishExcellence = lazy(() => import('../pages/KidsEnglishExcellence'));
const KidsPhonicsLibrary = lazy(() => import('../pages/KidsPhonicsLibrary'));
const KidsPhonicsMission = lazy(() => import('../pages/KidsPhonicsMission'));
const KidsBalloonPop = lazy(() => import('../pages/KidsBalloonPop'));
const SoundDetectiveGame = lazy(() => import('../pages/kids/games/phonics/SoundDetectiveGame'));
const LetterTracingGame = lazy(() => import('../pages/kids/games/phonics/LetterTracingGame'));
const LetterTracingWithSounds = lazy(() => import('../pages/kids/games/phonics/LetterTracingWithSounds'));
const Blend2LettersGame = lazy(() => import('../pages/kids/games/phonics/MyFirstWords/MyFirstWordsGame'));
const CvcWordReaderGame = lazy(() => import('../pages/kids/games/phonics/CvcWordReader/CvcWordReaderGame'));
const MakeAWordRimeGame = lazy(() => import('../pages/kids/games/phonics/CvcWordReader/MakeAWordRimeGame'));
const SentenceStepperStage4 = lazy(() => import('../pages/kids/games/phonics/SentenceStepperStage4'));
const BuildBetterSentencesReorder = lazy(() => import('../pages/kids/games/grammar/BuildBetterSentencesReorder'));
const BuildBetterSentencesFillBlank = lazy(() => import('../pages/kids/games/grammar/BuildBetterSentencesFillBlank'));
const BuildBetterSentencesChooseBetter = lazy(() => import('../pages/kids/games/grammar/BuildBetterSentencesChooseBetter'));
const BuildBetterSentencesExpandSentence = lazy(() => import('../pages/kids/games/grammar/BuildBetterSentencesExpandSentence'));
const GrammarFixSpotOneError = lazy(() => import('../pages/kids/games/grammar/GrammarFixSpotOneError'));
const GrammarFixFixOneError = lazy(() => import('../pages/kids/games/grammar/GrammarFixFixOneError'));
const GrammarFixFixFullSentence = lazy(() => import('../pages/kids/games/grammar/GrammarFixFixFullSentence'));
const GrammarFixTimedCorrection = lazy(() => import('../pages/kids/games/grammar/GrammarFixTimedCorrection'));
const CollocationBuilderMatchPairs = lazy(() => import('../pages/kids/games/grammar/CollocationBuilderMatchPairs'));
const CollocationBuilderChooseNaturalPair = lazy(() => import('../pages/kids/games/grammar/CollocationBuilderChooseNaturalPair'));
const CollocationBuilderFillSentence = lazy(() => import('../pages/kids/games/grammar/CollocationBuilderFillSentence'));
const StoryReadingGame = lazy(() => import('../pages/kids/games/reading/StoryReading/StoryReadingGame'));
const ComprehensionGame = lazy(() => import('../pages/kids/games/reading/ComprehensionGame/ComprehensionGame'));
const NewWordsFromReading = lazy(() => import('../pages/kids/games/reading/NewWordsFromReading/NewWordsFromReading'));
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
import Footer from '../components/common/Footer';
import RoleGate from '../components/common/RoleGate';
import AnalyticsTracker from '../components/common/AnalyticsTracker';
import BackToTopButton from '../components/common/BackToTopButton';
import ScrollToTop from '../components/common/ScrollToTop';
const FloatingAssistant = lazy(() => import('../components/common/FloatingAssistant'));

const APP_ROUTE_PREFIXES = [
  '/surya',
  '/teacher',
  '/parent',
  '/kids',
  '/learning-partner/dashboard',
  '/learningpartner/dashboard',
];

const AUTH_ENTRY_ROUTES = new Set([
  '/login',
  '/surya/login',
  '/admin/login',
  '/Surya/login',
  '/teacher/login',
  '/parent/login',
  '/learning-partner/login',
  '/learningpartner/login',
  '/kid/login',
]);

const matchesRoutePrefix = (pathname: string, prefix: string) =>
  pathname === prefix || pathname.startsWith(`${prefix}/`);

const ENGLISH_EXCELLENCE_SHELL_PATH = '/kids/games/english-excellence';

const resolveKidIdFromStorage = () => {
  try {
    const stored = localStorage.getItem('ts_active_kid_v1');
    return stored ? stored.trim() : '';
  } catch {
    return '';
  }
};

const buildMissionShellTarget = (
  currentSearch: string,
  explicitKidId?: string,
) => {
  const params = new URLSearchParams(currentSearch);
  const nextKidId = explicitKidId || params.get('kidId') || resolveKidIdFromStorage();
  if (nextKidId) params.set('kidId', nextKidId);
  const search = params.toString();
  return search ? `${ENGLISH_EXCELLENCE_SHELL_PATH}?${search}` : ENGLISH_EXCELLENCE_SHELL_PATH;
};

const missionShellRedirectLoader = ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  return redirect(buildMissionShellTarget(url.search));
};

const legacyKidDashboardRedirectLoader = ({ request, params }: LoaderFunctionArgs) => {
  const url = new URL(request.url);
  const childId = typeof params.childId === 'string' ? params.childId : undefined;
  return redirect(buildMissionShellTarget(url.search, childId));
};

const Layout: FC = () => {
  const location = useLocation();
  const hideMarketingChrome = APP_ROUTE_PREFIXES.some((prefix) => matchesRoutePrefix(location.pathname, prefix));
  const hideSupportWidgets = hideMarketingChrome || AUTH_ENTRY_ROUTES.has(location.pathname);
  const isContactPage = location.pathname === '/contact';
  const [showFloatingTools, setShowFloatingTools] = useState(false);

  useEffect(() => {
    if (hideSupportWidgets) return;

    const win = window as Window & {
      requestIdleCallback?: (cb: () => void, opts?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    const activate = () => setShowFloatingTools(true);
    let idleId: number | undefined;
    let timeoutId: number | undefined;

    if (typeof win.requestIdleCallback === 'function') {
      idleId = win.requestIdleCallback(activate, { timeout: 1500 });
    } else {
      timeoutId = window.setTimeout(activate, 1200);
    }

    return () => {
      if (idleId !== undefined && typeof win.cancelIdleCallback === 'function') {
        win.cancelIdleCallback(idleId);
      }
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [hideSupportWidgets]);

  return (
    <div className={`min-h-screen ${isContactPage ? 'bg-[#060a16]' : 'bg-[radial-gradient(circle_at_top,_#fdf4ff,_#f4f8ff_45%,_#ffffff_80%)]'}`}>
      <AnalyticsTracker />
      <ScrollToTop />
      {!hideMarketingChrome ? <Header /> : null}
      <main
        className={
          isContactPage
            ? `${hideMarketingChrome ? '' : 'pt-0'} pb-0 min-h-0`
            : `min-h-screen pb-16 ${hideMarketingChrome ? '' : 'pt-8 md:pt-12 lg:pt-16'}`
        }
      >
        <Suspense fallback={<div className="px-6 py-10 text-sm text-gray-600">Loading…</div>}>
          <Outlet />
        </Suspense>
      </main>
      {!hideMarketingChrome ? <Footer /> : null}
      {!hideSupportWidgets && showFloatingTools ? (
        <Suspense fallback={null}>
          <FloatingAssistant />
          <BackToTopButton />
        </Suspense>
      ) : null}
    </div>
  );
};

const router = createBrowserRouter(
  [
    // Public chrome-less seasonal route (renders without main Layout/header)
    { path: 'seasonal/christmas-tree', element: <ChristmasTreeDecoratePublic /> },
    { path: 'dev/comet-courier', element: <CometCourierGame /> },
    {
      element: <Layout />,
      errorElement: <NotFoundPage />,
      children: [
        // ---------- Public marketing site ----------
        { index: true, element: <HomePage /> },
        { path: 'blog', element: <BlogPage /> },
        { path: 'blog/:slug', element: <BlogPostPage /> },
        { path: 'pricing', element: <PricingPage /> },
        { path: 'contact', element: <ContactPage /> },
        { path: 'why-tiny-steps', element: <WhyTinyStepsPage /> },
        { path: 'learning-partner', element: <LearningPartnerPage /> },
        { path: 'team', element: <TeamPage /> },
        { path: 'careers', element: <CareersPage /> },
        { path: 'courses', element: <CoursesPage /> },
        { path: 'courses/:slug', element: <CourseDetailPage /> },
        { path: 'curriculum', element: <CurriculumPage /> },
        { path: 'privacy-policy', element: <PrivacyPolicyPage /> },
        { path: 'terms-and-conditions', element: <TermsAndConditionsPage /> },
        { path: 'refund-guarantee', element: <RefundGuaranteePage /> },
        { path: 'how-it-works', element: <Navigate to="/curriculum" replace /> },
        // Legacy legal URL aliases -> canonical
        { path: 'privacy', element: <Navigate to="/privacy-policy" replace /> },
        { path: 'privacy.html', element: <Navigate to="/privacy-policy" replace /> },
        { path: 'terms.html', element: <Navigate to="/terms-and-conditions" replace /> },
        { path: 'terms-of-service', element: <Navigate to="/terms-and-conditions" replace /> },
        // Legacy blog short URLs -> canonical slugs
        { path: 'blog/week3', element: <Navigate to="/blog/week-3-phonics-tricky-words" replace /> },
        { path: 'blog/week6', element: <Navigate to="/blog/week-6-phonics-comprehension" replace /> },
        { path: 'blog/week7', element: <Navigate to="/blog/week-7-grammar-nouns-to-paragraphs" replace /> },
        { path: 'blog/week8', element: <Navigate to="/blog/week-8-grammar-tenses" replace /> },
        { path: 'blog/week9', element: <Navigate to="/blog/week-9-grammar-conjunctions" replace /> },
        { path: 'blog/week10', element: <Navigate to="/blog/week-10-grammar-subject-verb" replace /> },
        { path: 'blog/week6.html', element: <Navigate to="/blog/week-6-phonics-comprehension" replace /> },
        { path: 'blog/week8.html', element: <Navigate to="/blog/week-8-grammar-tenses" replace /> },
        // Legacy /main shell URLs -> canonical hubs
        { path: 'main/courses', element: <Navigate to="/courses" replace /> },
        { path: 'main/parents', element: <Navigate to="/parents" replace /> },
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
        { path: 'summer-english-camp-2026', element: <Navigate to="/summer-camps" replace /> },
        { path: 'online-phonics-reading-classes', element: <OnlinePhonicsReadingClassesPage /> },
        { path: 'english-grammar-writing-classes', element: <EnglishGrammarWritingClassesPage /> },
        { path: 'public-speaking-communication-kids', element: <PublicSpeakingCommunicationKidsPage /> },
        { path: 'best-online-phonics-classes-india', element: <BestOnlinePhonicsClassesIndiaPage /> },
        { path: 'phonics-apps-for-preschoolers-india', element: <PhonicsAppsPreschoolersIndiaPage /> },
        { path: 'phonics-games-for-preschoolers', element: <PhonicsGamesPreschoolersPage /> },
        { path: 'phonics-learning-games', element: <LearningGamesMarketingPage /> },
        { path: 'summer-camps', element: <SummerCampsPage /> },
        { path: 'summer-camps/:programSlug/:batchSlug', element: <SummerCampProgramPage /> },
        { path: 'summer-camps/:programSlug', element: <SummerCampProgramPage /> },
        { path: 'phonics-classes-for-kids', element: <PhonicsClassesForKidsPage /> },
        { path: 'phonics', element: <PhonicsPage /> },
        { path: 'grammar', element: <GrammarPage /> },
        { path: 'speaking', element: <SpeakingPage /> },
        { path: 'games', element: <Navigate to="/games/english-excellence" replace /> },
        // Public marketing entry for English Excellence games + subscription plans
        { path: 'games/english-excellence', element: <LearningGamesMarketingPage /> },
        { path: 'for-schools', element: <ForSchoolsPage /> },
        { path: 'book-demo', element: <BookDemoPage /> },

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
        // Canonicalize legacy child entry paths to English Excellence Mission
        { path: '/kids', loader: missionShellRedirectLoader },
        { path: '/kids/games', loader: missionShellRedirectLoader },

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
            { path: 'demo-sessions', element: <Navigate to="/surya?tab=demo-sessions" replace /> },
            { path: 'leads', element: <Navigate to="/surya?tab=leads" replace /> },
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
            { path: 'demo-assignments', element: <Navigate to="/teacher?tab=demo-assignments" replace /> },
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
            { path: 'demo-assignments', element: <Navigate to="/teacher?tab=demo-assignments" replace /> },
            // Redirect parametric teacher lesson URL into canonical dashboard view
            { path: 'lessons', element: <Navigate to="/teacher?tab=lessons" replace /> },
            {
              path: 'students/:kidId/topic-progress',
              element: <TeacherStudentTopicProgressPage />,
            },
          ],
        },
        // Legacy public /teachers URL should resolve to the canonical team page
        { path: 'teachers', element: <Navigate to="/team" replace /> },

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
            { index: true, loader: missionShellRedirectLoader },
            // Legacy kids shell paths retained as aliases only.
            { path: 'portal', element: <KidsPortal /> },
            { path: 'games', loader: missionShellRedirectLoader },
            { path: 'games/hub', element: <KidsGamesHub /> },
            { path: 'games/english-excellence', element: <KidsEnglishExcellence /> },
            { path: 'games/comet-courier', element: <CometCourierGame /> },
            { path: 'games/phonics', element: <KidsPhonicsLibrary /> },
            { path: 'games/phonics/letter-sound', element: <KidsPhonicsMission /> },
            { path: 'games/phonics/balloon-pop', element: <KidsBalloonPop /> },
            { path: 'games/phonics/letter-tracing', element: <LetterTracingGame /> },
            { path: 'games/phonics/letter-tracing-sounds', element: <LetterTracingWithSounds /> },
            { path: 'games/phonics/my-first-words', element: <Blend2LettersGame /> },
            { path: 'games/phonics/cvc-word-reader', element: <CvcWordReaderGame /> },
            { path: 'games/phonics/cvc-word-reader/make-a-word', element: <MakeAWordRimeGame /> },
            { path: 'games/phonics/spelling-practice', element: <MakeAWordRimeGame /> },
        { path: 'games/phonics/sentence-stepper', element: <SentenceStepperStage4 /> },
        { path: 'games/grammar/build-better-sentences', element: <BuildBetterSentencesReorder /> },
        { path: 'games/grammar/build-better-sentences/fill-missing-word', element: <BuildBetterSentencesFillBlank /> },
        { path: 'games/grammar/build-better-sentences/choose-better-sentence', element: <BuildBetterSentencesChooseBetter /> },
        { path: 'games/grammar/build-better-sentences/expand-sentence', element: <BuildBetterSentencesExpandSentence /> },
        { path: 'games/grammar/grammar-fix/spot-one-error', element: <GrammarFixSpotOneError /> },
        { path: 'games/grammar/grammar-fix/fix-one-error', element: <GrammarFixFixOneError /> },
        { path: 'games/grammar/grammar-fix/fix-full-sentence', element: <GrammarFixFixFullSentence /> },
        { path: 'games/grammar/grammar-fix/timed-correction', element: <GrammarFixTimedCorrection /> },
        { path: 'games/grammar/collocation-builder/match-pairs', element: <CollocationBuilderMatchPairs /> },
        { path: 'games/grammar/collocation-builder/choose-natural-pair', element: <CollocationBuilderChooseNaturalPair /> },
        { path: 'games/grammar/collocation-builder/fill-sentence', element: <CollocationBuilderFillSentence /> },
        { path: 'games/reading/story-reading', element: <StoryReadingGame /> },
            { path: 'games/reading/comprehension', element: <ComprehensionGame /> },
            { path: 'games/reading/new-words', element: <NewWordsFromReading /> },
            { path: 'games/grammar', loader: missionShellRedirectLoader },
            { path: 'games/speaking', loader: missionShellRedirectLoader },
            { path: 'games/phonics/sound-detective', element: <SoundDetectiveGame /> },
          ],
        },

        // ---------- Learning Partner dashboard ----------
        {
          path: 'learning-partner/dashboard',
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
        { path: 'learningpartner/dashboard', element: <Navigate to="/learning-partner/dashboard" replace /> },

        // ---------- Misc aliases ----------
        { path: 'kid', element: <Navigate to="/kids/games/english-excellence" replace /> },
        { path: 'kids/:childId/dashboard', loader: legacyKidDashboardRedirectLoader },

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
