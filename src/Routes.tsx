import { Routes, Route, Navigate } from "react-router-dom";
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
import KidsGuestLanding from "./pages/KidsGuestLanding";
import SpellbeeGrade1Game from "./pages/games/SpellbeeGrade1";

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
        <Route path="/kids" element={<KidsGuestLanding />} />
        <Route path="/parents" element={<Navigate to="/guest/parents" replace />} />
        <Route path="/curriculum" element={<Curriculum />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/faq" element={<FAQ />} />
        <Route path="/games/spellbee-grade1" element={<SpellbeeGrade1Game />} />
        <Route path="/games/spellbee-grade1/" element={<SpellbeeGrade1Game />} />
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
