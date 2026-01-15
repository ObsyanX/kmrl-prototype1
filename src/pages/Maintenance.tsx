import React, { useState, useEffect } from 'react';
import { Wrench, Calendar, AlertTriangle, CheckCircle, Clock, TrendingUp, Users, Loader2, RefreshCw, Brain } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MaintenanceScheduler from '@/components/maintenance/MaintenanceScheduler';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOptimization } from '@/hooks/useOptimization';

const Maintenance: React.FC = () => {
  const [maintenanceTasks, setMaintenanceTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiPredictions, setAiPredictions] = useState<any>(null);
  const { getAIRecommendation } = useOptimization();

  useEffect(() => {
    fetchMaintenanceTasks();
    fetchAIPredictions();

    // Real-time subscriptions
    const channel = supabase
      .channel('maintenance_jobs_changes')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_jobs' },
        () => {
          fetchMaintenanceTasks();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMaintenanceTasks = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from('maintenance_jobs' as any)
        .select('*')
        .order('scheduled_start', { ascending: true }) as any);

      if (error) throw error;

      const enrichedTasks = (data || []).map((job: any) => ({
        id: job.id,
        trainId: job.trainset_id,
        type: job.job_type === 'routine' ? 'routine' : job.priority === 'critical' ? 'emergency' : 'corrective',
        title: job.job_type,
        description: job.description || 'Maintenance task',
        priority: job.priority,
        status: job.status,
        scheduledDate: job.scheduled_start ? new Date(job.scheduled_start) : new Date(),
        estimatedDuration: job.estimated_duration || 4,
        assignedTechnician: job.assigned_staff?.[0] || 'Unassigned',
        progress: job.status === 'completed' ? 100 : job.status === 'in_progress' ? 50 : 0,
        requiredParts: [],
        lastMaintenance: job.created_at ? new Date(job.created_at) : new Date()
      }));

      setMaintenanceTasks(enrichedTasks);
    } catch (error) {
      console.error('Error fetching maintenance tasks:', error);
      toast.error('Failed to fetch maintenance tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchAIPredictions = async () => {
    try {
      const predictions = await getAIRecommendation(undefined, 'maintenance_priority', {
        analysis_type: 'predictive_maintenance'
      });
      setAiPredictions(predictions);
    } catch (error) {
      console.error('Error fetching AI predictions:', error);
    }
  };

  const handleTaskUpdate = async (taskId: string, updates: any) => {
    try {
      const { error } = await (supabase
        .from('maintenance_jobs' as any)
        .update(updates)
        .eq('id', taskId) as any);

      if (error) throw error;

      toast.success('Maintenance task updated');
      fetchMaintenanceTasks();
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    }
  };

  const inProgressCount = maintenanceTasks.filter(t => t.status === 'in_progress').length;
  const overdueCount = maintenanceTasks.filter(t => t.status === 'overdue').length;
  const completedCount = maintenanceTasks.filter(t => t.status === 'completed').length;

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-glow mb-2">AI-Enhanced Maintenance Management</h1>
          <p className="text-muted-foreground">
            Predictive maintenance scheduling with ML-powered failure prediction
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="glass-card border-success text-success">
            <CheckCircle className="w-3 h-3 mr-1" />
            System Operational
          </Badge>
          <Button variant="outline" onClick={fetchMaintenanceTasks} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="neural">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule New Task
          </Button>
        </div>
      </div>

      {/* AI Predictions */}
      {aiPredictions && (
        <Card className="glass-card border-primary/20 hologram-glow">
          <CardHeader>
            <CardTitle className="text-glow flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Predictive Maintenance Insights
            </CardTitle>
            <CardDescription>
              ML model predictions based on historical patterns (Accuracy: {(aiPredictions.confidence_score * 100).toFixed(1)}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {aiPredictions.recommendations?.slice(0, 3).map((rec: any, idx: number) => (
                <div key={idx} className="glass-card p-4 border border-primary/10">
                  <p className="text-sm font-medium text-foreground mb-1">{rec.trainset || `Priority ${idx + 1}`}</p>
                  <p className="text-xs text-muted-foreground">{rec.action || rec.reasoning}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <Card className="glass-card border-primary/20 hologram-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold text-primary">{maintenanceTasks.length}</p>
              </div>
              <Wrench className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-warning">{inProgressCount}</p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">{overdueCount}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">{completedCount}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Efficiency</p>
                <p className="text-2xl font-bold text-success">94%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Maintenance Scheduler */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow">Maintenance Schedule</CardTitle>
          <CardDescription>
            Manage and track all maintenance activities across the KMRL fleet
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading maintenance schedule...</span>
            </div>
          ) : (
            <MaintenanceScheduler 
              tasks={maintenanceTasks}
              onTaskUpdate={handleTaskUpdate}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Maintenance;
