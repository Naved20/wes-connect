import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, Clock, FileText, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';

const RecentActivityWidget = () => {
  const { user } = useAuth();

  // Get employee ID
  const { data: employeeData } = useQuery({
    queryKey: ['employee-self-activity'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch recent attendance
  const { data: recentAttendance = [] } = useQuery({
    queryKey: ['recent-attendance-activity', employeeData?.id],
    queryFn: async () => {
      if (!employeeData?.id) return [];
      
      const { data, error } = await supabase
        .from('attendance')
        .select('created_at, status')
        .eq('employee_id', employeeData.id)
        .order('created_at', { ascending: false })
        .limit(2);
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeData?.id,
  });

  // Fetch recent leaves
  const { data: recentLeaves = [] } = useQuery({
    queryKey: ['recent-leaves-activity', employeeData?.id],
    queryFn: async () => {
      if (!employeeData?.id) return [];
      
      const { data, error } = await supabase
        .from('leaves')
        .select('created_at, status, leave_type')
        .eq('employee_id', employeeData.id)
        .order('created_at', { ascending: false })
        .limit(2);
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeData?.id,
  });

  // Combine and sort activities
  const activities = [
    ...recentAttendance.map(a => ({
      id: `att-${a.created_at}`,
      type: 'attendance',
      message: a.status === 'present' ? 'Attendance approved' : a.status === 'pending' ? 'Attendance pending approval' : 'Attendance marked',
      time: a.created_at,
      icon: CheckCircle,
      iconColor: a.status === 'present' ? 'text-chart-1' : 'text-chart-4',
    })),
    ...recentLeaves.map(l => ({
      id: `leave-${l.created_at}`,
      type: 'leave',
      message: `${l.leave_type} request ${l.status}`,
      time: l.created_at,
      icon: FileText,
      iconColor: l.status === 'approved' ? 'text-chart-1' : l.status === 'rejected' ? 'text-destructive' : 'text-primary',
    })),
  ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 4);

  if (activities.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-muted">
                <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-2">
                  {activity.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {formatDistanceToNow(new Date(activity.time), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivityWidget;
