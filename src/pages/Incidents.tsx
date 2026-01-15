import React, { useEffect, useState } from 'react';
import { AlertTriangle, AlertCircle, Info, CheckCircle2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const Incidents: React.FC = () => {
  const { toast } = useToast();
  const [incidents, setIncidents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncidents();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase
        .from('incidents' as any)
        .select('*')
        .order('reported_at', { ascending: false }) as any);

      if (error) throw error;
      setIncidents(data || []);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to fetch incidents",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle className="w-5 h-5 text-red-500" />;
      case 'major': return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'minor': return <Info className="w-5 h-5 text-yellow-500" />;
      default: return <Info className="w-5 h-5" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500';
      case 'major': return 'bg-orange-500';
      case 'minor': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'closed': return 'bg-green-500';
      case 'resolved': return 'bg-blue-500';
      case 'investigating': return 'bg-yellow-500';
      case 'open': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-glow mb-2">Incident Management</h1>
        <p className="text-muted-foreground">Track and resolve operational incidents</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Incidents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-glow">{incidents.length}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Open</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {incidents.filter(i => i.status === 'open').length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Critical</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">
              {incidents.filter(i => i.severity === 'critical' && i.status !== 'closed').length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Resolved</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {incidents.filter(i => i.status === 'resolved' || i.status === 'closed').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Recent Incidents
          </CardTitle>
          <CardDescription>Operational incidents and resolutions</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading incidents...</div>
          ) : incidents.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No incidents found</div>
          ) : (
            <div className="space-y-4">
              {incidents.map((incident) => (
                <div
                  key={incident.id}
                  className="p-4 rounded-lg border border-primary/30 bg-background/50 hover:bg-background/80 transition-all"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-start gap-3 flex-1">
                      {getSeverityIcon(incident.severity)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-bold text-glow">{incident.incident_number}</span>
                          <Badge className={getSeverityColor(incident.severity)}>
                            {incident.severity}
                          </Badge>
                          <Badge className={getStatusColor(incident.status)}>
                            {incident.status}
                          </Badge>
                        </div>
                        
                        <h3 className="font-semibold text-lg mb-2">{incident.title}</h3>
                        
                        {incident.description && (
                          <p className="text-sm text-muted-foreground mb-2">{incident.description}</p>
                        )}

                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div>Reported: {new Date(incident.reported_at).toLocaleString()}</div>
                          {incident.trainset_id && (
                            <div>Trainset: {incident.trainset_id}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {incident.resolution_notes && (
                    <div className="mt-3 p-3 rounded bg-green-500/10 border border-green-500/20">
                      <div className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-500 mt-0.5" />
                        <div className="flex-1">
                          <div className="text-sm font-medium text-green-500 mb-1">Resolution</div>
                          <div className="text-sm text-muted-foreground">{incident.resolution_notes}</div>
                          {incident.resolved_at && (
                            <div className="text-xs text-muted-foreground mt-1">
                              Resolved at {new Date(incident.resolved_at).toLocaleString()}
                            </div>
                          )}
                        </div>
                      </div>
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

export default Incidents;