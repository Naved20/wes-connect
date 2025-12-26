import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import StatCard from '@/components/dashboard/StatCard';
import AttendanceWidget from '@/components/dashboard/AttendanceWidget';
import LeaveBalanceWidget from '@/components/dashboard/LeaveBalanceWidget';
import RecentActivityWidget from '@/components/dashboard/RecentActivityWidget';
import UpcomingTasksWidget from '@/components/dashboard/UpcomingTasksWidget';
import QuickActionsWidget from '@/components/dashboard/QuickActionsWidget';
import { Users, Calendar, Clock, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

const Dashboard = () => {
  const { user } = useAuth();
  const isAdminOrManager = user?.role === 'admin' || user?.role === 'manager';

  // Fetch employee data for current user
  const { data: employeeData } = useQuery({
    queryKey: ['employee-self-dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !isAdminOrManager,
  });

  // Admin/Manager stats
  const { data: adminStats } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: async () => {
      const today = format(new Date(), 'yyyy-MM-dd');
      
      const [employeesRes, attendanceRes, leavesRes, pendingRes] = await Promise.all([
        supabase.from('employees').select('id', { count: 'exact' }),
        supabase.from('attendance').select('id', { count: 'exact' }).eq('date', today).eq('status', 'present'),
        supabase.from('leaves').select('id', { count: 'exact' }).eq('status', 'approved').gte('start_date', today).lte('end_date', today),
        supabase.from('attendance').select('id', { count: 'exact' }).eq('status', 'pending'),
      ]);
      
      return {
        totalEmployees: employeesRes.count || 0,
        presentToday: attendanceRes.count || 0,
        onLeave: leavesRes.count || 0,
        pendingRequests: pendingRes.count || 0,
      };
    },
    enabled: isAdminOrManager,
  });

  // Employee stats
  const { data: employeeStats } = useQuery({
    queryKey: ['employee-dashboard-stats', employeeData?.id],
    queryFn: async () => {
      if (!employeeData?.id) return null;
      
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const [attendanceRes, leaveBalanceRes, tasksRes, salaryRes] = await Promise.all([
        supabase.from('attendance')
          .select('id', { count: 'exact' })
          .eq('employee_id', employeeData.id)
          .eq('status', 'present')
          .gte('date', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`),
        supabase.from('leave_balances')
          .select('total_allowed, used')
          .eq('employee_id', employeeData.id)
          .eq('month', currentMonth)
          .eq('year', currentYear)
          .maybeSingle(),
        supabase.from('tasks')
          .select('id', { count: 'exact' })
          .eq('assigned_to', employeeData.id)
          .eq('status', 'completed')
          .gte('completed_at', `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`),
        supabase.from('salary')
          .select('net_salary')
          .eq('employee_id', employeeData.id)
          .order('year', { ascending: false })
          .order('month', { ascending: false })
          .limit(1)
          .maybeSingle(),
      ]);
      
      const leaveBalance = leaveBalanceRes.data;
      return {
        presentDays: attendanceRes.count || 0,
        leaveBalance: leaveBalance ? leaveBalance.total_allowed - leaveBalance.used : 2,
        tasksCompleted: tasksRes.count || 0,
        netSalary: salaryRes.data?.net_salary || 0,
      };
    },
    enabled: !!employeeData?.id,
  });

  const getAdminStatCards = () => [
    { title: 'Total Employees', value: adminStats?.totalEmployees || 0, icon: Users, variant: 'primary' as const },
    { title: 'Present Today', value: adminStats?.presentToday || 0, icon: CheckCircle, variant: 'success' as const },
    { title: 'On Leave', value: adminStats?.onLeave || 0, icon: Calendar, variant: 'warning' as const },
    { title: 'Pending Requests', value: adminStats?.pendingRequests || 0, icon: Clock, variant: 'danger' as const },
  ];

  const getEmployeeStatCards = () => [
    { title: 'Present Days', value: employeeStats?.presentDays || 0, subtitle: 'This month', icon: CheckCircle, variant: 'success' as const },
    { title: 'Leave Balance', value: employeeStats?.leaveBalance || 0, subtitle: 'Days remaining', icon: Calendar, variant: 'primary' as const },
    { title: 'Tasks Completed', value: employeeStats?.tasksCompleted || 0, subtitle: 'This month', icon: Clock, variant: 'success' as const },
    { title: 'Net Salary', value: employeeStats?.netSalary ? `₹${employeeStats.netSalary.toLocaleString()}` : '-', subtitle: 'Last month', icon: Users, variant: 'primary' as const },
  ];

  const stats = isAdminOrManager ? getAdminStatCards() : getEmployeeStatCards();

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
