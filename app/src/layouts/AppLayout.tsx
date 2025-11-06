import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackToTop from "../components/BackToTop";

export default function AppLayout() {
  const location = useLocation();
  const dashboardRoutes = ["/roles/teacher", "/roles/rm", "/roles/learning-manager", "/roles/kids"];
  const gameRoutes = ["/kids/games/balloon-pop", "/kids/games/spellbee-flash", "/kids/games/meaning-match", "/kids/games/quick-meaning", "/kids/games/boss-level"];
  const isDashboardRoute = dashboardRoutes.some((path) => location.pathname.startsWith(path));
  const isGameRoute = gameRoutes.some((path) => location.pathname.startsWith(path));

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [location.pathname, location.search, location.hash]);

  return (
    <div className={`min-h-screen flex flex-col ${isDashboardRoute ? "bg-[#f4f7fb]" : "bg-white"}`}>
      {!isDashboardRoute && !isGameRoute && <Header />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!isDashboardRoute && !isGameRoute && <Footer />}
      <BackToTop />
    </div>
  );
}
