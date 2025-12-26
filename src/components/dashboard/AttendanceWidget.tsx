import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, AlertCircle, LogIn } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfWeek, addDays } from 'date-fns';
import { useNavigate } from 'react-router-dom';

const AttendanceWidget = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Get employee ID
  const { data: employeeData } = useQuery({
    queryKey: ['employee-self-widget'],
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

  // Fetch today's attendance
  const { data: todayAttendance } = useQuery({
    queryKey: ['attendance-today-widget', employeeData?.id],
    queryFn: async () => {
      if (!employeeData?.id) return null;
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('employee_id', employeeData.id)
        .eq('date', today)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeData?.id,
  });

  // Fetch week's attendance
  const { data: weekAttendance = [] } = useQuery({
    queryKey: ['attendance-week-widget', employeeData?.id],
    queryFn: async () => {
      if (!employeeData?.id) return [];
      
      const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
      const dates = Array.from({ length: 6 }, (_, i) => format(addDays(weekStart, i), 'yyyy-MM-dd'));
      
      const { data, error } = await supabase
        .from('attendance')
        .select('date, status')
        .eq('employee_id', employeeData.id)
        .in('date', dates);
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeData?.id,
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!employeeData?.id) throw new Error('Employee not found');
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const checkInTime = format(new Date(), 'HH:mm:ss');
      
      const { error } = await supabase
        .from('attendance')
        .insert([{
          employee_id: employeeData.id,
          date: today,
          check_in: checkInTime,
          status: 'pending',
        }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today-widget'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-week-widget'] });
      toast({
        title: 'Checked in!',
        description: `Your attendance has been marked at ${currentTime}. Pending approval.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Check-in failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

  const getWeekData = () => {
    return weekDays.map((day, index) => {
      const date = format(addDays(weekStart, index), 'yyyy-MM-dd');
      const record = weekAttendance.find(a => a.date === date);
      return {
        day,
        status: record?.status || 'pending',
      };
    });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-5 w-5 text-chart-1" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'pending':
        return <AlertCircle className="h-5 w-5 text-chart-4" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  const isMarked = !!todayAttendance;
  const canCheckIn = employeeData && !todayAttendance;

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Today's Attendance</CardTitle>
          <Badge variant={todayAttendance?.status === 'present' ? 'default' : 'secondary'}>
            {todayAttendance?.status === 'present' ? 'Approved' : todayAttendance?.status === 'pending' ? 'Pending' : 'Not Marked'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-4">
          <div className="text-4xl font-bold text-foreground mb-2">{currentTime}</div>
          <p className="text-sm text-muted-foreground">Current Time</p>
        </div>

        {canCheckIn ? (
          <Button
            onClick={() => checkInMutation.mutate()}
            disabled={checkInMutation.isPending}
            className="w-full h-12 text-lg"
          >
            {checkInMutation.isPending ? (
              'Marking...'
            ) : (
              <>
                <LogIn className="mr-2 h-5 w-5" />
                Mark Attendance
              </>
            )}
          </Button>
        ) : isMarked ? (
          <div className="flex items-center justify-center gap-2 py-3 bg-chart-1/10 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-chart-1" />
            <span className="font-medium text-chart-1">
              {todayAttendance.status === 'present' ? 'Approved' : 'Pending Approval'}
            </span>
          </div>
        ) : (
          <Button onClick={() => navigate('/attendance')} variant="outline" className="w-full">
            Go to Attendance
          </Button>
        )}

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">This Week</p>
          <div className="grid grid-cols-6 gap-2">
            {getWeekData().map((item, index) => (
              <div
                key={index}
                className="flex flex-col items-center gap-1 p-2 rounded-lg bg-muted/50"
              >
                <span className="text-xs text-muted-foreground">{item.day}</span>
                {getStatusIcon(item.status)}
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AttendanceWidget;
