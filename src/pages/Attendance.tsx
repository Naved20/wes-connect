import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { useToast } from '@/hooks/use-toast';
import { Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';

const Attendance = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  const [isMarked, setIsMarked] = useState(false);
  const { toast } = useToast();

  const currentTime = new Date().toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });

  const handleMarkAttendance = () => {
    setIsMarked(true);
    toast({
      title: 'Attendance Marked',
      description: `Your attendance has been recorded at ${currentTime}`,
    });
  };

  const monthlyStats = [
    { label: 'Present', value: 22, icon: CheckCircle2, color: 'text-chart-1' },
    { label: 'Absent', value: 1, icon: XCircle, color: 'text-destructive' },
    { label: 'Leave', value: 2, icon: AlertCircle, color: 'text-chart-4' },
    { label: 'Holidays', value: 4, icon: Clock, color: 'text-primary' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Attendance</h1>
          <p className="text-muted-foreground">Mark and view your attendance records</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mark Attendance Card */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Mark Today's Attendance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="text-center flex-1">
                  <div className="text-5xl font-bold text-foreground mb-2">{currentTime}</div>
                  <p className="text-muted-foreground">
                    {new Date().toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                  <div className="mt-6">
                    {!isMarked ? (
                      <Button size="lg" onClick={handleMarkAttendance} className="px-8">
                        <Clock className="mr-2 h-5 w-5" />
                        Mark Attendance
                      </Button>
                    ) : (
                      <div className="flex items-center justify-center gap-2 py-3 px-6 bg-chart-1/10 rounded-lg">
                        <CheckCircle2 className="h-5 w-5 text-chart-1" />
                        <span className="font-medium text-chart-1">Attendance Marked at 9:15 AM</span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {monthlyStats.map((stat, index) => (
                    <div key={index} className="text-center p-4 rounded-lg bg-muted/50">
                      <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.color}`} />
                      <div className="text-2xl font-bold text-foreground">{stat.value}</div>
                      <p className="text-sm text-muted-foreground">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Calendar */}
          <Card>
            <CardHeader>
              <CardTitle>Attendance Calendar</CardTitle>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md"
              />
              <div className="mt-4 flex flex-wrap gap-2">
                <Badge variant="outline" className="bg-chart-1/10 text-chart-1 border-chart-1/20">
                  Present: 22
                </Badge>
                <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20">
                  Absent: 1
                </Badge>
                <Badge variant="outline" className="bg-chart-4/10 text-chart-4 border-chart-4/20">
                  Leave: 2
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Attendance;
