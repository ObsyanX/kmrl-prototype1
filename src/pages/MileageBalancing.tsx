import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import { Train, TrendingUp, TrendingDown, AlertTriangle, Settings, BarChart3, Loader2, RefreshCw, Brain } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOptimization } from '@/hooks/useOptimization';
import { useTrainsets } from '@/hooks/useTrainsets';

const MileageBalancing: React.FC = () => {
  const [alertThreshold, setAlertThreshold] = useState([15]);
  const [fleetData, setFleetData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [fleetAverage, setFleetAverage] = useState(0);
  const [balancingRecommendations, setBalancingRecommendations] = useState<any>(null);
  const { getAIRecommendation } = useOptimization();
  const { trainsets } = useTrainsets();

  useEffect(() => {
    fetchMileageData();
  }, [trainsets]);

  const fetchMileageData = async () => {
    try {
      setLoading(true);
      
      // Fetch mileage records for last 30 days
      const { data: mileageRecords, error: mileageError } = await supabase
        .from('mileage_records')
        .select('*')
        .gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      if (mileageError) throw mileageError;

      // Process trainset mileage data
      const enrichedData = trainsets.map((train: any) => {
        const totalMileage = Number(train.total_mileage) || 0;
        const trainRecords = mileageRecords?.filter((r: any) => r.trainset_id === train.id) || [];
        const last30DaysMileage = trainRecords.reduce((sum: number, r: any) => sum + Number(r.daily_mileage || 0), 0);
        
        return {
          trainId: train.id,
          mileage: totalMileage,
          last30Days: last30DaysMileage,
          bogies: Math.round(totalMileage * 0.95),
          brakes: Math.round(totalMileage * 0.92),
          hvac: Math.round(totalMileage * 0.88)
        };
      });

      // Calculate fleet average
      const average = enrichedData.reduce((sum, t) => sum + t.mileage, 0) / (enrichedData.length || 1);
      
      // Add variance and status
      const dataWithStatus = enrichedData.map(train => {
        const variance = ((train.mileage - average) / average * 100);
        let status: 'over' | 'under' | 'normal' = 'normal';
        if (variance > alertThreshold[0]) status = 'over';
        else if (variance < -alertThreshold[0]) status = 'under';

        return { ...train, variance: variance.toFixed(1), status };
      });

      setFleetData(dataWithStatus);
      setFleetAverage(average);

      // Get AI balancing recommendations
      const aiRec = await getAIRecommendation(undefined, 'resource_allocation', {
        fleet_data: dataWithStatus,
        threshold: alertThreshold[0]
      });
      setBalancingRecommendations(aiRec);
    } catch (error) {
      console.error('Error fetching mileage data:', error);
      toast.error('Failed to fetch mileage data');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over': return 'destructive';
      case 'under': return 'warning';
      default: return 'success';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'over': return 'Over Utilized';
      case 'under': return 'Under Utilized';
      default: return 'Balanced';
    }
  };

  const overUtilized = fleetData.filter(t => t.status === 'over').length;
  const underUtilized = fleetData.filter(t => t.status === 'under').length;

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-glow mb-2">AI-Powered Mileage Balancing</h1>
          <p className="text-muted-foreground">
            Optimize fleet utilization and component wear through intelligent mileage distribution
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchMileageData} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="neural">
            <Settings className="w-4 h-4 mr-2" />
            Configure
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Fleet Average", value: `${Math.round(fleetAverage)} km`, icon: Train, color: "primary" },
          { title: "Over Utilized", value: overUtilized, icon: TrendingUp, color: "destructive" },
          { title: "Under Utilized", value: underUtilized, icon: TrendingDown, color: "warning" },
          { title: "Alert Threshold", value: `±${alertThreshold[0]}%`, icon: AlertTriangle, color: "secondary" }
        ].map((stat, index) => (
          <Card key={index} className="glass-card border-primary/20 hologram-glow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-glow">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${
                  stat.color === 'destructive' ? 'text-destructive' :
                  stat.color === 'warning' ? 'text-warning' :
                  stat.color === 'success' ? 'text-success' : 'text-primary'
                }`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Recommendations */}
      {balancingRecommendations && (
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-glow flex items-center gap-2">
              <Brain className="w-5 h-5" />
              AI Balancing Recommendations
            </CardTitle>
            <CardDescription>
              ML-powered suggestions for optimal fleet utilization (Confidence: {(balancingRecommendations.confidence_score * 100).toFixed(1)}%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {balancingRecommendations.recommendations?.slice(0, 3).map((rec: any, idx: number) => (
                <div key={idx} className="glass-card p-3 border border-primary/10">
                  <p className="text-sm text-foreground">{rec.action || rec.reasoning}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Alert Threshold Configuration */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow">Alert Threshold Configuration</CardTitle>
          <CardDescription>Set the deviation percentage for over/under utilization alerts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium">Deviation Threshold:</span>
              <Slider
                value={alertThreshold}
                onValueChange={(val) => {
                  setAlertThreshold(val);
                  fetchMileageData();
                }}
                max={30}
                min={5}
                step={1}
                className="flex-1"
              />
              <Badge variant="outline">±{alertThreshold[0]}%</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Analysis */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow">Detailed Fleet Analysis</CardTitle>
          <CardDescription>Individual train mileage breakdown with component wear tracking</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading mileage data...</span>
            </div>
          ) : fleetData.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No mileage data available
            </div>
          ) : (
            <div className="space-y-4">
              {fleetData.map((train) => {
                const deviationPercent = parseFloat(train.variance);
                const progressValue = 50 + deviationPercent; // Center at 50%
                
                return (
                  <div key={train.trainId} className="glass-card p-6 rounded-lg border border-primary/10">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <Train className="w-6 h-6 text-primary" />
                        <div>
                          <h3 className="font-bold text-foreground">{train.trainId}</h3>
                          <p className="text-sm text-muted-foreground">Total: {train.mileage} km | Last 30d: {train.last30Days} km</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={getStatusColor(train.status) as any}>
                          {getStatusLabel(train.status)}
                        </Badge>
                        <span className={`text-sm font-medium ${
                          deviationPercent > 0 ? 'text-destructive' : 
                          deviationPercent < 0 ? 'text-warning' : 'text-success'
                        }`}>
                          {deviationPercent > 0 ? '+' : ''}{train.variance}% from average
                        </span>
                      </div>
                    </div>

                    {/* Component Mileage */}
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Bogies</p>
                        <p className="text-sm font-medium">{train.bogies} km</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Brakes</p>
                        <p className="text-sm font-medium">{train.brakes} km</p>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">HVAC</p>
                        <p className="text-sm font-medium">{train.hvac} km</p>
                      </div>
                    </div>

                    {/* Mileage Progress Bar */}
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Under Utilized</span>
                        <span>Balanced</span>
                        <span>Over Utilized</span>
                      </div>
                      <Progress 
                        value={Math.min(100, Math.max(0, progressValue))}
                        className={`h-3 ${
                          train.status === 'over' ? '[&>div]:bg-destructive' :
                          train.status === 'under' ? '[&>div]:bg-warning' :
                          '[&>div]:bg-success'
                        }`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MileageBalancing;
