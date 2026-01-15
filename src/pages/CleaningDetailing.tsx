import React, { useEffect, useState } from 'react';
import { Sparkles, Calendar, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const CleaningDetailing: React.FC = () => {
  const { toast } = useToast();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCleaningSchedules();
  }, []);

  const fetchCleaningSchedules = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from('cleaning_schedules' as any)
        .select('*')
        .gte('scheduled_date', new Date().toISOString().split('T')[0])
        .order('scheduled_date', { ascending: true })
        .order('scheduled_time', { ascending: true }) as any);

      if (error) throw error;
      setSchedules(data || []);
    } catch (error) {
      console.error('Error fetching cleaning schedules:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to fetch cleaning schedules",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'in_progress': return 'bg-blue-500';
      case 'scheduled': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'deep': return 'bg-purple-500';
      case 'routine': return 'bg-blue-500';
      case 'emergency': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-glow mb-2">Cleaning & Detailing Management</h1>
        <p className="text-muted-foreground">Schedule and track trainset cleaning operations</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Scheduled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-glow">{schedules.length}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              {schedules.filter(s => s.status === 'in_progress').length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Completed Today</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {schedules.filter(s => s.status === 'completed' && s.scheduled_date === new Date().toISOString().split('T')[0]).length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-glow">
              {schedules.filter(s => s.quality_score).length > 0
                ? (schedules.filter(s => s.quality_score).reduce((sum, s) => sum + s.quality_score, 0) / 
                   schedules.filter(s => s.quality_score).length).toFixed(1)
                : 'N/A'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cleaning Schedule List */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Upcoming Cleaning Schedule
          </CardTitle>
          <CardDescription>Trainset cleaning and detailing operations</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading schedules...</div>
          ) : schedules.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No cleaning schedules found</div>
          ) : (
            <div className="space-y-4">
              {schedules.map((schedule) => (
                <div
                  key={schedule.id}
                  className="p-4 rounded-lg border border-primary/30 bg-background/50 hover:bg-background/80 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-5 h-5 text-primary" />
                        <span className="font-bold text-glow">{schedule.trainset_id}</span>
                        <Badge className={getStatusColor(schedule.status)}>
                          {schedule.status.replace('_', ' ')}
                        </Badge>
                        <Badge className={getTypeColor(schedule.cleaning_type)}>
                          {schedule.cleaning_type}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {new Date(schedule.scheduled_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {schedule.scheduled_time}
                        </div>
                        {schedule.bay_number && (
                          <div>Bay: {schedule.bay_number}</div>
                        )}
                      </div>

                      {schedule.assigned_crew && schedule.assigned_crew.length > 0 && (
                        <div className="mt-2 text-sm">
                          <span className="text-muted-foreground">Crew:</span>{' '}
                          {schedule.assigned_crew.join(', ')}
                        </div>
                      )}

                      {schedule.notes && (
                        <div className="mt-2 text-sm text-muted-foreground italic">
                          {schedule.notes}
                        </div>
                      )}
                    </div>

                    {schedule.quality_score && (
                      <div className="text-center ml-4">
                        <div className="text-2xl font-bold text-glow">{schedule.quality_score}</div>
                        <div className="text-xs text-muted-foreground">/ 10</div>
                      </div>
                    )}
                  </div>

                  {schedule.status === 'completed' && schedule.completion_time && (
                    <div className="flex items-center gap-2 text-sm text-green-500 pt-2 border-t border-primary/20">
                      <CheckCircle className="w-4 h-4" />
                      Completed at {new Date(schedule.completion_time).toLocaleString()}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CleaningDetailing;
