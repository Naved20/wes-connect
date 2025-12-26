import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CalendarPlus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const LeaveBalanceWidget = () => {
  const navigate = useNavigate();

  const leaveData = [
    { type: 'Casual Leave', used: 4, total: 12, color: 'bg-primary' },
    { type: 'Sick Leave', used: 2, total: 6, color: 'bg-chart-4' },
    { type: 'Earned Leave', used: 5, total: 15, color: 'bg-chart-1' },
  ];

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
        {leaveData.map((leave, index) => (
          <div key={index} className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium text-foreground">{leave.type}</span>
              <span className="text-muted-foreground">
                {leave.total - leave.used} / {leave.total} days left
              </span>
            </div>
            <div className="relative">
              <Progress
                value={(leave.used / leave.total) * 100}
                className="h-2"
              />
            </div>
          </div>
        ))}

        <div className="pt-4 border-t border-border">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Pending Requests</span>
            <span className="text-lg font-bold text-chart-4">2</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LeaveBalanceWidget;
