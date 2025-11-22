import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
// React default import removed
import DashboardOverview from '../../components/lp/DashboardOverview';
import ParentsManagement from '../../components/lp/ParentsManagement';
import TeachersManagement from '../../components/lp/TeachersManagement';
const LearningPartnerDashboard = () => {
    return (_jsxs("div", { className: "p-6", children: [_jsx("h1", { className: "text-2xl font-bold mb-4", children: "Learning Partner Dashboard" }), _jsx(DashboardOverview, {}), _jsx(ParentsManagement, {}), _jsx(TeachersManagement, {})] }));
};
export default LearningPartnerDashboard;
