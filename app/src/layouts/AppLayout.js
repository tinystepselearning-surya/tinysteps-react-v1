import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Outlet, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";
import WhatsAppWidget from "../components/WhatsAppWidget";
import BackToTop from "../components/BackToTop";
export default function AppLayout() {
    const location = useLocation();
    const dashboardRoutes = ["/roles/teacher", "/roles/rm", "/roles/learning-manager", "/roles/kids"];
    const isDashboardRoute = dashboardRoutes.some((path) => location.pathname.startsWith(path));
    const widgetHiddenRoutes = [...dashboardRoutes, "/kids"];
    const hideWidget = widgetHiddenRoutes.some((path) => location.pathname.startsWith(path));
    useEffect(() => {
        window.scrollTo({ top: 0, behavior: "auto" });
    }, [location.pathname, location.search, location.hash]);
    return (_jsxs("div", { className: `min-h-screen flex flex-col ${isDashboardRoute ? "bg-[#f4f7fb]" : "bg-white"}`, children: [!isDashboardRoute && _jsx(Header, {}), _jsx("main", { className: "flex-1", children: _jsx(Outlet, {}) }), !isDashboardRoute && _jsx(Footer, {}), !hideWidget && !isDashboardRoute && _jsx(WhatsAppWidget, {}), _jsx(BackToTop, {})] }));
}
//# sourceMappingURL=AppLayout.js.map