// src/app/routes.tsx
import { lazy, Suspense, useCallback, useEffect, useState, type FC, type MouseEvent } from 'react';
import {
  createBrowserRouter,
  Outlet,
  Navigate,
  useLocation,
  useNavigate,
  redirect,
  type LoaderFunctionArgs,
  type RouteObject,
} from 'react-router-dom';

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
const PhonicsForParentsResearchPage = lazy(() => import('../pages/blog/PhonicsForParentsResearchPage'));
const Week1SatpinLaunchPage = lazy(() => import('../pages/blog/Week1SatpinLaunchPage'));
const Week7GrammarNounsToParagraphsPage = lazy(() => import('../pages/blog/Week7GrammarNounsToParagraphsPage'));
const Week12SpeakingConfidenceSeedsPage = lazy(() => import('../pages/blog/Week12SpeakingConfidenceSeedsPage'));
const WhatIsJollyPhonicsBestWayPage = lazy(() => import('../pages/blog/WhatIsJollyPhonicsBestWayPage'));
const PricingPage = lazy(() => import('../pages/PricingPage'));
const SitemapPage = lazy(() => import('../pages/SitemapPage'));
const ChristmasTreeDecoratePublic = lazy(() => import('../pages/public/seasonal/ChristmasTreeDecoratePublic'));
const FAQPage = lazy(() => import('../pages/FAQPage'));
const ContactPage = lazy(() => import('../pages/ContactPage'));
const WhyTinyStepsPage = lazy(() => import('../pages/WhyTinyStepsPage'));
const ForSchoolsPage = lazy(() => import('../pages/ForSchoolsPage'));
const TeamPage = lazy(() => import('../pages/TeamPage'));
const SummerCampsPage = lazy(() => import('../pages/SummerCampsPage'));
const SummerCampProgramPage = lazy(() => import('../pages/SummerCampProgramPage'));
const ClassSamplesPage = lazy(() => import('../pages/ClassSamplesPage'));
const TestimonialsPage = lazy(() => import('../pages/TestimonialsPage'));

