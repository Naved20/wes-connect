import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';

const LeaveBalanceWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get employee ID
  const { data: employeeData } = useQuery({
    queryKey: ['employee-self-leave-widget'],
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

  // Fetch leave balance
  const { data: leaveBalance } = useQuery({
    queryKey: ['leave-balance-widget', employeeData?.id],
    queryFn: async () => {
      if (!employeeData?.id) return null;
      
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      
      const { data, error } = await supabase
        .from('leave_balances')
        .select('*')
        .eq('employee_id', employeeData.id)
        .eq('month', currentMonth)
        .eq('year', currentYear)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeData?.id,
  });

  // Fetch pending leave requests
  const { data: pendingLeaves = [] } = useQuery({
    queryKey: ['pending-leaves-widget', employeeData?.id],
    queryFn: async () => {
      if (!employeeData?.id) return [];
      
      const { data, error } = await supabase
        .from('leaves')
        .select('id')
        .eq('employee_id', employeeData.id)
        .eq('status', 'pending');
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeData?.id,
  });

  const totalAllowed = leaveBalance?.total_allowed || 2;
  const used = leaveBalance?.used || 0;
  const remaining = totalAllowed - used;

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Leave Balance</CardTitle>
          <Button variant="outline" size="sm" onClick={() => navigate('/leaves')}>
            <CalendarPlus className="h-4 w-4 mr-2" />
            Apply
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium text-foreground">Monthly Paid Leave</span>
            <span className="text-muted-foreground">
              {remaining} / {totalAllowed} days left
            </span>
          </div>
          <Progress
            value={(used / totalAllowed) * 100}
            className="h-2"
          />
          <p className="text-xs text-muted-foreground">
            2 paid leaves allowed per month
          </p>
        </div>

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pending Requests</span>
            <span className="text-lg font-bold text-chart-4">{pendingLeaves.length}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveBalanceWidget;
