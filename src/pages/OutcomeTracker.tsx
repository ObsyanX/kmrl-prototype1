import React, { useState, useEffect } from 'react';
import { TrendingUp, CheckCircle, XCircle, Clock, Brain, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAdvancedOptimization } from '@/hooks/useAdvancedOptimization';

const OutcomeTracker: React.FC = () => {
  const [outcomes, setOutcomes] = useState<any[]>([]);
  const [selectedOutcome, setSelectedOutcome] = useState<any>(null);
  const [actualData, setActualData] = useState({
    actual_induction_time: '',
    actual_duration_minutes: 0,
    actual_conflicts: 0,
    weather_impact_actual: 0,
    congestion_impact_actual: 0,
    punctuality_achieved: true,
  });
  const { analyzePatterns } = useAdvancedOptimization();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchPendingOutcomes();
  }, []);

  const fetchPendingOutcomes = async () => {
    try {
      const { data, error } = await supabase
        .from('operation_outcomes')
        .select('*')
        .eq('actual_duration_minutes', 0)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setOutcomes(data || []);
    } catch (error) {
      console.error('Error fetching outcomes:', error);
      toast.error('Failed to fetch pending outcomes');
    }
  };

  const handleSelectOutcome = (outcome: any) => {
    setSelectedOutcome(outcome);
    setActualData({
      actual_induction_time: outcome.actual_induction_time || new Date().toISOString(),
      actual_duration_minutes: 0,
      actual_conflicts: 0,
      weather_impact_actual: 0,
      congestion_impact_actual: 0,
      punctuality_achieved: true,
    });
  };

  const handleUpdateOutcome = async () => {
    if (!selectedOutcome) return;

    try {
      const deviationMinutes = Math.abs(
        actualData.actual_duration_minutes - selectedOutcome.predicted_duration_minutes
      );

      const successScore = calculateSuccessScore(
        deviationMinutes,
        actualData.actual_conflicts,
        selectedOutcome.predicted_conflicts,
        actualData.punctuality_achieved
      );

      const { error } = await supabase
        .from('operation_outcomes')
        .update({
          actual_induction_time: actualData.actual_induction_time,
          actual_duration_minutes: actualData.actual_duration_minutes,
          actual_conflicts: actualData.actual_conflicts,
          weather_impact_actual: actualData.weather_impact_actual,
          congestion_impact_actual: actualData.congestion_impact_actual,
          punctuality_achieved: actualData.punctuality_achieved,
          deviation_minutes: deviationMinutes,
          success_score: successScore,
          learning_data: {
            ...selectedOutcome.learning_data,
            status: 'completed',
            updated_at: new Date().toISOString(),
            accuracy_metrics: {
              duration_accuracy: 1 - (deviationMinutes / selectedOutcome.predicted_duration_minutes),
              conflict_accuracy: selectedOutcome.predicted_conflicts === actualData.actual_conflicts ? 1 : 0,
              weather_accuracy: 1 - Math.abs(actualData.weather_impact_actual - selectedOutcome.weather_impact_predicted) / 10,
              congestion_accuracy: 1 - Math.abs(actualData.congestion_impact_actual - selectedOutcome.congestion_impact_predicted) / 10,
            }
          }
        })
        .eq('id', selectedOutcome.id);

      if (error) throw error;

      toast.success('Outcome updated successfully - AI learning from this data');
      setSelectedOutcome(null);
      fetchPendingOutcomes();
    } catch (error) {
      console.error('Error updating outcome:', error);
      toast.error('Failed to update outcome');
    }
  };

  const calculateSuccessScore = (
    deviationMinutes: number,
    actualConflicts: number,
    predictedConflicts: number,
    punctuality: boolean
  ): number => {
    let score = 1.0;

    // Penalize for time deviation (max 30%)
    score -= Math.min(0.3, deviationMinutes / 100);

    // Penalize for conflict prediction mismatch (max 30%)
    const conflictDiff = Math.abs(actualConflicts - predictedConflicts);
    score -= Math.min(0.3, conflictDiff * 0.1);

    // Penalize for missed punctuality (40%)
    if (!punctuality) {
      score -= 0.4;
    }

    return Math.max(0, score);
  };

  const handleRunPatternAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      const results = await analyzePatterns(30);
      toast.success('Pattern analysis complete - Models updated with latest data');
    } catch (error) {
      console.error('Pattern analysis error:', error);
      toast.error('Failed to run pattern analysis');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-glow mb-2">Operation Outcome Tracker</h1>
          <p className="text-muted-foreground">
            Record actual results to improve AI accuracy through continuous learning
          </p>
        </div>
        <Button onClick={handleRunPatternAnalysis} disabled={isAnalyzing} variant="neural">
          {isAnalyzing ? (
            <>
              <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              Analyzing Patterns...
            </>
          ) : (
            <>
              <Brain className="w-4 h-4 mr-2" />
              Run Pattern Analysis
            </>
          )}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pending Outcomes List */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-glow">Pending Outcomes ({outcomes.length})</CardTitle>
            <CardDescription>
              Induction plans awaiting actual data entry
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {outcomes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>All outcomes have been recorded!</p>
                </div>
              ) : (
                outcomes.map((outcome) => (
                  <div
                    key={outcome.id}
                    onClick={() => handleSelectOutcome(outcome)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedOutcome?.id === outcome.id
                        ? 'border-primary bg-primary/10'
                        : 'border-border/50 hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold text-glow">{outcome.trainset_id}</span>
                      <Badge variant="outline">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(outcome.planned_induction_time).toLocaleDateString()}
                      </Badge>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Predicted: {outcome.predicted_duration_minutes} min
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Actual Data Entry Form */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-glow">Record Actual Outcome</CardTitle>
            <CardDescription>
              {selectedOutcome
                ? `Update data for ${selectedOutcome.trainset_id}`
                : 'Select an outcome to update'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedOutcome ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Actual Induction Time</Label>
                  <Input
                    type="datetime-local"
                    value={actualData.actual_induction_time.slice(0, 16)}
                    onChange={(e) =>
                      setActualData({ ...actualData, actual_induction_time: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label>Actual Duration (minutes)</Label>
                  <Input
                    type="number"
                    value={actualData.actual_duration_minutes}
                    onChange={(e) =>
                      setActualData({ ...actualData, actual_duration_minutes: parseInt(e.target.value) })
                    }
                    placeholder="e.g., 135"
                  />
                  <p className="text-xs text-muted-foreground">
                    Predicted: {selectedOutcome.predicted_duration_minutes} min
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Actual Conflicts Encountered</Label>
                  <Input
                    type="number"
                    min="0"
                    value={actualData.actual_conflicts}
                    onChange={(e) =>
                      setActualData({ ...actualData, actual_conflicts: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Predicted: {selectedOutcome.predicted_conflicts} conflicts
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Weather Impact (0-10)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={actualData.weather_impact_actual}
                    onChange={(e) =>
                      setActualData({ ...actualData, weather_impact_actual: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Predicted: {selectedOutcome.weather_impact_predicted}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Congestion Impact (0-10)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="10"
                    value={actualData.congestion_impact_actual}
                    onChange={(e) =>
                      setActualData({ ...actualData, congestion_impact_actual: parseInt(e.target.value) })
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Predicted: {selectedOutcome.congestion_impact_predicted}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label>Punctuality Achieved</Label>
                  <Select
                    value={actualData.punctuality_achieved.toString()}
                    onValueChange={(value) =>
                      setActualData({ ...actualData, punctuality_achieved: value === 'true' })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="true">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-success" />
                          Yes - On Time
                        </div>
                      </SelectItem>
                      <SelectItem value="false">
                        <div className="flex items-center gap-2">
                          <XCircle className="w-4 h-4 text-destructive" />
                          No - Delayed
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button onClick={handleUpdateOutcome} className="w-full" variant="neural">
                  <TrendingUp className="w-4 h-4 mr-2" />
                  Update Outcome & Train AI
                </Button>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                Select a pending outcome from the left to record actual data
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OutcomeTracker;
