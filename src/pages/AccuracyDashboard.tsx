import React, { useEffect, useState } from 'react';
import { Activity, TrendingUp, Target, Brain, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AccuracyDashboard: React.FC = () => {
  const { toast } = useToast();
  const [metrics, setMetrics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    overallAccuracy: 0,
    totalPredictions: 0,
    accuratePredictions: 0,
    modelVersion: '2.0.0'
  });

  useEffect(() => {
    fetchAccuracyMetrics();
  }, []);

  const fetchAccuracyMetrics = async () => {
    try {
      setLoading(true);
      
      // Fetch last 30 days of accuracy metrics
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data, error } = await supabase
        .from('accuracy_metrics')
        .select('*')
        .gte('metric_date', thirtyDaysAgo.toISOString().split('T')[0])
        .order('metric_date', { ascending: false });

      if (error) throw error;

      setMetrics(data || []);

      // Calculate overall summary
      if (data && data.length > 0) {
        const totalPreds = data.reduce((sum, m) => sum + (m.total_predictions || 0), 0);
        const accuratePreds = data.reduce((sum, m) => sum + (m.accurate_predictions || 0), 0);
        const overallAcc = totalPreds > 0 ? (accuratePreds / totalPreds) * 100 : 0;

        setSummary({
          overallAccuracy: overallAcc,
          totalPredictions: totalPreds,
          accuratePredictions: accuratePreds,
          modelVersion: data[0].model_version || '2.0.0'
        });
      }

    } catch (error) {
      console.error('Error fetching accuracy metrics:', error);
      toast({
        title: "Error Loading Metrics",
        description: "Failed to fetch accuracy data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 95) return 'text-green-500';
    if (accuracy >= 85) return 'text-yellow-500';
    return 'text-red-500';
  };

  const getAccuracyBadge = (accuracy: number) => {
    if (accuracy >= 95) return <Badge className="bg-green-500">Excellent</Badge>;
    if (accuracy >= 85) return <Badge className="bg-yellow-500">Good</Badge>;
    if (accuracy >= 75) return <Badge className="bg-orange-500">Fair</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  // Group metrics by prediction type
  const metricsByType = metrics.reduce((acc: any, m) => {
    const type = m.prediction_type;
    if (!acc[type]) {
      acc[type] = [];
    }
    acc[type].push(m);
    return {};
  }, {});

  const predictionTypes = [
    { key: 'induction', label: 'Induction Planning', icon: Target },
    { key: 'duration', label: 'Duration Prediction', icon: Activity },
    { key: 'weather', label: 'Weather Impact', icon: TrendingUp },
    { key: 'conflict', label: 'Conflict Detection', icon: AlertTriangle },
    { key: 'demand', label: 'Demand Forecasting', icon: Brain }
  ];

  const getLatestMetricByType = (type: string) => {
    return metrics.find(m => m.prediction_type === type);
  };

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-glow mb-2">AI Accuracy Dashboard</h1>
        <p className="text-muted-foreground">Real-time ML model performance and continuous learning metrics</p>
      </div>

      {/* Overall Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${getAccuracyColor(summary.overallAccuracy)}`}>
              {summary.overallAccuracy.toFixed(2)}%
            </div>
            <Progress value={summary.overallAccuracy} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-2">Target: ≥95%</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-glow">{summary.totalPredictions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">Last 30 days</p>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Accurate Predictions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{summary.accuratePredictions.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {summary.totalPredictions > 0 
                ? `${((summary.accuratePredictions / summary.totalPredictions) * 100).toFixed(1)}% success rate`
                : 'No data'}
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Model Version</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-glow">{summary.modelVersion}</div>
            <Badge className="mt-2" variant="outline">
              <CheckCircle className="w-3 h-3 mr-1" />
              Active
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Prediction Type Breakdown */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow flex items-center gap-2">
            <Brain className="w-5 h-5" />
            Performance by Prediction Type
          </CardTitle>
          <CardDescription>Accuracy metrics across different AI models</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading metrics...</div>
          ) : (
            predictionTypes.map(type => {
              const metric = getLatestMetricByType(type.key);
              const Icon = type.icon;
              
              return (
                <div key={type.key} className="flex items-center justify-between p-4 rounded-lg bg-background/50">
                  <div className="flex items-center gap-3 flex-1">
                    <Icon className="w-5 h-5 text-primary" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{type.label}</span>
                        {metric && getAccuracyBadge(metric.accuracy_percentage || 0)}
                      </div>
                      <Progress 
                        value={metric?.accuracy_percentage || 0} 
                        className="h-2"
                      />
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`text-2xl font-bold ${getAccuracyColor(metric?.accuracy_percentage || 0)}`}>
                      {metric ? `${(metric.accuracy_percentage || 0).toFixed(1)}%` : 'N/A'}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {metric ? `${metric.accurate_predictions}/${metric.total_predictions} accurate` : 'No data'}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>

      {/* Recent Learning Events */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Continuous Learning Progress
          </CardTitle>
          <CardDescription>Model improvements over time</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {metrics.slice(0, 10).map((metric, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 rounded bg-background/30">
                <div>
                  <div className="font-medium capitalize">{metric.prediction_type.replace('_', ' ')}</div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(metric.metric_date).toLocaleDateString()} • v{metric.model_version}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`font-bold ${getAccuracyColor(metric.accuracy_percentage || 0)}`}>
                    {(metric.accuracy_percentage || 0).toFixed(1)}%
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {metric.total_predictions} predictions
                  </div>
                </div>
              </div>
            ))}
            {metrics.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No learning data yet. System will update as predictions are made.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AccuracyDashboard;
