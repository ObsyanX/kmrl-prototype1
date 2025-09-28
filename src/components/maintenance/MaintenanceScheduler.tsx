import React, { useState } from 'react';
import { Calendar, Clock, Wrench, AlertTriangle, CheckCircle, User, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface MaintenanceTask {
  id: string;
  trainId: string;
  type: 'routine' | 'preventive' | 'corrective' | 'emergency';
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'scheduled' | 'in-progress' | 'completed' | 'overdue';
  scheduledDate: Date;
  estimatedDuration: number; // in hours
  assignedTechnician?: string;
  progress: number;
  requiredParts?: string[];
  lastMaintenance?: Date;
}

interface MaintenanceSchedulerProps {
  tasks: MaintenanceTask[];
  onTaskUpdate?: (taskId: string, updates: Partial<MaintenanceTask>) => void;
}

const MaintenanceScheduler: React.FC<MaintenanceSchedulerProps> = ({ 
  tasks = [], 
  onTaskUpdate 
}) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'warning';
      case 'medium': return 'secondary';
      case 'low': return 'outline';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'overdue': return 'destructive';
      case 'scheduled': return 'secondary';
      default: return 'outline';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'routine': return Calendar;
      case 'preventive': return CheckCircle;
      case 'corrective': return Wrench;
      case 'emergency': return AlertTriangle;
      default: return Wrench;
    }
  };

  const filteredTasks = tasks.filter(task => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'urgent') return task.priority === 'critical' || task.priority === 'high';
    if (selectedFilter === 'overdue') return task.status === 'overdue';
    if (selectedFilter === 'in-progress') return task.status === 'in-progress';
    return task.status === selectedFilter;
  });

  const getUpcomingTasks = () => {
    const today = new Date();
    const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
    return tasks.filter(task => 
      task.scheduledDate >= today && 
      task.scheduledDate <= nextWeek &&
      task.status === 'scheduled'
    ).length;
  };

  const getOverdueTasks = () => {
    return tasks.filter(task => task.status === 'overdue').length;
  };

  const getInProgressTasks = () => {
    return tasks.filter(task => task.status === 'in-progress').length;
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Upcoming (7 days)</p>
                <p className="text-2xl font-bold text-primary">{getUpcomingTasks()}</p>
              </div>
              <Calendar className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-warning">{getInProgressTasks()}</p>
              </div>
              <Wrench className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{getOverdueTasks()}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold text-foreground">{tasks.length}</p>
              </div>
              <FileText className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Tasks' },
          { key: 'urgent', label: 'Urgent' },
          { key: 'overdue', label: 'Overdue' },
          { key: 'in-progress', label: 'In Progress' },
          { key: 'scheduled', label: 'Scheduled' }
        ].map(filter => (
          <Button
            key={filter.key}
            variant={selectedFilter === filter.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter(filter.key)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Tasks List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredTasks.map((task) => {
          const TypeIcon = getTypeIcon(task.type);
          
          return (
            <Card key={task.id} className="glass-card border-primary/20 hover:border-primary/40 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <TypeIcon className="w-5 h-5 text-primary" />
                    <div>
                      <CardTitle className="text-lg">{task.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">Train {task.trainId}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={getPriorityColor(task.priority) as any}>
                      {task.priority}
                    </Badge>
                    <Badge variant={getStatusColor(task.status) as any}>
                      {task.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{task.description}</p>

                {/* Progress Bar (for in-progress tasks) */}
                {task.status === 'in-progress' && (
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span>Progress</span>
                      <span>{task.progress}%</span>
                    </div>
                    <Progress value={task.progress} className="h-2" />
                  </div>
                )}

                {/* Task Details */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground">Scheduled Date</label>
                    <p className="font-medium">{task.scheduledDate.toLocaleDateString()}</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Duration</label>
                    <p className="font-medium">{task.estimatedDuration}h</p>
                  </div>
                  {task.assignedTechnician && (
                    <div className="col-span-2">
                      <label className="text-muted-foreground">Assigned Technician</label>
                      <p className="font-medium flex items-center gap-1">
                        <User className="w-4 h-4" />
                        {task.assignedTechnician}
                      </p>
                    </div>
                  )}
                </div>

                {/* Required Parts */}
                {task.requiredParts && task.requiredParts.length > 0 && (
                  <div>
                    <label className="text-muted-foreground text-sm">Required Parts</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.requiredParts.map((part, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {part}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-primary/10">
                  {task.status === 'scheduled' && (
                    <Button 
                      variant="neural" 
                      size="sm"
                      onClick={() => onTaskUpdate?.(task.id, { status: 'in-progress', progress: 0 })}
                    >
                      Start Task
                    </Button>
                  )}
                  {task.status === 'in-progress' && (
                    <Button 
                      variant="hologram" 
                      size="sm"
                      onClick={() => onTaskUpdate?.(task.id, { status: 'completed', progress: 100 })}
                    >
                      Mark Complete
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredTasks.length === 0 && (
        <Card className="glass-card border-primary/20">
          <CardContent className="text-center py-8">
            <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tasks found</h3>
            <p className="text-muted-foreground">No maintenance tasks match the selected filter.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MaintenanceScheduler;