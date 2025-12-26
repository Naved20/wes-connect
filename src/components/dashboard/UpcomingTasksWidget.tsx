import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CheckSquare, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';

const UpcomingTasksWidget = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // Get employee ID
  const { data: employeeData } = useQuery({
    queryKey: ['employee-self-tasks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('employees')
        .select('id')
        .eq('user_id', user?.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch upcoming tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['upcoming-tasks-widget', employeeData?.id],
    queryFn: async () => {
      if (!employeeData?.id) return [];
      
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('assigned_to', employeeData.id)
        .neq('status', 'completed')
        .order('due_date', { ascending: true })
        .limit(3);
      
      if (error) throw error;
      return data;
    },
    enabled: !!employeeData?.id,
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'medium':
        return 'bg-chart-4/10 text-chart-4 border-chart-4/20';
      default:
        return 'bg-chart-1/10 text-chart-1 border-chart-1/20';
    }
  };

  if (tasks.length === 0) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">Upcoming Tasks</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
              View All
              <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-4">
            No pending tasks
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Upcoming Tasks</CardTitle>
          <Button variant="ghost" size="sm" onClick={() => navigate('/tasks')}>
            View All
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {tasks.map((task) => (
            <div
              key={task.id}
              className="flex items-start gap-3 p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors cursor-pointer"
            >
              <CheckSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground line-clamp-1">
                  {task.title}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs text-muted-foreground">
                    Due {task.due_date ? format(new Date(task.due_date), 'MMM d') : 'No date'}
                  </span>
                </div>
              </div>
              <Badge variant="outline" className={getPriorityColor(task.priority)}>
                {task.priority}
              </Badge>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default UpcomingTasksWidget;
