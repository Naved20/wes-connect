import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { CalendarPlus, Clock, CheckCircle, XCircle, AlertCircle, Calendar } from 'lucide-react';
import { format, parseISO, differenceInDays, addDays, startOfMonth, endOfMonth, isSameWeek } from 'date-fns';

interface LeaveRecord {
  id: string;
  employee_id: string;
  leave_type: string;
  start_date: string;
  end_date: string;
  reason: string | null;
  status: string;
  approved_by: string | null;
  approved_at: string | null;
  is_paid: boolean | null;
  days_count: number | null;
  created_at: string;
  employees?: {
    full_name: string;
    employee_code: string;
    department: string;
  };
}

const LEAVE_TYPES = [
  { value: 'casual', label: 'Casual Leave' },
  { value: 'sick', label: 'Sick Leave' },
  { value: 'earned', label: 'Earned Leave' },
  { value: 'unpaid', label: 'Unpaid Leave' },
];

const Leaves = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [leaveType, setLeaveType] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canApprove = isAdmin || isManager;

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

  // Fetch leaves
  const { data: leaves = [], isLoading } = useQuery({
    queryKey: ['leaves', selectedMonth, selectedYear, canApprove, employeeData?.id],
    queryFn: async () => {
      const startDate = format(startOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
      const endDate = format(endOfMonth(new Date(selectedYear, selectedMonth - 1)), 'yyyy-MM-dd');
      
      let query = supabase
        .from('leaves')
        .select('*, employees(full_name, employee_code, department)')
        .gte('start_date', startDate)
        .lte('start_date', endDate)
        .order('created_at', { ascending: false });
      
      if (!canApprove && employeeData?.id) {
        query = query.eq('employee_id', employeeData.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as LeaveRecord[];
    },
    enabled: canApprove || !!employeeData?.id,
  });

  // Get leave count for current month (for validation)
  const { data: currentMonthLeaves = [] } = useQuery({
    queryKey: ['current-month-leaves', employeeData?.id],
    queryFn: async () => {
      if (!employeeData?.id) return [];
      
      const now = new Date();
      const start = format(startOfMonth(now), 'yyyy-MM-dd');
      const end = format(endOfMonth(now), 'yyyy-MM-dd');
      
      const { data, error } = await supabase
        .from('leaves')
        .select('*')
        .eq('employee_id', employeeData.id)
        .gte('start_date', start)
        .lte('start_date', end)
        .in('status', ['pending', 'approved']);
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeData?.id,
  });

  // Apply leave mutation
  const applyLeaveMutation = useMutation({
    mutationFn: async (leaveData: {
      leave_type: string;
      start_date: string;
      end_date: string;
      reason: string;
    }) => {
      if (!employeeData?.id) throw new Error('Employee not found');
      
      const startDateObj = parseISO(leaveData.start_date);
      const endDateObj = parseISO(leaveData.end_date);
      const daysCount = differenceInDays(endDateObj, startDateObj) + 1;
      
      // Validation: Must apply 3 days in advance
      const today = new Date();
      const daysInAdvance = differenceInDays(startDateObj, today);
      if (daysInAdvance < 3) {
        throw new Error('Leave must be applied at least 3 days in advance');
      }
      
      // Validation: Max 2 paid leaves per month
      const approvedLeavesThisMonth = currentMonthLeaves.filter(l => 
        l.status === 'approved' && l.is_paid
      ).length;
      
      if (approvedLeavesThisMonth >= 2 && leaveData.leave_type !== 'unpaid') {
        throw new Error('You can only take 2 paid leaves per month. Please apply for unpaid leave.');
      }
      
      // Validation: Max 1 leave per week
      const hasLeaveThisWeek = currentMonthLeaves.some(l => 
        isSameWeek(parseISO(l.start_date), startDateObj)
      );
      
      if (hasLeaveThisWeek) {
        throw new Error('You can only take 1 leave per week');
      }
      
      const { data, error } = await supabase
        .from('leaves')
        .insert([{
          employee_id: employeeData.id,
          leave_type: leaveData.leave_type,
          start_date: leaveData.start_date,
          end_date: leaveData.end_date,
          reason: leaveData.reason,
          status: 'pending',
          is_paid: leaveData.leave_type !== 'unpaid',
          days_count: daysCount,
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      queryClient.invalidateQueries({ queryKey: ['current-month-leaves'] });
      toast({
        title: 'Leave applied',
        description: 'Your leave request has been submitted for approval.',
      });
      setIsDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to apply leave',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Approve/Reject leave mutation
  const updateLeaveStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase
        .from('leaves')
        .update({
          status,
          approved_by: user?.id,
          approved_at: new Date().toISOString(),
        })
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: (_, { status }) => {
      queryClient.invalidateQueries({ queryKey: ['leaves'] });
      toast({
        title: status === 'approved' ? 'Leave approved' : 'Leave rejected',
        description: `Leave has been ${status}.`,
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

  const resetForm = () => {
    setLeaveType('');
    setStartDate('');
    setEndDate('');
    setReason('');
  };

  const handleSubmitLeave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!leaveType || !startDate || !endDate || !reason) {
      toast({
        title: 'Missing fields',
        description: 'Please fill in all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await applyLeaveMutation.mutateAsync({
        leave_type: leaveType,
        start_date: startDate,
        end_date: endDate,
        reason,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-chart-1/10 text-chart-1 border-chart-1/20';
      case 'rejected':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      default:
        return 'bg-chart-4/10 text-chart-4 border-chart-4/20';
    }
  };

  // Calculate stats
  const approvedCount = leaves.filter(l => l.status === 'approved').length;
  const pendingCount = leaves.filter(l => l.status === 'pending').length;
  const rejectedCount = leaves.filter(l => l.status === 'rejected').length;
  const paidLeavesUsed = currentMonthLeaves.filter(l => l.status === 'approved' && l.is_paid).length;

  // Get minimum date (3 days from now)
  const minDate = format(addDays(new Date(), 3), 'yyyy-MM-dd');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>
            <p className="text-muted-foreground">Apply for leave and track your requests</p>
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
            {employeeData && (
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <CalendarPlus className="h-4 w-4 mr-2" />
                    Apply Leave
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Apply for Leave</DialogTitle>
                    <DialogDescription>
                      Leave must be applied at least 3 days in advance. Max 2 paid leaves per month, 1 per week.
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleSubmitLeave} className="space-y-4">
                    <div className="space-y-2">
                      <Label>Leave Type</Label>
                      <Select value={leaveType} onValueChange={setLeaveType}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select leave type" />
                        </SelectTrigger>
                        <SelectContent>
                          {LEAVE_TYPES.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>From Date</Label>
                        <Input 
                          type="date" 
                          value={startDate}
                          onChange={(e) => setStartDate(e.target.value)}
                          min={minDate}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>To Date</Label>
                        <Input 
                          type="date" 
                          value={endDate}
                          onChange={(e) => setEndDate(e.target.value)}
                          min={startDate || minDate}
                          required 
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Reason</Label>
                      <Textarea 
                        placeholder="Enter reason for leave" 
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        required 
                      />
                    </div>
                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 'Submitting...' : 'Submit Request'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </div>

        {/* Leave Balance Info */}
        {employeeData && (
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Leave Balance - {format(new Date(), 'MMMM yyyy')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Paid Leaves Used</p>
                  <p className="text-2xl font-bold">{paidLeavesUsed} / 2</p>
                  <Progress value={(paidLeavesUsed / 2) * 100} className="h-2 mt-2" />
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Pending Requests</p>
                  <p className="text-2xl font-bold text-chart-4">{pendingCount}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/50">
                  <p className="text-sm text-muted-foreground">Approved This Month</p>
                  <p className="text-2xl font-bold text-chart-1">{approvedCount}</p>
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
                  <CheckCircle className="h-6 w-6 text-chart-1" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{approvedCount}</p>
                  <p className="text-sm text-muted-foreground">Approved</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-chart-4/10">
                  <Clock className="h-6 w-6 text-chart-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">Pending</p>
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
                  <p className="text-2xl font-bold">{rejectedCount}</p>
                  <p className="text-sm text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <CalendarPlus className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{leaves.length}</p>
                  <p className="text-sm text-muted-foreground">Total Requests</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leave Records Table */}
        <Card>
          <CardHeader>
            <CardTitle>Leave Requests</CardTitle>
            <CardDescription>
              {canApprove ? 'All leave requests for the selected period' : 'Your leave requests'}
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
                    <TableHead>Type</TableHead>
                    <TableHead>Duration</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Status</TableHead>
                    {canApprove && <TableHead>Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leaves.map((leave) => (
                    <TableRow key={leave.id}>
                      {canApprove && (
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarFallback className="bg-primary/10 text-primary text-xs">
                                {leave.employees?.full_name?.charAt(0) || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <p className="font-medium text-sm">{leave.employees?.full_name}</p>
                              <p className="text-xs text-muted-foreground">{leave.employees?.department}</p>
                            </div>
                          </div>
                        </TableCell>
                      )}
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {LEAVE_TYPES.find(t => t.value === leave.leave_type)?.label || leave.leave_type}
                          </p>
                          {!leave.is_paid && (
                            <Badge variant="outline" className="text-xs mt-1">Unpaid</Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">
                          {format(parseISO(leave.start_date), 'MMM d')} - {format(parseISO(leave.end_date), 'MMM d, yyyy')}
                        </p>
                      </TableCell>
                      <TableCell>{leave.days_count || differenceInDays(parseISO(leave.end_date), parseISO(leave.start_date)) + 1}</TableCell>
                      <TableCell className="max-w-48 truncate">{leave.reason}</TableCell>
                      <TableCell>
                        <Badge className={getStatusBadgeClass(leave.status)}>
                          {leave.status.charAt(0).toUpperCase() + leave.status.slice(1)}
                        </Badge>
                      </TableCell>
                      {canApprove && (
                        <TableCell>
                          {leave.status === 'pending' && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-chart-1 border-chart-1/20 hover:bg-chart-1/10"
                                onClick={() => updateLeaveStatusMutation.mutate({ 
                                  id: leave.id, 
                                  status: 'approved' 
                                })}
                              >
                                <CheckCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive border-destructive/20 hover:bg-destructive/10"
                                onClick={() => updateLeaveStatusMutation.mutate({ 
                                  id: leave.id, 
                                  status: 'rejected' 
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
                  {leaves.length === 0 && (
                    <TableRow>
                      <TableCell 
                        colSpan={canApprove ? 7 : 5} 
                        className="text-center py-8 text-muted-foreground"
                      >
                        No leave requests found for this period.
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

export default Leaves;
