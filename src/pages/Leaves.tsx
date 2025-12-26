import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Progress } from '@/components/ui/progress';
import { useToast } from '@/hooks/use-toast';
import { CalendarPlus, Clock, CheckCircle, XCircle } from 'lucide-react';

const Leaves = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  const leaveBalance = [
    { type: 'Casual Leave', used: 4, total: 12, color: 'bg-primary' },
    { type: 'Sick Leave', used: 2, total: 6, color: 'bg-chart-4' },
    { type: 'Earned Leave', used: 5, total: 15, color: 'bg-chart-1' },
  ];

  const leaveHistory = [
    { id: 1, type: 'Casual Leave', from: '2024-12-20', to: '2024-12-21', days: 2, status: 'approved', reason: 'Family function' },
    { id: 2, type: 'Sick Leave', from: '2024-12-15', to: '2024-12-15', days: 1, status: 'approved', reason: 'Not feeling well' },
    { id: 3, type: 'Casual Leave', from: '2024-12-28', to: '2024-12-29', days: 2, status: 'pending', reason: 'Personal work' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-chart-1/10 text-chart-1 border-chart-1/20">Approved</Badge>;
      case 'rejected':
        return <Badge className="bg-destructive/10 text-destructive border-destructive/20">Rejected</Badge>;
      default:
        return <Badge className="bg-chart-4/10 text-chart-4 border-chart-4/20">Pending</Badge>;
    }
  };

  const handleSubmitLeave = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDialogOpen(false);
    toast({
      title: 'Leave Request Submitted',
      description: 'Your leave request has been sent for approval.',
    });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Leave Management</h1>
            <p className="text-muted-foreground">Apply for leave and track your requests</p>
          </div>
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
              </DialogHeader>
              <form onSubmit={handleSubmitLeave} className="space-y-4">
                <div className="space-y-2">
                  <Label>Leave Type</Label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="casual">Casual Leave</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="earned">Earned Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>From Date</Label>
                    <Input type="date" required />
                  </div>
                  <div className="space-y-2">
                    <Label>To Date</Label>
                    <Input type="date" required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Reason</Label>
                  <Textarea placeholder="Enter reason for leave" required />
                </div>
                <Button type="submit" className="w-full">Submit Request</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Leave Balance Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {leaveBalance.map((leave, index) => (
            <Card key={index}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-medium text-foreground">{leave.type}</span>
                  <span className="text-2xl font-bold text-foreground">
                    {leave.total - leave.used}
                  </span>
                </div>
                <Progress value={(leave.used / leave.total) * 100} className="h-2 mb-2" />
                <p className="text-sm text-muted-foreground">
                  {leave.used} used of {leave.total} days
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Leave History */}
        <Card>
          <CardHeader>
            <CardTitle>Leave History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {leaveHistory.map((leave) => (
                <div
                  key={leave.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-2 rounded-full bg-muted">
                      {leave.status === 'approved' ? (
                        <CheckCircle className="h-5 w-5 text-chart-1" />
                      ) : leave.status === 'rejected' ? (
                        <XCircle className="h-5 w-5 text-destructive" />
                      ) : (
                        <Clock className="h-5 w-5 text-chart-4" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{leave.type}</p>
                      <p className="text-sm text-muted-foreground">
                        {leave.from} to {leave.to} ({leave.days} day{leave.days > 1 ? 's' : ''})
                      </p>
                      <p className="text-sm text-muted-foreground mt-1">{leave.reason}</p>
                    </div>
                  </div>
                  {getStatusBadge(leave.status)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Leaves;