// Course Pages
const PhonicsPage = lazy(() => import('../pages/phonics'));
const GrammarPage = lazy(() => import('../pages/grammar'));
const SpeakingPage = lazy(() => import('../pages/speaking'));
const PhonicsClassesForKidsPage = lazy(() => import('../pages/PhonicsClassesForKidsPage'));
const BestOnlinePhonicsClassesIndiaPage = lazy(() => import('../pages/public/BestOnlinePhonicsClassesIndiaPage'));
const PhonicsAppsPreschoolersIndiaPage = lazy(() => import('../pages/public/PhonicsAppsPreschoolersIndiaPage'));
const PhonicsGamesPreschoolersPage = lazy(() => import('../pages/public/PhonicsGamesPreschoolersPage'));
const OnlinePhonicsReadingClassesPage = lazy(() => import('../pages/public/OnlinePhonicsReadingClassesPage'));
const EnglishGrammarWritingClassesPage = lazy(() => import('../pages/public/EnglishGrammarWritingClassesPage'));
const LearningGamesMarketingPage = lazy(() => import('../pages/public/LearningGamesMarketingPage'));
const PublicSpeakingCommunicationKidsPage = lazy(() => import('../pages/public/PublicSpeakingCommunicationKidsPage'));
const BookDemoPage = lazy(() => import('../pages/public/BookDemoPage'));
const CareersPage = lazy(() => import('../pages/public/CareersPage'));
const LearningPartnerPage = lazy(() => import('../pages/public/LearningPartnerPage'));
const ReadingClassesForKidsPage = lazy(() => import('../pages/public/ReadingClassesForKidsPage'));
const SpokenEnglishClassesForKidsPage = lazy(() => import('../pages/public/SpokenEnglishClassesForKidsPage'));
const WritingClassesForKidsPage = lazy(() => import('../pages/public/WritingClassesForKidsPage'));
const PhonicsFeesIndiaPage = lazy(() => import('../pages/public/PhonicsFeesIndiaPage'));
const OnlineEnglishClassesForKidsIndiaPage = lazy(() => import('../pages/public/OnlineEnglishClassesForKidsIndiaPage'));
const EnglishClassesFor4YearOldPage = lazy(() => import('../pages/public/EnglishClassesFor4YearOldPage'));
const EnglishClassesFor5YearOldPage = lazy(() => import('../pages/public/EnglishClassesFor5YearOldPage'));
const EnglishClassesFor6YearOldPage = lazy(() => import('../pages/public/EnglishClassesFor6YearOldPage'));
const EnglishClassesFor7To10YearOldPage = lazy(() => import('../pages/public/EnglishClassesFor7To10YearOldPage'));
const ChildNotReadingProperlyPage = lazy(() => import('../pages/public/ChildNotReadingProperlyPage'));
const SlowReaderChildHelpPage = lazy(() => import('../pages/public/SlowReaderChildHelpPage'));
const ShyChildSpeakingConfidencePage = lazy(() => import('../pages/public/ShyChildSpeakingConfidencePage'));
const ReadingFluencyProgramPage = lazy(() => import('../pages/public/ReadingFluencyProgramPage'));
const ConfidenceBuildingProgramKidsPage = lazy(() => import('../pages/public/ConfidenceBuildingProgramKidsPage'));
const EnglishFoundationProgramPage = lazy(() => import('../pages/public/EnglishFoundationProgramPage'));
const SummerCampForKidsIndiaPage = lazy(() => import('../pages/public/SummerCampForKidsIndiaPage'));
const SummerReadingProgramKidsPage = lazy(() => import('../pages/public/SummerReadingProgramKidsPage'));
const SummerSpeakingCampKidsPage = lazy(() => import('../pages/public/SummerSpeakingCampKidsPage'));
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
const ParentDashboard = lazy(() => import('../pages/parent/ParentDashboard'));
const ParentProfile = lazy(() => import('../pages/parent/Profile'));
const ParentPayments = lazy(() => import('../pages/parent/Payments'));
const KidsPortal = lazy(() => import('../pages/KidsPortal'));
const LPDashboard = lazy(() => import('../pages/lp/LPDashboard'));
const MessagesPage = lazy(() => import('../pages/messages/MessagesPage'));
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
const PaymentCallback = lazy(() => import('../pages/parent/Payments/PaymentCallback'));
const PhonePeCheckout = lazy(() => import('../pages/payments/PhonePeCheckout'));
const PhonePeCallback = lazy(() => import('../pages/payments/PhonePeCallback'));

// Layout
import Header from '../components/common/Header';
const Footer = lazy(() => import('../components/common/Footer'));
const RoleGate = lazy(() => import('../components/common/RoleGate'));
import type { Role } from '../components/common/RoleGate';
const AnalyticsTracker = lazy(() => import('../components/common/AnalyticsTracker'));
const BackToTopButton = lazy(() => import('../components/common/BackToTopButton'));
const ConversionTracker = lazy(() => import('../components/common/ConversionTracker'));
import ScrollToTop from '../components/common/ScrollToTop';
const AssessmentRequestModal = lazy(() => import('../components/common/AssessmentRequestModal'));
import {
  buildBaseConversionParams,
  isHighIntentCtaLabel,
  isHighIntentPath,
  sanitizeLabel,
  trackBookDemoClick,
  trackConversionEvent,
} from '../lib/conversionTracking';
import { isAuthEntryRoute, isProtectedAppRoute, normalizePathname, shouldShowPublicSupportWidgets } from '../utils/publicRouteGuards';
const FloatingAssistant = lazy(() => import('../components/common/FloatingAssistant'));
const routeLoaderFallback = <div className="px-6 py-10 text-sm text-gray-600">Loading…</div>;

const isNativeCapacitorRuntime = () => {
  if (typeof window === 'undefined') return false;

  const cap = (window as any).Capacitor;
  if (cap && typeof cap.isNativePlatform === 'function') {
    try {
      return Boolean(cap.isNativePlatform());
    } catch {
      // Ignore runtime bridge errors and fall back to protocol checks.
    }
  }

  const protocol = window.location.protocol;
  return protocol === 'capacitor:' || protocol === 'ionic:';
};

