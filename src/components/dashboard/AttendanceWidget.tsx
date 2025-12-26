import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AttendanceWidget = () => {
  const [isMarked, setIsMarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const handleMarkAttendance = async () => {
    setIsLoading(true);
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsMarked(true);
    setIsLoading(false);
    toast({
      title: 'Attendance Marked',
      description: `Your attendance has been marked at ${currentTime}`,
    });
  };

  const weekDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const attendanceData = [
    { day: 'Mon', status: 'present' },
    { day: 'Tue', status: 'present' },
    { day: 'Wed', status: 'present' },
    { day: 'Thu', status: 'leave' },
    { day: 'Fri', status: 'present' },
    { day: 'Sat', status: 'pending' },
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'present':
        return <CheckCircle2 className="h-5 w-5 text-chart-1" />;
      case 'absent':
        return <XCircle className="h-5 w-5 text-destructive" />;
      case 'leave':
        return <AlertCircle className="h-5 w-5 text-chart-4" />;
      default:
        return <Clock className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Today's Attendance</CardTitle>
          <Badge variant={isMarked ? 'default' : 'secondary'}>
            {isMarked ? 'Marked' : 'Pending'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center py-4">
          <div className="text-4xl font-bold text-foreground mb-2">{currentTime}</div>
          <p className="text-sm text-muted-foreground">Current Time</p>
        </div>

        {!isMarked ? (
          <Button
            onClick={handleMarkAttendance}
            disabled={isLoading}
            className="w-full h-12 text-lg"
          >
            {isLoading ? (
              'Marking...'
            ) : (
              <>
                <Clock className="mr-2 h-5 w-5" />
                Mark Attendance
              </>
            )}
          </Button>
        ) : (
          <div className="flex items-center justify-center gap-2 py-3 bg-chart-1/10 rounded-lg">
            <CheckCircle2 className="h-5 w-5 text-chart-1" />
            <span className="font-medium text-chart-1">Attendance Marked</span>
          </div>
        )}

        <div>
          <p className="text-sm font-medium text-muted-foreground mb-3">This Week</p>
          <div className="grid grid-cols-6 gap-2">
            {attendanceData.map((item, index) => (
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
