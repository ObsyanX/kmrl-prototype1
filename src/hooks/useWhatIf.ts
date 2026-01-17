/**
 * What-If Swap Analysis Hook
 * Provides state management for swap analysis UI
 */

import { useState, useCallback } from 'react';
import { 
  whatIfService, 
  TrainInfo, 
  SwapAnalysis, 
  SwapScenario 
} from '@/services/whatIfService';
import { toast } from 'sonner';

export function useWhatIf() {
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [standbyTrains, setStandbyTrains] = useState<TrainInfo[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState<SwapAnalysis | null>(null);
  const [scenarios, setScenarios] = useState<SwapScenario[]>([]);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch available standby trains
   */
  const fetchStandbyTrains = useCallback(async () => {
    try {
      const trains = await whatIfService.getStandbyTrains();
      setStandbyTrains(trains);
      return trains;
    } catch (err) {
      console.error('Failed to fetch standby trains:', err);
      setError('Failed to load standby trains');
      return [];
    }
  }, []);

  /**
   * Analyze a potential swap
   */
  const analyzeSwap = useCallback(async (
    scheduledTrain: TrainInfo,
    standbyTrain: TrainInfo,
    reason?: string
  ): Promise<SwapAnalysis | null> => {
    setIsAnalyzing(true);
    setError(null);
    
    try {
      const analysis = await whatIfService.analyzeSwap(
        scheduledTrain,
        standbyTrain,
        reason
      );
      setCurrentAnalysis(analysis);
      
      // Show toast based on recommendation
      switch (analysis.recommendation) {
        case 'ACCEPTED':
          toast.success('Swap recommended: Positive impact on operations');
          break;
        case 'FEASIBLE':
          toast.info('Swap is feasible with minor trade-offs');
          break;
        case 'REVIEW_REQUIRED':
          toast.warning('Manual review required before proceeding');
          break;
        case 'REJECTED':
          toast.error('Swap not recommended: Significant negative impact');
          break;
      }
      
      return analysis;
    } catch (err) {
      console.error('Swap analysis failed:', err);
      setError('Analysis failed. Please try again.');
      toast.error('Failed to analyze swap');
      return null;
    } finally {
      setIsAnalyzing(false);
    }
  }, []);

  /**
   * Get all possible swap scenarios
   */
  const fetchAllScenarios = useCallback(async (
    scheduledTrains: TrainInfo[]
  ): Promise<SwapScenario[]> => {
    try {
      const allScenarios = await whatIfService.getAllSwapScenarios(scheduledTrains);
      setScenarios(allScenarios);
      return allScenarios;
    } catch (err) {
      console.error('Failed to fetch scenarios:', err);
      setError('Failed to load scenarios');
      return [];
    }
  }, []);

  /**
   * Execute a swap decision
   */
  const executeSwap = useCallback(async (
    scheduledTrain: TrainInfo,
    standbyTrain: TrainInfo,
    reason: string,
    analysis: SwapAnalysis
  ): Promise<boolean> => {
    if (analysis.recommendation === 'REJECTED') {
      const confirm = window.confirm(
        'This swap is not recommended. Are you sure you want to proceed?'
      );
      if (!confirm) return false;
    }
    
    setIsExecuting(true);
    setError(null);
    
    try {
      await whatIfService.executeSwap(
        scheduledTrain,
        standbyTrain,
        reason,
        analysis
      );
      
      toast.success(`Swap executed: ${standbyTrain.name} will replace ${scheduledTrain.name}`);
      setCurrentAnalysis(null);
      
      return true;
    } catch (err) {
      console.error('Failed to execute swap:', err);
      setError('Failed to execute swap. Please try again.');
      toast.error('Swap execution failed');
      return false;
    } finally {
      setIsExecuting(false);
    }
  }, []);

  /**
   * Clear current analysis
   */
  const clearAnalysis = useCallback(() => {
    setCurrentAnalysis(null);
    setError(null);
  }, []);

  /**
   * Get recommendation color
   */
  const getRecommendationColor = (recommendation: SwapAnalysis['recommendation']): string => {
    switch (recommendation) {
      case 'ACCEPTED':
        return 'text-success';
      case 'FEASIBLE':
        return 'text-primary';
      case 'REVIEW_REQUIRED':
        return 'text-warning';
      case 'REJECTED':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  /**
   * Get recommendation badge variant
   */
  const getRecommendationBadge = (recommendation: SwapAnalysis['recommendation']): string => {
    switch (recommendation) {
      case 'ACCEPTED':
        return 'success';
      case 'FEASIBLE':
        return 'default';
      case 'REVIEW_REQUIRED':
        return 'warning';
      case 'REJECTED':
        return 'destructive';
      default:
        return 'secondary';
    }
  };

  return {
    // State
    isAnalyzing,
    isExecuting,
    standbyTrains,
    currentAnalysis,
    scenarios,
    error,
    
    // Actions
    fetchStandbyTrains,
    analyzeSwap,
    fetchAllScenarios,
    executeSwap,
    clearAnalysis,
    
    // Helpers
    getRecommendationColor,
    getRecommendationBadge,
  };
}