const rootLandingElement = isNativeCapacitorRuntime()
  ? <Navigate to="/login" replace />
  : <HomePage />;

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

const withRoleGate = (allowedRoles: Role[], loginPath: string) => (
  <Suspense fallback={routeLoaderFallback}>
    <RoleGate
      allowedRoles={allowedRoles}
      loginPath={loginPath}
    />
  </Suspense>
);

const teacherRouteChildren: RouteObject[] = [
  { index: true, element: <TeacherDashboard /> },
  { path: 'demo-assignments', element: <Navigate to="/teacher?tab=demo-assignments" replace /> },
  { path: 'lessons', element: <Navigate to="/teacher?tab=lessons" replace /> },
  {
    path: 'students/:kidId/topic-progress',
    element: <TeacherStudentTopicProgressPage />,
  },
];

const devOnlyRoutes: RouteObject[] = import.meta.env.DEV
  ? [
      { path: 'dev/seed-test', element: <div style={{ padding: 20 }}>Dev route working — seed-test</div> },
      { path: 'debug-lessons', element: <DebugLessonLibrary /> },
      { path: 'teacher/lessons-test', element: <LessonLibraryPage /> },
    ]
  : [];

const Layout: FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const normalizedPath = normalizePathname(location.pathname);
  const isNativeRuntime = isNativeCapacitorRuntime();
  const hideNativeAuthChrome = isNativeRuntime && isAuthEntryRoute(normalizedPath);
  const hideMarketingChrome = isProtectedAppRoute(normalizedPath) || hideNativeAuthChrome;
  const hideSupportWidgets = !shouldShowPublicSupportWidgets(normalizedPath) || hideNativeAuthChrome;
  const isContactPage = normalizedPath === '/contact';
  const [isAssessmentModalOpen, setIsAssessmentModalOpen] = useState(false);
  const [showDeferredChrome, setShowDeferredChrome] = useState(false);
  const [showDeferredSupportWidgets, setShowDeferredSupportWidgets] = useState(false);

  useEffect(() => {
    if (hideMarketingChrome || normalizedPath === '/book-demo') {
      setIsAssessmentModalOpen(false);
      return;
    }

    const params = new URLSearchParams(location.search);
    if (params.get('book') === '1') {
      setIsAssessmentModalOpen(true);
    }
  }, [hideMarketingChrome, location.search, normalizedPath]);

  useEffect(() => {
    if (hideMarketingChrome) {
      setShowDeferredChrome(false);
      return;
    }

    const activate = () => setShowDeferredChrome(true);
    const isMobileViewport = window.matchMedia('(max-width: 767px)').matches;
    const fallbackDelayMs = isMobileViewport ? 4800 : 2200;
    let timeoutId: number | undefined;

    const onFirstInteraction = () => {
      activate();
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
      window.removeEventListener('scroll', onFirstInteraction);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    window.addEventListener('pointerdown', onFirstInteraction, { passive: true, once: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });
    window.addEventListener('touchstart', onFirstInteraction, { passive: true, once: true });
    window.addEventListener('scroll', onFirstInteraction, { passive: true, once: true });
    timeoutId = window.setTimeout(onFirstInteraction, fallbackDelayMs);

    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
      window.removeEventListener('scroll', onFirstInteraction);

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [hideMarketingChrome]);

  useEffect(() => {
    if (hideMarketingChrome || hideSupportWidgets) {
      setShowDeferredSupportWidgets(false);
      return;
    }

    const activate = () => setShowDeferredSupportWidgets(true);
    const isDesktopViewport = window.matchMedia('(min-width: 768px)').matches;
    const fallbackDelayMs = isDesktopViewport ? 9000 : 12000;
    const connection = (navigator as any)?.connection;
    const effectiveType =
      typeof connection?.effectiveType === 'string' ? connection.effectiveType.toLowerCase() : '';
    const isConstrainedNetwork =
      Boolean(connection?.saveData) || effectiveType === 'slow-2g' || effectiveType === '2g';
    let timeoutId: number | undefined;

    const onFirstInteraction = () => {
      activate();
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
      window.removeEventListener('scroll', onFirstInteraction);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
        timeoutId = undefined;
      }
    };

    window.addEventListener('pointerdown', onFirstInteraction, { passive: true, once: true });
    window.addEventListener('keydown', onFirstInteraction, { once: true });
    window.addEventListener('touchstart', onFirstInteraction, { passive: true, once: true });
    window.addEventListener('scroll', onFirstInteraction, { passive: true, once: true });
    if (!isConstrainedNetwork) {
      timeoutId = window.setTimeout(onFirstInteraction, fallbackDelayMs);
    }

    return () => {
      window.removeEventListener('pointerdown', onFirstInteraction);
      window.removeEventListener('keydown', onFirstInteraction);
      window.removeEventListener('touchstart', onFirstInteraction);
      window.removeEventListener('scroll', onFirstInteraction);
      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [hideMarketingChrome, hideSupportWidgets]);

  const closeAssessmentModal = useCallback(() => {
    setIsAssessmentModalOpen(false);
    const params = new URLSearchParams(location.search);
    if (params.get('book') === '1') {
      params.delete('book');
      navigate(
        {
          pathname: location.pathname,
          search: params.toString() ? `?${params.toString()}` : '',
        },
        { replace: true }
      );
    }
  }, [location.pathname, location.search, navigate]);

  const handlePublicBookingIntercept = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (hideMarketingChrome || normalizedPath === '/book-demo') return;

      const target = event.target;
      if (!(target instanceof HTMLElement)) return;

      const node = target.closest('a,button') as HTMLElement | null;
      if (!node) return;
      if (node.getAttribute('data-no-booking-intercept') === '1') return;
      if (node.closest('[data-floating-assistant="1"]')) return;
      if (node.closest('form')) return;

      const label = sanitizeLabel(node.getAttribute('data-cta-label') || node.getAttribute('aria-label') || node.textContent || '');
      const href = node instanceof HTMLAnchorElement ? (node.getAttribute('href') || '') : '';
      const normalizedHref = href.toLowerCase();

      const bookingByHref =
        normalizedHref.includes('/book-demo') ||
        normalizedHref.includes('book=1') ||
        normalizedHref.includes('#book-assessment');
      const bookingByLabel = /book\s*(free\s*)?(assessment|demo)|book assessment|book demo|get in touch/i.test(label);

      if (!bookingByHref && !bookingByLabel) return;

      event.preventDefault();
      event.stopPropagation();

      if (!href && bookingByLabel) {
        const baseParams = buildBaseConversionParams(location.pathname);

        trackBookDemoClick(label || 'book_assessment');

        if (isHighIntentPath(location.pathname) && isHighIntentCtaLabel(label || '')) {
          trackConversionEvent('high_intent_page_cta_click', {
            ...baseParams,
            cta_label: label || 'Book assessment',
            destination_path: '/book-demo',
          });
        }
      }

      setIsAssessmentModalOpen(true);

      const params = new URLSearchParams(location.search);
      if (params.get('book') !== '1') {
        params.set('book', '1');
        navigate(
          {
            pathname: location.pathname,
            search: `?${params.toString()}`,
          },
          { replace: true }
        );
      }
    },
    [hideMarketingChrome, location.pathname, location.search, navigate, normalizedPath]
  );

  return (
    <div
      onClickCapture={handlePublicBookingIntercept}
      className={`min-h-screen ${isContactPage ? 'bg-[#060a16]' : 'bg-[radial-gradient(circle_at_top,_#fdf4ff,_#f4f8ff_45%,_#ffffff_80%)]'}`}
    >
      {!hideMarketingChrome ? (
        <Suspense fallback={null}>
          <AnalyticsTracker />
          {showDeferredChrome ? <ConversionTracker /> : null}
        </Suspense>
      ) : null}
      <ScrollToTop />
      {!hideMarketingChrome ? <Header /> : null}
      <main
        className={
          isContactPage
            ? `${hideMarketingChrome ? '' : 'pt-0'} pb-0 min-h-0`
            : `min-h-screen pb-16 ${hideMarketingChrome ? '' : 'pt-8 md:pt-12 lg:pt-16'}`
        }
      >
        <Suspense fallback={routeLoaderFallback}>
          <Outlet />
        </Suspense>
      </main>
      {!hideMarketingChrome && showDeferredChrome ? (
        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      ) : null}
      {!hideSupportWidgets && showDeferredSupportWidgets ? (
        <Suspense fallback={null}>
          <FloatingAssistant />
          <BackToTopButton />
        </Suspense>
      ) : null}
      {!hideMarketingChrome && normalizedPath !== '/book-demo' && isAssessmentModalOpen ? (
        <Suspense fallback={null}>
          <AssessmentRequestModal isOpen={isAssessmentModalOpen} onClose={closeAssessmentModal} />
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
        { index: true, element: rootLandingElement },
        { path: 'blog', element: <BlogPage /> },
        { path: 'blog/phonics-for-parents-guide', element: <PhonicsForParentsResearchPage /> },
        { path: 'blog/week-1-phonics-satpin-launch', element: <Week1SatpinLaunchPage /> },
        { path: 'blog/week-7-grammar-nouns-to-paragraphs', element: <Week7GrammarNounsToParagraphsPage /> },
        { path: 'blog/week-12-speaking-confidence-seeds', element: <Week12SpeakingConfidenceSeedsPage /> },
        { path: 'blog/what-is-jolly-phonics-and-is-it-the-best-way-to-teach-reading', element: <WhatIsJollyPhonicsBestWayPage /> },
        { path: 'blog/:slug', element: <BlogPostPage /> },
        { path: 'pricing', element: <PricingPage /> },
        { path: 'sitemap', element: <SitemapPage /> },
        { path: 'contact', element: <ContactPage /> },
        { path: 'why-tiny-steps', element: <WhyTinyStepsPage /> },
        { path: 'learning-partner', element: <LearningPartnerPage /> },
        { path: 'team', element: <TeamPage /> },
        { path: 'class-samples', element: <ClassSamplesPage /> },
        { path: 'testimonials', element: <TestimonialsPage /> },
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
        { path: 'main/courses/grammar', element: <Navigate to="/grammar" replace /> },
        { path: 'main/courses/grammar/', element: <Navigate to="/grammar" replace /> },
        { path: 'main/courses/public-speaking', element: <Navigate to="/speaking" replace /> },
        { path: 'main/courses/public-speaking/', element: <Navigate to="/speaking" replace /> },
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
        { path: 'english-grammar-writing-classes/', element: <EnglishGrammarWritingClassesPage /> },
        { path: 'public-speaking-communication-kids', element: <PublicSpeakingCommunicationKidsPage /> },
        { path: 'public-speaking-communication-kids/', element: <PublicSpeakingCommunicationKidsPage /> },
        { path: 'best-online-phonics-classes-india', element: <BestOnlinePhonicsClassesIndiaPage /> },
        { path: 'phonics-apps-for-preschoolers-india', element: <PhonicsAppsPreschoolersIndiaPage /> },
        { path: 'phonics-games-for-preschoolers', element: <PhonicsGamesPreschoolersPage /> },
        { path: 'phonics-learning-games', element: <LearningGamesMarketingPage /> },
        { path: 'reading-classes-for-kids', element: <ReadingClassesForKidsPage /> },
        { path: 'spoken-english-classes-for-kids', element: <SpokenEnglishClassesForKidsPage /> },
        { path: 'writing-classes-for-kids', element: <WritingClassesForKidsPage /> },
        { path: 'phonics-fees-india', element: <PhonicsFeesIndiaPage /> },
        { path: 'online-english-classes-for-kids-india', element: <OnlineEnglishClassesForKidsIndiaPage /> },
        { path: 'english-classes-for-4-year-old', element: <EnglishClassesFor4YearOldPage /> },
        { path: 'english-classes-for-5-year-old', element: <EnglishClassesFor5YearOldPage /> },
        { path: 'english-classes-for-6-year-old', element: <EnglishClassesFor6YearOldPage /> },
        { path: 'english-classes-for-7-10-year-old', element: <EnglishClassesFor7To10YearOldPage /> },
        { path: 'child-not-reading-properly', element: <ChildNotReadingProperlyPage /> },
        { path: 'slow-reader-child-help', element: <SlowReaderChildHelpPage /> },
        { path: 'shy-child-speaking-confidence', element: <ShyChildSpeakingConfidencePage /> },
        { path: 'reading-fluency-program', element: <ReadingFluencyProgramPage /> },
        { path: 'confidence-building-program-kids', element: <ConfidenceBuildingProgramKidsPage /> },
        { path: 'english-foundation-program', element: <EnglishFoundationProgramPage /> },
        { path: 'summer-camp-for-kids-india', element: <SummerCampForKidsIndiaPage /> },
        { path: 'summer-reading-program-kids', element: <SummerReadingProgramKidsPage /> },
        { path: 'summer-speaking-camp-kids', element: <SummerSpeakingCampKidsPage /> },
        { path: 'summer-camps', element: <SummerCampsPage /> },
        { path: 'summer-camps/:programSlug/:batchSlug', element: <SummerCampProgramPage /> },
        { path: 'summer-camps/:programSlug', element: <SummerCampProgramPage /> },
        { path: 'phonics-classes-for-kids', element: <PhonicsClassesForKidsPage /> },
        { path: 'phonics-classes-for-kids/', element: <PhonicsClassesForKidsPage /> },
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

        { path: 'kid/login', element: <Navigate to="/login" replace /> },
        { path: 'unauthorized', element: <UnauthorizedPage /> },

        ...devOnlyRoutes,
        // Canonicalize legacy child entry paths to English Excellence Mission
        { path: '/kids', loader: missionShellRedirectLoader },
        { path: '/kids/games', loader: missionShellRedirectLoader },

        // ---------- Admin area – ONLY under /surya ----------
        {
          path: 'surya',
          element: withRoleGate(['admin'], '/surya/login'),
          children: [
            { index: true, element: <AdminDashboard /> },
            { path: 'analytics', element: <AdminDashboard /> },
            { path: 'leads', element: <Navigate to="/surya?tab=leads" replace /> },
            { path: 'class-samples', element: <Navigate to="/surya?tab=class-samples" replace /> },
            { path: 'testimonials', element: <Navigate to="/surya?tab=testimonials" replace /> },
          ],
        },
        { path: 'admin', element: <Navigate to="/surya/login" replace /> },
        { path: 'Surya', element: <Navigate to="/surya" replace /> },

        // ---------- Internal messaging ----------
        {
          path: 'messages',
          element: withRoleGate(['admin', 'teacher', 'parent', 'learningPartner'], '/login'),
          children: [
            { index: true, element: <MessagesPage /> },
            { path: ':threadId', element: <MessagesPage /> },
          ],
        },

        // ---------- Teacher dashboard ----------
        {
          path: 'teacher',
          element: withRoleGate(['teacher'], '/login'),
          children: teacherRouteChildren,
        },
        // Teacher routes with :teacherId param (supports sidebar links)
        {
          path: 'teacher/:teacherId',
          element: withRoleGate(['teacher'], '/login'),
          children: teacherRouteChildren,
        },
        // Legacy public /teachers URL should resolve to the canonical team page
        { path: 'teachers', element: <Navigate to="/team" replace /> },

        // ---------- Parent dashboard + payments ----------
        {
          path: 'parent',
          element: withRoleGate(['parent'], '/login'),
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
          element: withRoleGate(['kid', 'parent'], '/login'),
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
          element: withRoleGate(['learningPartner'], '/login'),
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
