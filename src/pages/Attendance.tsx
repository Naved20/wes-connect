import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Clock, 
  LogIn, 
  LogOut, 
  CheckCircle2, 
  XCircle, 
  Timer,
  CalendarDays,
  Users,
  AlertCircle
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, startOfMonth, endOfMonth, parseISO } from 'date-fns';

interface AttendanceRecord {
  id: string;
  employee_id: string;
  date: string;
  check_in: string | null;
  check_out: string | null;
  status: string;
  notes: string | null;
  approved_by: string | null;
  approved_at: string | null;
  work_hours: number | null;
  employees?: {
    full_name: string;
    employee_code: string;
    department: string;
  };
}

interface Holiday {
  id: string;
  name: string;
  date: string;
  type: string;
}

const Attendance = () => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canApprove = isAdmin || isManager;

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Get employee ID for current user
  const { data: employeeData } = useQuery({
    queryKey: ['employee-self'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, employee_code, department')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch holidays
  const { data: holidays = [] } = useQuery({
    queryKey: ['holidays', selectedYear],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('holidays')
        .select('*')
        .gte('date', `${selectedYear}-01-01`)
        .lte('date', `${selectedYear}-12-31`);
      
      if (error) throw error;
      return data as Holiday[];
    },
  });

  // Fetch today's attendance for current employee
  const { data: todayAttendance } = useQuery({
    queryKey: ['attendance-today', employeeData?.id],
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
      return data as AttendanceRecord | null;
    },
    enabled: !!employeeData?.id,
  });

  // Fetch all attendance for managers/admins or own attendance for employees
  const { data: attendanceRecords = [], isLoading } = useQuery({
    queryKey: ['attendance-records', selectedMonth, selectedYear, canApprove, employeeData?.id],
    queryFn: async () => {
      const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
      
      let query = supabase
        .from('attendance')
        .select('*, employees(full_name, employee_code, department)')
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date', { ascending: false });
      
      if (!canApprove && employeeData?.id) {
        query = query.eq('employee_id', employeeData.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as AttendanceRecord[];
    },
    enabled: canApprove || !!employeeData?.id,
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async () => {
      if (!employeeData?.id) throw new Error('Employee not found. Please contact admin to link your account.');
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const checkInTime = format(new Date(), 'HH:mm:ss');
      
      const { data, error } = await supabase
        .from('attendance')
        .insert([{
          employee_id: employeeData.id,
          date: today,
          check_in: checkInTime,
          status: 'pending',
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      toast({
        title: 'Checked in!',
        description: `You checked in at ${format(new Date(), 'hh:mm a')}`,
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

  // Check-out mutation
  const checkOutMutation = useMutation({
    mutationFn: async () => {
      if (!todayAttendance?.id) throw new Error('No check-in found');
      
      const checkOutTime = format(new Date(), 'HH:mm:ss');
      
      // Calculate work hours
      const checkInTime = todayAttendance.check_in;
      let workHours = 0;
      if (checkInTime) {
        const checkIn = parseISO(`2000-01-01T${checkInTime}`);
        const checkOut = new Date(`2000-01-01T${checkOutTime}`);
        workHours = (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60);
      }
      
      const { error } = await supabase
        .from('attendance')
        .update({
          check_out: checkOutTime,
          work_hours: Math.round(workHours * 100) / 100,
        })
        .eq('id', todayAttendance.id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance-today'] });
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      toast({
        title: 'Checked out!',
        description: `You checked out at ${format(new Date(), 'hh:mm a')}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Check-out failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Approve/Reject attendance mutation
  const updateAttendanceStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('attendance')
        .update({
          status,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['attendance-records'] });
      toast({
        title: status === 'present' ? 'Attendance approved' : 'Attendance rejected',
        description: `Attendance has been ${status === 'present' ? 'approved' : 'rejected'}.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Update failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'present':
        return 'bg-chart-1/10 text-chart-1 border-chart-1/20';
      case 'absent':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'pending':
        return 'bg-chart-4/10 text-chart-4 border-chart-4/20';
      case 'half_day':
        return 'bg-chart-2/10 text-chart-2 border-chart-2/20';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  // Calculate stats
  const presentCount = attendanceRecords.filter(r => r.status === 'present').length;
  const absentCount = attendanceRecords.filter(r => r.status === 'absent').length;
  const pendingCount = attendanceRecords.filter(r => r.status === 'pending').length;

  const canCheckIn = employeeData && !todayAttendance;
  const canCheckOut = todayAttendance && !todayAttendance.check_out;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
            <p className="text-muted-foreground">Track and manage attendance records</p>
          </div>
          <div className="flex items-center gap-4">
            <Select 
              value={selectedMonth.toString()} 
              onValueChange={(v) => setSelectedMonth(parseInt(v))}
            >
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => (
                  <SelectItem key={i + 1} value={(i + 1).toString()}>
                    {format(new Date(2000, i), 'MMMM')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select 
              value={selectedYear.toString()} 
              onValueChange={(v) => setSelectedYear(parseInt(v))}
            >
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Today's Attendance Card for Employees */}
        {employeeData && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Today's Attendance
              </CardTitle>
              <CardDescription>
                {format(new Date(), 'EEEE, MMMM d, yyyy')} • {format(currentTime, 'hh:mm:ss a')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-primary/10 text-primary text-lg">
                      {employeeData.full_name.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{employeeData.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {employeeData.employee_code} • {employeeData.department}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  {todayAttendance && (
                    <div className="flex items-center gap-6 text-sm">
                      <div className="flex items-center gap-2">
                        <LogIn className="h-4 w-4 text-chart-1" />
                        <span>In: {todayAttendance.check_in || '-'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <LogOut className="h-4 w-4 text-chart-4" />
                        <span>Out: {todayAttendance.check_out || '-'}</span>
                      </div>
                      {todayAttendance.work_hours && (
                        <div className="flex items-center gap-2">
                          <Timer className="h-4 w-4 text-primary" />
                          <span>{todayAttendance.work_hours}h</span>
                        </div>
                      )}
                      <Badge className={getStatusBadgeClass(todayAttendance.status)}>
                        {todayAttendance.status.replace('_', ' ').toUpperCase()}
                      </Badge>
                    </div>
                  )}
                  
                  <div className="flex gap-2">
                    {canCheckIn && (
                      <Button 
                        onClick={() => checkInMutation.mutate()}
                        disabled={checkInMutation.isPending}
                        className="bg-chart-1 hover:bg-chart-1/90"
                      >
                        <LogIn className="h-4 w-4 mr-2" />
                        {checkInMutation.isPending ? 'Checking in...' : 'Check In'}
                      </Button>
                    )}
                    {canCheckOut && (
                      <Button 
                        onClick={() => checkOutMutation.mutate()}
                        disabled={checkOutMutation.isPending}
                        variant="outline"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        {checkOutMutation.isPending ? 'Checking out...' : 'Check Out'}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {!employeeData && !canApprove && (
          <Card className="border-chart-4/20 bg-chart-4/5">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <AlertCircle className="h-5 w-5 text-chart-4" />
                <p className="text-chart-4">
                  Your account is not linked to an employee record. Please contact the administrator.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-chart-1/10">
                  <CheckCircle2 className="h-6 w-6 text-chart-1" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{presentCount}</p>
                  <p className="text-sm text-muted-foreground">Present</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-destructive/10">
                  <XCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{absentCount}</p>
                  <p className="text-sm text-muted-foreground">Absent</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-chart-4/10">
                  <AlertCircle className="h-6 w-6 text-chart-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending Approval</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <CalendarDays className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{holidays.filter(h => {
                    const hDate = parseISO(h.date);
                    return hDate.getMonth() + 1 === selectedMonth;
                  }).length}</p>
                  <p className="text-sm text-muted-foreground">Holidays</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Attendance Records Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Attendance Records
            </CardTitle>
            <CardDescription>
              {canApprove ? 'All attendance records for the selected period' : 'Your attendance records'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    {canApprove && <TableHead>Employee</TableHead>}
                    <TableHead>Date</TableHead>
                    <TableHead>Check In</TableHead>
                    <TableHead>Check Out</TableHead>
                    <TableHead>Hours</TableHead>
                    <TableHead>Status</TableHead>
                    {canApprove && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {attendanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      {canApprove && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {record.employees?.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{record.employees?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{record.employees?.employee_code}</p>
                            </div>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div>
                          <p className="font-medium">{format(parseISO(record.date), 'MMM d, yyyy')}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(parseISO(record.date), 'EEEE')}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{record.check_in || '-'}</TableCell>
                      <TableCell>{record.check_out || '-'}</TableCell>
                      <TableCell>{record.work_hours ? `${record.work_hours}h` : '-'}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(record.status)}>
                          {record.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                      </TableCell>
                      {canApprove && (
                        <TableCell>
                          {record.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-chart-1 border-chart-1/20 hover:bg-chart-1/10"
                                onClick={() => updateAttendanceStatusMutation.mutate({ 
                                  id: record.id, 
                                  status: 'present' 
                                })}
                              >
                                <CheckCircle2 className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive border-destructive/20 hover:bg-destructive/10"
                                onClick={() => updateAttendanceStatusMutation.mutate({ 
                                  id: record.id, 
                                  status: 'absent' 
                                })}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                  {attendanceRecords.length === 0 && (
                    <TableRow>
                      <TableCell 
                        colSpan={canApprove ? 7 : 5} 
                        className="text-center py-8 text-muted-foreground"
                      >
                        No attendance records found for this period.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
