import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import AttendanceWidget from '@/components/dashboard/AttendanceWidget';
import LeaveBalanceWidget from '@/components/dashboard/LeaveBalanceWidget';
import RecentActivityWidget from '@/components/dashboard/RecentActivityWidget';
import UpcomingTasksWidget from '@/components/dashboard/UpcomingTasksWidget';
import QuickActionsWidget from '@/components/dashboard/QuickActionsWidget';
import { Users, Calendar, Clock, Wallet, TrendingUp, CheckCircle } from 'lucide-react';

const Dashboard = () => {
  const { user } = useAuth();

  const adminStats = [
    { title: 'Total Employees', value: 156, icon: Users, variant: 'primary' as const },
    { title: 'Present Today', value: 142, icon: CheckCircle, variant: 'success' as const, trend: { value: 5, isPositive: true } },
    { title: 'On Leave', value: 8, icon: Calendar, variant: 'warning' as const },
    { title: 'Pending Requests', value: 12, icon: Clock, variant: 'danger' as const },
  ];

  const employeeStats = [
    { title: 'Present Days', value: 22, subtitle: 'This month', icon: CheckCircle, variant: 'success' as const },
    { title: 'Leave Balance', value: 8, subtitle: 'Days remaining', icon: Calendar, variant: 'primary' as const },
    { title: 'Tasks Completed', value: 15, subtitle: 'This month', icon: TrendingUp, variant: 'success' as const },
    { title: 'Net Salary', value: '₹45,000', subtitle: 'Last month', icon: Wallet, variant: 'primary' as const },
  ];

  const stats = user?.role === 'admin' || user?.role === 'manager' ? adminStats : employeeStats;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, index) => (
            <StatCard key={index} {...stat} />
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - 2 cols */}
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AttendanceWidget />
              <LeaveBalanceWidget />
            </div>
            <UpcomingTasksWidget />
          </div>

          {/* Right Column - 1 col */}
          <div className="space-y-6">
            <QuickActionsWidget />
            <RecentActivityWidget />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Dashboard;
