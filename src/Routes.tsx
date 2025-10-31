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
import Parents from "./pages/Parents";
import TeacherPortal from "./pages/roles/TeacherPortal";
import LearningManagerPortal from "./pages/roles/LearningManagerPortal";
import BlogIndex from "./pages/blog/BlogIndex";
import BlogArticle from "./pages/blog/BlogArticle";

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
        <Route path="/parents" element={<Parents />} />
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

        {/* Back-compat if you had /main/courses/... */}
        <Route path="/main/courses" element={<Navigate to="/courses" replace />} />
        <Route path="/main/courses/phonics" element={<Navigate to="/courses/phonics" replace />} />
        <Route path="/main/courses/grammar" element={<Navigate to="/courses/grammar" replace />} />
        <Route path="/main/courses/public-speaking" element={<Navigate to="/courses/public-speaking" replace />} />
      </Route>
    </Routes>
  );
}
