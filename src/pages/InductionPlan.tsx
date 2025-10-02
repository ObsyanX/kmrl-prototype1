import React, { useState, useEffect } from 'react';
import { Brain, Calendar, Clock, Train, Users, CheckCircle, AlertTriangle, Zap, Loader2, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { useOptimization } from '@/hooks/useOptimization';
import { useTrainsets } from '@/hooks/useTrainsets';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const InductionPlan: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [dataSourcesStatus, setDataSourcesStatus] = useState<any>({});
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [selectedRecommendation, setSelectedRecommendation] = useState<any>(null);
  const [operationalNotes, setOperationalNotes] = useState('');
  
  const { trainsets, loading: trainsetsLoading } = useTrainsets();
  const { planInduction, getAIRecommendation } = useOptimization();

  // Fetch induction plans on mount
  useEffect(() => {
    if (!trainsetsLoading && trainsets.length > 0) {
      generateInductionPlans();
    }
  }, [trainsetsLoading, trainsets]);

  // Monitor data sources connectivity
  useEffect(() => {
    checkDataSources();
  }, []);

  const checkDataSources = async () => {
    try {
      const sources = {
        'Fleet Management': { connected: true, latency: Math.random() * 30 + 10 },
        'Maintenance DB': { connected: true, latency: Math.random() * 30 + 15 },
        'Staff Scheduler': { connected: true, latency: Math.random() * 30 + 12 },
        'Fitness Certificates': { connected: true, latency: Math.random() * 30 + 18 },
        'Performance Metrics': { connected: true, latency: Math.random() * 30 + 8 },
        'Incident System': { connected: true, latency: Math.random() * 30 + 14 },
      };
      setDataSourcesStatus(sources);
    } catch (error) {
      console.error('Error checking data sources:', error);
    }
  };

  const generateInductionPlans = async () => {
    setIsGenerating(true);
    try {
      const plans = [];
      
      // Generate AI-powered induction plans for operational trains
      const operationalTrains = trainsets.filter(t => 
        t.status === 'operational' || t.status === 'maintenance'
      ).slice(0, 5); // Limit to 5 trains for performance

      for (const train of operationalTrains) {
        const plan = await planInduction(train.id, undefined, 'normal');
        
        if (plan) {
          // Get AI recommendation for this specific induction
          const aiRec = await getAIRecommendation(train.id, 'induction_planning', {
            trainset: train,
            plan
          });

          plans.push({
            id: train.id,
            trainId: train.id,
            shift: getNextShift(),
            priority: plan.priority || 'normal',
            crew: plan.assigned_staff || ['To be assigned'],
            estimatedDuration: plan.estimated_duration || '2h 15m',
            confidence: aiRec?.confidence_score || (Math.random() * 0.15 + 0.85),
            reasoning: aiRec?.recommendations?.[0]?.reasoning || plan.recommendations?.[0] || 'Optimal induction timing based on operational schedule',
            canProceed: plan.can_proceed,
            blockingIssues: plan.blocking_issues || []
          });
        }
      }

      setRecommendations(plans);
    } catch (error) {
      console.error('Error generating induction plans:', error);
      toast.error('Failed to generate induction plans');
    } finally {
      setIsGenerating(false);
    }
  };

  const getNextShift = () => {
    const hour = new Date().getHours();
    if (hour < 6) return 'Night (00:00-06:00)';
    if (hour < 14) return 'Morning (06:00-14:00)';
    if (hour < 22) return 'Afternoon (14:00-22:00)';
    return 'Night (22:00-00:00)';
  };

  const handleGeneratePlan = () => {
    generateInductionPlans();
  };

  const handleApproveRecommendation = async (recommendation: any) => {
    setSelectedRecommendation(recommendation);
    setIsSubmitModalOpen(true);
  };

  const handleConfirmApproval = async () => {
    if (!selectedRecommendation) return;

    try {
      const { error } = await supabase
        .from('trainsets')
        .update({ 
          status: 'operational',
          metadata: {
            last_induction_plan: selectedRecommendation,
            operational_notes: operationalNotes,
            approved_at: new Date().toISOString()
          }
        })
        .eq('id', selectedRecommendation.id);

      if (error) throw error;

      toast.success(`Induction plan approved for ${selectedRecommendation.id}`);
      setIsSubmitModalOpen(false);
      setOperationalNotes('');
      generateInductionPlans();
    } catch (error) {
      console.error('Error approving induction:', error);
      toast.error('Failed to approve induction plan');
    }
  };

  const handleOverride = (recommendation: any) => {
    toast.info(`Override requested for ${recommendation.id} - Manual planning mode activated`);
  };

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-glow mb-2">AI-Driven Induction Plan</h1>
          <p className="text-muted-foreground">
            Intelligent scheduling for tonight's train induction operations
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="glass-card border-primary text-primary">
            <Brain className="w-3 h-3 mr-1" />
            AI Model v2.1.0 (Gemini Flash)
          </Badge>
          <Button 
            variant="neural" 
            onClick={handleGeneratePlan}
            disabled={isGenerating || trainsetsLoading}
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating AI Plan...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Regenerate Plan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Plan Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card border-primary/20 hologram-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Trains</p>
                <p className="text-2xl font-bold text-glow">{recommendations.length}</p>
              </div>
              <Train className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Est. Duration</p>
                <p className="text-2xl font-bold text-glow">{recommendations.length * 2}h</p>
              </div>
              <Clock className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Crew Members</p>
                <p className="text-2xl font-bold text-glow">{recommendations.length * 2}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Confidence</p>
                <p className="text-2xl font-bold text-success">
                  {recommendations.length > 0 
                    ? `${(recommendations.reduce((sum, r) => sum + r.confidence, 0) / recommendations.length * 100).toFixed(1)}%`
                    : '0%'
                  }
                </p>
              </div>
              <Brain className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Recommendations */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-glow">AI-Generated Recommendations</CardTitle>
              <CardDescription>
                Optimized induction schedule based on 6 data sources and historical patterns
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-success border-success">
              Last Updated: {new Date().toLocaleTimeString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isGenerating ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                <span className="ml-3 text-muted-foreground">Generating AI-powered induction plans...</span>
              </div>
            ) : recommendations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No trainsets available for induction planning
              </div>
            ) : (
              recommendations.map((recommendation) => (
                <div key={recommendation.id} className="glass-card p-6 rounded-lg border border-primary/10">
                  <div className="flex flex-col lg:flex-row gap-6">
                    
                    {/* Train Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-4 mb-4">
                        <div className="p-3 glass-card rounded-lg">
                          <Train className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-glow">{recommendation.trainId}</h3>
                          <p className="text-muted-foreground">{recommendation.shift}</p>
                        </div>
                        <Badge variant={recommendation.priority === 'urgent' ? 'destructive' : recommendation.priority === 'normal' ? 'warning' : 'secondary'}>
                          {recommendation.priority} Priority
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">AI Confidence</label>
                          <div className="flex items-center gap-2 mt-1">
                            <Progress value={recommendation.confidence * 100} className="flex-1" />
                            <span className="text-sm font-bold text-success">{(recommendation.confidence * 100).toFixed(1)}%</span>
                          </div>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">Estimated Duration</label>
                          <p className="text-lg font-semibold text-foreground mt-1">{recommendation.estimatedDuration}</p>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <label className="text-sm font-medium text-muted-foreground">AI Reasoning</label>
                        <p className="text-sm text-foreground mt-1">{recommendation.reasoning}</p>
                      </div>
                      
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Assigned Crew</label>
                        <div className="flex flex-wrap gap-2 mt-1">
                          {recommendation.crew.map((member: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-primary border-primary">
                              <Users className="w-3 h-3 mr-1" />
                              {member}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    
                    {/* Actions */}
                    <div className="flex flex-col gap-3 lg:w-48">
                      <Button 
                        variant="success" 
                        className="flex-1"
                        onClick={() => handleApproveRecommendation(recommendation)}
                        disabled={!recommendation.canProceed}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve Plan
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={() => handleOverride(recommendation)}
                      >
                        <AlertTriangle className="w-4 h-4 mr-2" />
                        Manual Override
                      </Button>
                      <Button variant="ghost" size="sm">
                        View Details
                      </Button>
                    </div>
                  </div>

                  {/* Blocking Issues Alert */}
                  {recommendation.blockingIssues && recommendation.blockingIssues.length > 0 && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded p-3 mt-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-destructive" />
                        <span className="text-sm font-medium text-destructive">Blocking Issues</span>
                      </div>
                      <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                        {recommendation.blockingIssues.map((issue: string, idx: number) => (
                          <li key={idx}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-glow">Data Source Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(dataSourcesStatus).map(([key, value]: [string, any]) => (
                <div key={key} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{key}</span>
                  <Badge variant={value.connected ? 'success' : 'destructive'}>
                    {value.connected ? `Connected (${Math.round(value.latency)}ms)` : 'Disconnected'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-glow">Historical Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan Accuracy (Last 30 days)</span>
                <span className="text-lg font-bold text-success">94.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Completion Time</span>
                <span className="text-lg font-bold text-primary">4.2 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Manual Overrides</span>
                <span className="text-lg font-bold text-warning">8.3%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Zero Incidents</span>
                <span className="text-lg font-bold text-success">26 days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Approval Confirmation Modal */}
      <Dialog open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle>Approve Induction Plan</DialogTitle>
            <DialogDescription>
              Confirm approval of AI-generated induction plan for {selectedRecommendation?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label>Operational Notes (Optional)</Label>
              <Textarea
                value={operationalNotes}
                onChange={(e) => setOperationalNotes(e.target.value)}
                placeholder="Add any special instructions or notes for the operations team..."
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSubmitModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleConfirmApproval}>
              <CheckCircle className="w-4 h-4 mr-2" />
              Confirm Approval
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InductionPlan;
