import { Routes, Route, Navigate } from "react-router-dom";
import { lazy, Suspense } from "react";
import AppLayout from "./layouts/AppLayout";
import Home from "./pages/Home";
import AllCourses from "./pages/courses/All";
import Phonics from "./pages/courses/Phonics";
import Grammar from "./pages/courses/Grammar";
import PublicSpeaking from "./pages/courses/PublicSpeaking";
import Pricing from "./pages/Pricing";
import Curriculum from "./pages/Curriculum";
import FAQ from "./pages/FAQ";
import RoleLoginPage from "./pages/auth/RoleLogin";
import GuestPortalPage from "./pages/auth/GuestPortal";
import TeacherPortal from "./pages/roles/TeacherPortal";
import LearningManagerPortal from "./pages/roles/LearningManagerPortal";
import KidsPortal from "./pages/roles/KidsPortal";
import BlogIndex from "./pages/blog/BlogIndex";
import BlogArticle from "./pages/blog/BlogArticle";
import GamesGallery from "./pages/games/GamesGallery";
import KidsGuestLanding from "./pages/KidsGuestLanding";

const SpellBeeFlashTrainer = lazy(() => import("./games/spellbee-flash"));
const SpellBeeGroupDashboard = lazy(() => import("./games/spellbee-flash/GroupDashboard"));
const MeaningMatchGame = lazy(() => import("./games/meaning-match"));
const MeaningMatchDashboard = lazy(() => import("./games/meaning-match/Dashboard"));
const BalloonPopGame = lazy(() => import("./games/balloon-pop"));
const BalloonPopDashboard = lazy(() => import("./games/balloon-pop/Dashboard"));
const BalloonPopIPAGame = lazy(() => import("./games/balloon-pop-ipa/BalloonPopIPA"));
const QuickMeaningGame = lazy(() => import("./games/quick-meaning-quiz"));
const QuickMeaningDashboard = lazy(() => import("./games/quick-meaning-quiz/Dashboard"));
const BossLevelGame = lazy(() => import("./games/boss-level"));

export default function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Home */}
        <Route path="/" element={<Home />} />

        {/* Courses */}
        <Route path="/courses" element={<AllCourses />} />
        <Route path="/courses/phonics" element={<Phonics />} />
        <Route path="/courses/grammar" element={<Grammar />} />
        <Route path="/courses/public-speaking" element={<PublicSpeaking />} />

        {/* Extras */}
        {/* Kids Zone Routes */}
        <Route path="/kids" element={<KidsGuestLanding />} />
        <Route path="/kids/games" element={<GamesGallery />} />
        <Route path="/games" element={<GamesGallery />} />
        <Route 
          path="/games/balloon-pop-ipa" 
          element={
            <Suspense fallback={<div className="p-6">Loading game…</div>}>
              <BalloonPopIPAGame />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/spellbee-flash" 
          element={
            <Suspense fallback={<div className="p-6">Loading game…</div>}>
              <SpellBeeFlashTrainer />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/spellbee-flash/dashboard" 
          element={
            <Suspense fallback={<div className="p-6">Loading dashboard…</div>}>
              <SpellBeeGroupDashboard />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/meaning-match" 
          element={
            <Suspense fallback={<div className="p-6">Loading game…</div>}>
              <MeaningMatchGame />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/meaning-match/dashboard" 
          element={
            <Suspense fallback={<div className="p-6">Loading dashboard…</div>}>
              <MeaningMatchDashboard />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/balloon-pop" 
          element={
            <Suspense fallback={<div className="p-6">Loading game…</div>}>
              <BalloonPopGame />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/balloon-pop/dashboard" 
          element={
            <Suspense fallback={<div className="p-6">Loading dashboard…</div>}>
              <BalloonPopDashboard />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/balloon-pop-ipa" 
          element={
            <Suspense fallback={<div className="p-6">Loading game…</div>}>
              <BalloonPopIPAGame />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/quick-meaning" 
          element={
            <Suspense fallback={<div className="p-6">Loading game…</div>}>
              <QuickMeaningGame />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/quick-meaning/dashboard" 
          element={
            <Suspense fallback={<div className="p-6">Loading…</div>}>
              <QuickMeaningDashboard />
            </Suspense>
          } 
        />
        <Route 
          path="/kids/games/boss-level" 
          element={
            <Suspense fallback={<div className="p-6">Loading game…</div>}>
              <BossLevelGame />
            </Suspense>
          } 
        />
        <Route path="/parents" element={<Navigate to="/guest/parents" replace />} />
        <Route path="/curriculum" element={<Curriculum />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/blog" element={<BlogIndex />} />
        <Route path="/blog/:slug" element={<BlogArticle />} />
        <Route path="/blog/:slug/" element={<BlogArticle />} />

        {/* Roles */}
        <Route path="/roles/teacher" element={<TeacherPortal />} />
        <Route path="/roles/teacher/" element={<TeacherPortal />} />
        <Route path="/roles/rm" element={<LearningManagerPortal />} />
        <Route path="/roles/rm/" element={<LearningManagerPortal />} />
        <Route path="/roles/learning-manager" element={<LearningManagerPortal />} />
        <Route path="/roles/learning-manager/" element={<LearningManagerPortal />} />
        <Route path="/roles/kids" element={<KidsPortal />} />
        <Route path="/roles/kids/" element={<KidsPortal />} />

        {/* Auth */}
        <Route path="/login" element={<Navigate to="/login/parents" replace />} />
        <Route path="/login/:role" element={<RoleLoginPage />} />
        <Route path="/guest" element={<Navigate to="/guest/parents" replace />} />
        <Route path="/guest/:role" element={<GuestPortalPage />} />

        {/* Back-compat if you had /main/courses/... */}
        <Route path="/main/courses" element={<Navigate to="/courses" replace />} />
        <Route path="/main/courses/phonics" element={<Navigate to="/courses/phonics" replace />} />
        <Route path="/main/courses/grammar" element={<Navigate to="/courses/grammar" replace />} />
        <Route path="/main/courses/public-speaking" element={<Navigate to="/courses/public-speaking" replace />} />
      </Route>
    </Routes>
  );
}
