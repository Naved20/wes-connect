import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Wallet, TrendingUp, TrendingDown, FileText, Edit, Search, CheckCircle, XCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

interface SalaryRecord {
  id: string;
  employee_id: string;
  month: number;
  year: number;
  basic_salary: number;
  allowances: number;
  deductions: number;
  net_salary: number;
  working_days: number | null;
  present_days: number | null;
  status: string;
  is_locked: boolean;
  employees?: {
    full_name: string;
    employee_code: string;
  };
}

const Salary = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingSalary, setEditingSalary] = useState<SalaryRecord | null>(null);
  const [basicSalary, setBasicSalary] = useState('');
  const [allowances, setAllowances] = useState('');
  const [deductions, setDeductions] = useState('');
  
  const isAdmin = user?.role === 'admin';
  const isManager = user?.role === 'manager';
  const canManage = isAdmin;

  // Get employee ID for current user
  const { data: employeeData } = useQuery({
    queryKey: ['employee-self-salary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id && !canManage,
  });

  // Fetch salary records (admin sees all, others see own)
  const { data: salaryRecords = [], isLoading } = useQuery({
    queryKey: ['salary-records', selectedMonth, selectedYear, canManage, employeeData?.id],
    queryFn: async () => {
      let query = supabase
        .from('salary')
        .select('*, employees(full_name, employee_code)')
        .eq('month', selectedMonth)
        .eq('year', selectedYear)
        .order('created_at', { ascending: false });
      
      if (!canManage && employeeData?.id) {
        query = query.eq('employee_id', employeeData.id);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as SalaryRecord[];
    },
    enabled: canManage || !!employeeData?.id,
  });

  // Fetch all employees for admin to assign salary
  const { data: allEmployees = [] } = useQuery({
    queryKey: ['all-employees-salary'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id, full_name, employee_code')
        .eq('status', 'active')
        .order('full_name');
      
      if (error) throw error;
      return data;
    },
    enabled: canManage,
  });

  // Update/create salary mutation
  const saveSalaryMutation = useMutation({
    mutationFn: async (salaryData: {
      id?: string;
      employee_id: string;
      month: number;
      year: number;
      basic_salary: number;
      allowances: number;
      deductions: number;
      net_salary: number;
    }) => {
      if (salaryData.id) {
        const { error } = await supabase
          .from('salary')
          .update({
            basic_salary: salaryData.basic_salary,
            allowances: salaryData.allowances,
            deductions: salaryData.deductions,
            net_salary: salaryData.net_salary,
          })
          .eq('id', salaryData.id);
        
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('salary')
          .insert([{
            employee_id: salaryData.employee_id,
            month: salaryData.month,
            year: salaryData.year,
            basic_salary: salaryData.basic_salary,
            allowances: salaryData.allowances,
            deductions: salaryData.deductions,
            net_salary: salaryData.net_salary,
            status: 'pending',
          }]);
        
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-records'] });
      toast({
        title: 'Salary saved',
        description: 'Salary details have been updated.',
      });
      setEditDialogOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Update salary status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const updateData: { status: string; paid_at?: string | null } = { status };
      if (status === 'paid') {
        updateData.paid_at = new Date().toISOString();
      } else {
        updateData.paid_at = null;
      }
      
      const { error } = await supabase
        .from('salary')
        .update(updateData)
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['salary-records'] });
      toast({
        title: 'Status updated',
        description: 'Salary payment status has been updated.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setEditingSalary(null);
    setBasicSalary('');
    setAllowances('');
    setDeductions('');
  };

  const handleEditSalary = (salary: SalaryRecord) => {
    setEditingSalary(salary);
    setBasicSalary(salary.basic_salary.toString());
    setAllowances((salary.allowances || 0).toString());
    setDeductions((salary.deductions || 0).toString());
    setEditDialogOpen(true);
  };

  const handleSaveSalary = () => {
    if (!editingSalary) return;
    
    const basic = parseFloat(basicSalary) || 0;
    const allow = parseFloat(allowances) || 0;
    const deduct = parseFloat(deductions) || 0;
    const net = basic + allow - deduct;
    
    saveSalaryMutation.mutate({
      id: editingSalary.id,
      employee_id: editingSalary.employee_id,
      month: selectedMonth,
      year: selectedYear,
      basic_salary: basic,
      allowances: allow,
      deductions: deduct,
      net_salary: net,
    });
  };

  const handleDownload = () => {
    toast({
      title: 'Downloading Payslip',
      description: 'Your payslip is being downloaded.',
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">Paid</Badge>;
      case 'pending':
        return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">Pending</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Single employee view
  if (!canManage) {
    const mySalary = salaryRecords[0];
    const totalEarnings = mySalary ? mySalary.basic_salary + (mySalary.allowances || 0) : 0;
    const totalDeductions = mySalary?.deductions || 0;
    const netSalary = mySalary?.net_salary || 0;

    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Salary Details</h1>
              <p className="text-muted-foreground">View your salary breakdown and payslips</p>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
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
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((year) => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {mySalary && (
                <Button onClick={handleDownload}>
                  <Download className="h-4 w-4 mr-2" />
                  Download Payslip
                </Button>
              )}
            </div>
          </div>

          {!mySalary ? (
            <Card className="py-12">
              <CardContent className="text-center">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium">No Salary Record</h3>
                <p className="text-muted-foreground mt-2">
                  Salary for {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')} has not been processed yet.
                </p>
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-primary/10">
                        <Wallet className="h-6 w-6 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Net Salary</p>
                        <p className="text-2xl font-bold text-foreground">₹{netSalary.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-chart-1/10">
                        <TrendingUp className="h-6 w-6 text-chart-1" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Earnings</p>
                        <p className="text-2xl font-bold text-foreground">₹{totalEarnings.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-destructive/10">
                        <TrendingDown className="h-6 w-6 text-destructive" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Total Deductions</p>
                        <p className="text-2xl font-bold text-foreground">₹{totalDeductions.toLocaleString()}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-chart-4/10">
                        <FileText className="h-6 w-6 text-chart-4" />
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Status</p>
                        {getStatusBadge(mySalary.status)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Salary Breakdown */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Earnings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-muted-foreground">Basic Salary</span>
                        <span className="font-medium text-foreground">₹{mySalary.basic_salary.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between py-2">
                        <span className="text-muted-foreground">Allowances</span>
                        <span className="font-medium text-foreground">₹{(mySalary.allowances || 0).toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between py-2">
                        <span className="font-semibold text-foreground">Total Earnings</span>
                        <span className="font-bold text-chart-1">₹{totalEarnings.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Deductions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between py-2">
                        <span className="text-muted-foreground">PF / Deductions</span>
                        <span className="font-medium text-foreground">₹{totalDeductions.toLocaleString()}</span>
                      </div>
                      <Separator />
                      <div className="flex items-center justify-between py-2">
                        <span className="font-semibold text-foreground">Total Deductions</span>
                        <span className="font-bold text-destructive">₹{totalDeductions.toLocaleString()}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Net Salary Card */}
              <Card className="bg-primary/5 border-primary/20">
                <CardContent className="py-8">
                  <div className="text-center">
                    <p className="text-lg text-muted-foreground mb-2">Net Payable Amount</p>
                    <p className="text-5xl font-bold text-primary">₹{netSalary.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground mt-2">
                      For {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')}
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DashboardLayout>
    );
  }

  // Admin view - manage all salaries
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Salary Management</h1>
            <p className="text-muted-foreground">Manage employee salaries and payments</p>
          </div>
          <div className="flex items-center gap-4">
            <Select value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
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
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-24">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2024, 2025, 2026].map((year) => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-foreground">{salaryRecords.length}</p>
                <p className="text-sm text-muted-foreground">Total Records</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-chart-1">{salaryRecords.filter(s => s.status === 'paid').length}</p>
                <p className="text-sm text-muted-foreground">Paid</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-chart-4">{salaryRecords.filter(s => s.status === 'pending').length}</p>
                <p className="text-sm text-muted-foreground">Pending</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">
                  ₹{salaryRecords.reduce((sum, s) => sum + s.net_salary, 0).toLocaleString()}
                </p>
                <p className="text-sm text-muted-foreground">Total Payable</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Salary Table */}
        <Card>
          <CardHeader>
            <CardTitle>Salary Records</CardTitle>
            <CardDescription>
              {format(new Date(selectedYear, selectedMonth - 1), 'MMMM yyyy')} - All employee salaries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : salaryRecords.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No salary records for this month.</p>
                <p className="text-sm text-muted-foreground mt-1">Create salary records from Employee page.</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employee</TableHead>
                    <TableHead>Basic Salary</TableHead>
                    <TableHead>Allowances</TableHead>
                    <TableHead>Deductions</TableHead>
                    <TableHead>Net Salary</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-24">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaryRecords.map((salary) => (
                    <TableRow key={salary.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{salary.employees?.full_name}</p>
                          <p className="text-xs text-muted-foreground">{salary.employees?.employee_code}</p>
                        </div>
                      </TableCell>
                      <TableCell>₹{salary.basic_salary.toLocaleString()}</TableCell>
                      <TableCell className="text-chart-1">+₹{(salary.allowances || 0).toLocaleString()}</TableCell>
                      <TableCell className="text-destructive">-₹{(salary.deductions || 0).toLocaleString()}</TableCell>
                      <TableCell className="font-bold">₹{salary.net_salary.toLocaleString()}</TableCell>
                      <TableCell>{getStatusBadge(salary.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button size="icon" variant="ghost" onClick={() => handleEditSalary(salary)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          {salary.status === 'pending' ? (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-chart-1"
                              onClick={() => updateStatusMutation.mutate({ id: salary.id, status: 'paid' })}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          ) : (
                            <Button 
                              size="icon" 
                              variant="ghost" 
                              className="text-chart-4"
                              onClick={() => updateStatusMutation.mutate({ id: salary.id, status: 'pending' })}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Edit Salary Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Salary</DialogTitle>
            <DialogDescription>
              Update salary details for {editingSalary?.employees?.full_name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Basic Salary</Label>
              <Input
                type="number"
                value={basicSalary}
                onChange={(e) => setBasicSalary(e.target.value)}
                placeholder="Enter basic salary"
              />
            </div>
            <div className="space-y-2">
              <Label>Allowances (Increment)</Label>
              <Input
                type="number"
                value={allowances}
                onChange={(e) => setAllowances(e.target.value)}
                placeholder="Enter allowances"
              />
            </div>
            <div className="space-y-2">
              <Label>Deductions (PF, etc.)</Label>
              <Input
                type="number"
                value={deductions}
                onChange={(e) => setDeductions(e.target.value)}
                placeholder="Enter deductions"
              />
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between">
                <span className="font-medium">Net Salary:</span>
                <span className="font-bold text-primary">
                  ₹{((parseFloat(basicSalary) || 0) + (parseFloat(allowances) || 0) - (parseFloat(deductions) || 0)).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveSalary} disabled={saveSalaryMutation.isPending}>
              {saveSalaryMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default Salary;
