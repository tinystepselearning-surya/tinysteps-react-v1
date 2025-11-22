// React default import removed
import DashboardOverview from '../../components/lp/DashboardOverview';
import ParentsManagement from '../../components/lp/ParentsManagement';
import TeachersManagement from '../../components/lp/TeachersManagement';

const LearningPartnerDashboard = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Learning Partner Dashboard</h1>
      <DashboardOverview />
      <ParentsManagement />
      <TeachersManagement />
    </div>
  );
};

export default LearningPartnerDashboard;