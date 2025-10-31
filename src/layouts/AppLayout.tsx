import { Outlet, useLocation } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppWidget from "../components/WhatsAppWidget";

export default function AppLayout() {
  const location = useLocation();
  const widgetHiddenRoutes = ["/roles/teacher", "/roles/rm", "/roles/learning-manager"];
  const hideWidget = widgetHiddenRoutes.some((path) => location.pathname.startsWith(path));

  return (
    <div className="bg-white min-h-screen flex flex-col">
      <Header />
      <main className="flex-1">
        <Outlet />
      </main>
      <Footer />
      {!hideWidget && <WhatsAppWidget />}
    </div>
  );
}
