import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CheckSquare, Plus, Clock, CheckCircle, AlertCircle } from 'lucide-react';

const Tasks = () => {
  const tasks = {
    pending: [
      { id: 1, title: 'Complete monthly report', project: 'DPS', dueDate: 'Dec 28', priority: 'high', progress: 60 },
      { id: 2, title: 'Review student assessments', project: 'Academy', dueDate: 'Dec 30', priority: 'medium', progress: 30 },
    ],
    inProgress: [
      { id: 3, title: 'Update curriculum plan', project: 'CLAS', dueDate: 'Jan 2', priority: 'medium', progress: 45 },
      { id: 4, title: 'Prepare training materials', project: 'GPS', dueDate: 'Jan 5', priority: 'low', progress: 20 },
    ],
    completed: [
      { id: 5, title: 'Submit attendance report', project: 'DPS', dueDate: 'Dec 20', priority: 'high', progress: 100 },
      { id: 6, title: 'Complete onboarding docs', project: 'HR', dueDate: 'Dec 18', priority: 'medium', progress: 100 },
    ],
  };

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

  const TaskCard = ({ task }: { task: typeof tasks.pending[0] }) => (
    <div className="p-4 rounded-lg border border-border hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-start gap-3">
          <CheckSquare className="h-5 w-5 text-muted-foreground mt-0.5" />
          <div>
            <p className="font-medium text-foreground">{task.title}</p>
            <p className="text-sm text-muted-foreground">{task.project} • Due {task.dueDate}</p>
          </div>
        </div>
        <Badge variant="outline" className={getPriorityColor(task.priority)}>
          {task.priority}
        </Badge>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Progress</span>
          <span className="font-medium">{task.progress}%</span>
        </div>
        <Progress value={task.progress} className="h-2" />
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Tasks</h1>
            <p className="text-muted-foreground">Manage your assigned tasks</p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-muted">
                  <CheckSquare className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">12</p>
                  <p className="text-sm text-muted-foreground">Total Tasks</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-chart-4/10">
                  <Clock className="h-6 w-6 text-chart-4" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">4</p>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-chart-1/10">
                  <CheckCircle className="h-6 w-6 text-chart-1" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">6</p>
                  <p className="text-sm text-muted-foreground">Completed</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-destructive/10">
                  <AlertCircle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">2</p>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tasks Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending">Pending ({tasks.pending.length})</TabsTrigger>
            <TabsTrigger value="inProgress">In Progress ({tasks.inProgress.length})</TabsTrigger>
            <TabsTrigger value="completed">Completed ({tasks.completed.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="pending">
            <Card>
              <CardHeader>
                <CardTitle>Pending Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.pending.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inProgress">
            <Card>
              <CardHeader>
                <CardTitle>In Progress</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.inProgress.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="completed">
            <Card>
              <CardHeader>
                <CardTitle>Completed Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.completed.map((task) => (
                  <TaskCard key={task.id} task={task} />
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Tasks;
