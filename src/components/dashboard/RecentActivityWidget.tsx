import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CheckCircle, Clock, FileText, UserPlus } from 'lucide-react';

const RecentActivityWidget = () => {
  const activities = [
    {
      id: 1,
      type: 'attendance',
      message: 'Attendance marked for today',
      time: '9:15 AM',
      icon: CheckCircle,
      iconColor: 'text-chart-1',
    },
    {
      id: 2,
      type: 'leave',
      message: 'Leave request approved by Manager',
      time: 'Yesterday',
      icon: FileText,
      iconColor: 'text-primary',
    },
    {
      id: 3,
      type: 'task',
      message: 'New task assigned: Complete DPS report',
      time: '2 days ago',
      icon: Clock,
      iconColor: 'text-chart-4',
    },
    {
      id: 4,
      type: 'profile',
      message: 'Profile updated successfully',
      time: '3 days ago',
      icon: UserPlus,
      iconColor: 'text-secondary',
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities.map((activity) => (
            <div key={activity.id} className="flex items-start gap-3">
              <div className="p-2 rounded-full bg-muted">
                <activity.icon className={`h-4 w-4 ${activity.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-2">
                  {activity.message}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivityWidget;
