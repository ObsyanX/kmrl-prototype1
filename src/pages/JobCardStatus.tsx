import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ExternalLink, AlertTriangle, CheckCircle, Clock, Wrench, RefreshCw, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const JobCardStatus: React.FC = () => {
  const [isHoldModalOpen, setIsHoldModalOpen] = useState(false);
  const [holdJustification, setHoldJustification] = useState('');
  const [selectedTrain, setSelectedTrain] = useState('');
  const [maintenanceData, setMaintenanceData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchMaintenanceStatus();

    // Real-time updates
    const channel = supabase
      .channel('job_card_updates')
      .on('postgres_changes',
        { event: '*', schema: 'public', table: 'maintenance_jobs' },
        () => {
          fetchMaintenanceStatus();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMaintenanceStatus = async () => {
    try {
      setLoading(true);
      
      // Fetch trainsets with maintenance jobs
      const { data: trainsets, error: trainsetsError } = await (supabase
        .from('trainsets' as any)
        .select('*') as any);

      if (trainsetsError) throw trainsetsError;

      // Fetch maintenance jobs
      const { data: jobs, error: jobsError } = await (supabase
        .from('maintenance_jobs' as any)
        .select('*')
        .in('status', ['pending', 'in_progress', 'scheduled']) as any);

      if (jobsError) throw jobsError;

      // Process data for each train
      const enrichedData = trainsets.map((train: any) => {
        const trainJobs = jobs?.filter((j: any) => j.trainset_id === train.id) || [];
        
        const criticalJobs = trainJobs.filter(j => j.priority === 'critical').length;
        const majorJobs = trainJobs.filter(j => j.priority === 'high').length;
        const minorJobs = trainJobs.filter(j => j.priority === 'medium' || j.priority === 'low').length;
        
        const releaseFlag = trainJobs.length === 0 || criticalJobs === 0;
        const manualHold = train.metadata?.manual_hold || false;

        return {
          id: train.id,
          status: train.status === 'maintenance' ? 'In IBL' : train.status === 'operational' ? 'In Service' : 'On Standby',
          location: train.current_stabling_position || train.current_location || 'Unknown',
          lastSync: 'Live',
          criticalJobs,
          majorJobs,
          minorJobs,
          releaseFlag,
          manualHold,
          totalJobs: trainJobs.length,
          maximoLink: trainJobs[0]?.maximo_job_id || null,
          holdReason: train.metadata?.hold_reason || null
        };
      });

      setMaintenanceData(enrichedData);
    } catch (error) {
      console.error('Error fetching maintenance status:', error);
      toast.error('Failed to fetch job card status');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'In Service': return 'success';
      case 'In IBL': return 'warning';
      case 'On Standby': return 'secondary';
      default: return 'secondary';
    }
  };

  const getSeverityColor = (severity: string, count: number) => {
    if (count === 0) return 'secondary';
    switch (severity) {
      case 'critical': return 'destructive';
      case 'major': return 'warning';
      case 'minor': return 'default';
      default: return 'secondary';
    }
  };

  const getHexagonPosition = (index: number) => {
    const positions = [
      { x: 20, y: 20 }, { x: 60, y: 20 }, { x: 100, y: 20 },
      { x: 40, y: 60 }, { x: 80, y: 60 }
    ];
    return positions[index] || { x: 50, y: 50 };
  };

  const getHexagonIntensity = (train: any) => {
    if (train.criticalJobs > 0) return 'critical';
    if (train.majorJobs > 0) return 'major';
    if (train.minorJobs > 0) return 'minor';
    return 'clear';
  };

  const getIntensityColor = (intensity: string) => {
    switch (intensity) {
      case 'critical': return 'bg-destructive/80';
      case 'major': return 'bg-warning/60';
      case 'minor': return 'bg-primary/40';
      case 'clear': return 'bg-success/20';
      default: return 'bg-secondary/20';
    }
  };

  const handleManualHold = (trainId: string) => {
    setSelectedTrain(trainId);
    setIsHoldModalOpen(true);
  };

  const handleConfirmHold = async () => {
    if (holdJustification.length < 25) {
      toast.error('Please provide at least 25 characters of justification');
      return;
    }

    try {
      const { error } = await (supabase
        .from('trainsets' as any)
        .update({
          metadata: {
            manual_hold: true,
            hold_reason: holdJustification,
            hold_timestamp: new Date().toISOString()
          }
        })
        .eq('id', selectedTrain) as any);

      if (error) throw error;

      toast.success(`Manual hold placed on ${selectedTrain}`);
      setIsHoldModalOpen(false);
      setHoldJustification('');
      fetchMaintenanceStatus();
    } catch (error) {
      console.error('Error placing hold:', error);
      toast.error('Failed to place manual hold');
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-glow">Maintenance Work Orders</h1>
          <p className="text-muted-foreground">Real-time interface to IBM Maximo maintenance system</p>
        </div>
        <Button variant="outline" className="gap-2" onClick={fetchMaintenanceStatus} disabled={loading}>
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Sync with Maximo
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Trains in Service</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              {maintenanceData.filter(t => t.status === 'In Service').length}
            </div>
            <p className="text-xs text-muted-foreground">Ready for operation</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">In Maintenance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {maintenanceData.filter(t => t.status === 'In IBL').length}
            </div>
            <p className="text-xs text-muted-foreground">Active work orders</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {maintenanceData.reduce((sum, t) => sum + t.criticalJobs, 0)}
            </div>
            <p className="text-xs text-muted-foreground">Requiring immediate attention</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Manual Holds</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              {maintenanceData.filter(t => t.manualHold).length}
            </div>
            <p className="text-xs text-muted-foreground">Supervisor overrides</p>
          </CardContent>
        </Card>
      </div>

      {/* Honeycomb Grid Visualization */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wrench className="w-5 h-5" />
            Fleet Maintenance Overview
          </CardTitle>
          <CardDescription>Interactive honeycomb grid showing maintenance severity by color intensity</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 relative bg-gradient-to-br from-primary/5 to-kmrl-green/5 rounded-lg border border-primary/20">
            {maintenanceData.slice(0, 5).map((train, index) => {
              const position = getHexagonPosition(index);
              const intensity = getHexagonIntensity(train);
              const intensityColor = getIntensityColor(intensity);
              
              return (
                <div
                  key={train.id}
                  className={`absolute cursor-pointer transition-all duration-300 hover:scale-110 ${intensityColor}`}
                  style={{
                    left: `${position.x}%`,
                    top: `${position.y}%`,
                    width: '80px',
                    height: '80px',
                    clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
                    transform: 'translate(-50%, -50%)',
                  }}
                >
                  <div className="w-full h-full flex items-center justify-center">
                    <div className="text-center">
                      <div className="font-bold text-sm">{train.id}</div>
                      <div className="text-xs">
                        {train.criticalJobs > 0 && <span className="text-destructive">●</span>}
                        {train.majorJobs > 0 && <span className="text-warning">●</span>}
                        {train.minorJobs > 0 && <span className="text-primary">●</span>}
                        {train.totalJobs === 0 && <span className="text-success">●</span>}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {/* Legend */}
            <div className="absolute bottom-4 left-4 right-4 glass-card p-3">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <span className="text-destructive">●</span>
                    <span>Critical</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-warning">●</span>
                    <span>Major</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-primary">●</span>
                    <span>Minor</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-success">●</span>
                    <span>No Issues</span>
                  </div>
                </div>
                <div className="text-muted-foreground">
                  Click hexagon for detailed work order summary
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Train Status */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Detailed Maintenance Status</CardTitle>
          <CardDescription>Complete work order breakdown with Maximo integration</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading job card status...</span>
            </div>
          ) : (
            <div className="space-y-4">
              {maintenanceData.map((train) => (
                <div key={train.id} className="glass-card p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <h3 className="font-semibold text-xl">{train.id}</h3>
                      <Badge variant={getStatusColor(train.status) as any}>
                        {train.status}
                      </Badge>
                      {train.manualHold && (
                        <Badge variant="outline" className="border-primary text-primary">
                          Manual Hold
                        </Badge>
                      )}
                      {!train.releaseFlag && (
                        <AlertTriangle className="w-5 h-5 text-warning" />
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right text-sm">
                        <div className="text-muted-foreground">Location</div>
                        <div className="font-medium">{train.location}</div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-muted-foreground">Last Sync</div>
                        <div className="font-medium text-success">{train.lastSync}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                      <Badge variant={getSeverityColor('critical', train.criticalJobs) as any} className="w-full">
                        {train.criticalJobs} Critical
                      </Badge>
                    </div>
                    <div className="text-center">
                      <Badge variant={getSeverityColor('major', train.majorJobs) as any} className="w-full">
                        {train.majorJobs} Major
                      </Badge>
                    </div>
                    <div className="text-center">
                      <Badge variant={getSeverityColor('minor', train.minorJobs) as any} className="w-full">
                        {train.minorJobs} Minor
                      </Badge>
                    </div>
                    <div className="text-center">
                      <div className={`flex items-center justify-center gap-2 p-2 rounded ${
                        train.releaseFlag ? 'bg-success/20 text-success' : 'bg-destructive/20 text-destructive'
                      }`}>
                        {train.releaseFlag ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">Clear for Service</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4" />
                            <span className="text-sm font-medium">Hold for Maintenance</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {train.manualHold && train.holdReason && (
                    <div className="bg-primary/10 border border-primary/20 rounded p-3">
                      <div className="text-sm font-medium text-primary mb-1">Manual Hold Reason:</div>
                      <div className="text-sm text-muted-foreground">{train.holdReason}</div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-2 border-t border-primary/10">
                    <div className="flex items-center gap-4">
                      {train.maximoLink && (
                        <Button variant="outline" size="sm" className="gap-2">
                          <ExternalLink className="w-4 h-4" />
                          View in Maximo ({train.maximoLink})
                        </Button>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`hold-${train.id}`} className="text-sm">
                          Manual Hold
                        </Label>
                        <Switch
                          id={`hold-${train.id}`}
                          checked={train.manualHold}
                          onCheckedChange={() => !train.manualHold && handleManualHold(train.id)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Manual Hold Modal */}
      <Dialog open={isHoldModalOpen} onOpenChange={setIsHoldModalOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Place Manual Hold - {selectedTrain}</DialogTitle>
            <DialogDescription>
              Provide justification for placing a manual maintenance hold on this train.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Reason for Manual Hold</Label>
              <Textarea
                value={holdJustification}
                onChange={(e) => setHoldJustification(e.target.value)}
                placeholder="Enter the reason for placing a manual hold (minimum 25 characters)..."
                className="min-h-[100px]"
                minLength={25}
              />
              <div className="text-xs text-muted-foreground">
                {holdJustification.length}/25 minimum characters
              </div>
            </div>
            
            <div className="flex gap-2 pt-4">
              <Button 
                onClick={handleConfirmHold}
                className="flex-1"
                disabled={holdJustification.length < 25}
              >
                Place Hold
              </Button>
              <Button variant="outline" onClick={() => setIsHoldModalOpen(false)}>
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default JobCardStatus;
