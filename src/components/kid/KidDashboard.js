import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { motion } from 'framer-motion';
import HomeScreen from './Home';
import ProgressView from './Progress';
import AchievementsView from './Achievements';
import ActivitiesView from './Activities';
import KidProfile from './Profile';
const KidDashboard = () => {
    var _a;
    const [activeTab, setActiveTab] = useState('home');
    const tabs = [
        { id: 'home', label: '🏠 Home', component: HomeScreen },
        { id: 'progress', label: '📈 Progress', component: ProgressView },
        { id: 'achievements', label: '🏆 Achievements', component: AchievementsView },
        { id: 'activities', label: '📚 Activities', component: ActivitiesView },
        { id: 'profile', label: '👤 Profile', component: KidProfile },
    ];
    const ActiveComponent = ((_a = tabs.find(tab => tab.id === activeTab)) === null || _a === void 0 ? void 0 : _a.component) || HomeScreen;
    return (_jsxs("div", { className: "min-h-screen bg-gradient-to-br from-pink-200 via-purple-200 to-indigo-200", children: [_jsx("div", { className: "pb-20", children: _jsx(motion.div, { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, children: _jsx(ActiveComponent, {}) }, activeTab) }), _jsx("div", { className: "fixed bottom-0 left-0 right-0 bg-white shadow-lg rounded-t-3xl p-4", children: _jsx("div", { className: "flex justify-around", children: tabs.map((tab) => (_jsx("button", { onClick: () => setActiveTab(tab.id), className: `text-2xl p-3 rounded-full transition-all duration-300 ${activeTab === tab.id
                            ? 'bg-blue-500 text-white scale-110 shadow-lg'
                            : 'text-gray-600 hover:bg-gray-100'}`, children: tab.label }, tab.id))) }) })] }));
};
export default KidDashboard;
