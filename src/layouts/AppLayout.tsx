import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppWidget from "../components/WhatsAppWidget";

export default function AppLayout() {
  const location = useLocation();
  const bareRoutes = ["/roles/teacher", "/roles/rm", "/roles/learning-manager"];
  const hideSiteChrome = bareRoutes.some((path) => location.pathname.startsWith(path));

  const containerClass = hideSiteChrome ? "min-h-screen flex flex-col" : "bg-white min-h-screen flex flex-col";

  return (
    <div className={containerClass}>
      {!hideSiteChrome && <Header />}
      <main className="flex-1">
        <Outlet />
      </main>
      {!hideSiteChrome && <Footer />}
      {!hideSiteChrome && <WhatsAppWidget />}
    </div>
  );
}
