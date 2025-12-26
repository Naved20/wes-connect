import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Clock, CalendarPlus, FileText, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const QuickActionsWidget = () => {
  const navigate = useNavigate();

  const actions = [
    {
      icon: Clock,
      label: 'Mark Attendance',
      description: 'Record your daily attendance',
      path: '/attendance',
      variant: 'default' as const,
    },
    {
      icon: CalendarPlus,
      label: 'Apply Leave',
      description: 'Request time off',
      path: '/leaves',
      variant: 'outline' as const,
    },
    {
      icon: FileText,
      label: 'View Payslip',
      description: 'Check your salary details',
      path: '/salary',
      variant: 'outline' as const,
    },
    {
      icon: User,
      label: 'Update Profile',
      description: 'Edit your information',
      path: '/profile',
      variant: 'outline' as const,
    },
  ];

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-3">
          {actions.map((action, index) => (
            <Button
              key={index}
              variant={action.variant}
              className="h-auto py-4 flex flex-col items-center gap-2"
              onClick={() => navigate(action.path)}
            >
              <action.icon className="h-6 w-6" />
              <span className="text-xs font-medium">{action.label}</span>
            </Button>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default QuickActionsWidget;
