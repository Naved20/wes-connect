import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Download, Wallet, TrendingUp, TrendingDown, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Salary = () => {
  const { toast } = useToast();

  const salaryDetails = {
    month: 'December 2024',
    baseSalary: 50000,
    workingDays: 26,
    presentDays: 24,
    earnings: [
      { label: 'Basic Salary', amount: 46154 },
      { label: 'HRA', amount: 8000 },
      { label: 'Travel Allowance', amount: 3000 },
      { label: 'Special Allowance', amount: 2000 },
    ],
    deductions: [
      { label: 'PF Deduction', amount: 1800 },
      { label: 'Professional Tax', amount: 200 },
      { label: 'TDS', amount: 2500 },
    ],
  };

  const totalEarnings = salaryDetails.earnings.reduce((sum, item) => sum + item.amount, 0);
  const totalDeductions = salaryDetails.deductions.reduce((sum, item) => sum + item.amount, 0);
  const netSalary = totalEarnings - totalDeductions;

  const handleDownload = () => {
    toast({
      title: 'Downloading Payslip',
      description: 'Your payslip is being downloaded.',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Salary Details</h1>
            <p className="text-muted-foreground">View your salary breakdown and payslips</p>
          </div>
          <div className="flex items-center gap-4">
            <Select defaultValue="dec2024">
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select month" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dec2024">December 2024</SelectItem>
                <SelectItem value="nov2024">November 2024</SelectItem>
                <SelectItem value="oct2024">October 2024</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleDownload}>
              <Download className="h-4 w-4 mr-2" />
              Download Payslip
            </Button>
          </div>
        </div>

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
                  <p className="text-sm text-muted-foreground">Working Days</p>
                  <p className="text-2xl font-bold text-foreground">{salaryDetails.presentDays}/{salaryDetails.workingDays}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Salary Breakdown */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Earnings */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Earnings</CardTitle>
                <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                  ₹{totalEarnings.toLocaleString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salaryDetails.earnings.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-foreground">₹{item.amount.toLocaleString()}</span>
                  </div>
                ))}
                <Separator />
                <div className="flex items-center justify-between py-2">
                  <span className="font-semibold text-foreground">Total Earnings</span>
                  <span className="font-bold text-chart-1">₹{totalEarnings.toLocaleString()}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Deductions */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">Deductions</CardTitle>
                <Badge className="bg-destructive/10 text-destructive border-destructive/20">
                  ₹{totalDeductions.toLocaleString()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {salaryDetails.deductions.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2">
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-medium text-foreground">₹{item.amount.toLocaleString()}</span>
                  </div>
                ))}
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
              <p className="text-sm text-muted-foreground mt-2">For {salaryDetails.month}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Salary;
