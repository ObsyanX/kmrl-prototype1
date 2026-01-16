import { useState, useEffect, useCallback } from 'react';
import { agamiService, InductionPlan, ConstraintRule, OptimizationResult } from '@/services/agamiService';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const useAgamiPlanner = (planDate?: string) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [plans, setPlans] = useState<InductionPlan[]>([]);
  const [constraintRules, setConstraintRules] = useState<ConstraintRule[]>([]);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [explanation, setExplanation] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const currentDate = planDate || new Date().toISOString().split('T')[0];

  // Fetch induction plans
  const fetchPlans = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await agamiService.getInductionPlans(currentDate);
      setPlans(data);
    } catch (err) {
      console.error('Error fetching plans:', err);
      setError('Failed to fetch induction plans');
      toast.error('Failed to load induction plans');
    } finally {
      setIsLoading(false);
    }
  }, [currentDate]);

  // Fetch constraint rules
  const fetchRules = useCallback(async () => {
    try {
      const data = await agamiService.getConstraintRules();
      setConstraintRules(data);
    } catch (err) {
      console.error('Error fetching rules:', err);
    }
  }, []);

  // Run optimization
  const runOptimization = useCallback(async (trainsetIds?: string[]) => {
    try {
      setIsOptimizing(true);
      setError(null);
      
      const result = await agamiService.runOptimization(new Date(currentDate), trainsetIds);
      setOptimizationResult(result);
      
      if (result.success) {
        toast.success(`Optimization complete: ${result.schedule.length} trains scheduled in ${result.executionTimeMs}ms`);
        await fetchPlans(); // Refresh plans
      } else {
        toast.error('Optimization failed - check conflicts');
      }
      
      return result;
    } catch (err) {
      console.error('Optimization error:', err);
      setError('Optimization failed');
      toast.error('Failed to run optimization');
      throw err;
    } finally {
      setIsOptimizing(false);
    }
  }, [currentDate, fetchPlans]);

  // Get AI explanation
  const getExplanation = useCallback(async (
    type: 'decision' | 'constraint' | 'risk' | 'override_impact' | 'what_if',
    planId?: string,
    trainsetId?: string,
    context?: any
  ) => {
    try {
      setIsLoading(true);
      const result = await agamiService.getExplanation(type, planId, trainsetId, context);
      setExplanation(result);
      return result;
    } catch (err: any) {
      console.error('Explanation error:', err);
      if (err.message?.includes('429')) {
        toast.error('AI rate limit exceeded. Please try again later.');
      } else if (err.message?.includes('402')) {
        toast.error('AI credits exhausted. Please add credits.');
      } else {
        toast.error('Failed to generate explanation');
      }
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Approve plan
  const approvePlan = useCallback(async (planId: string, notes?: string) => {
    try {
      await agamiService.approvePlan(planId, notes);
      toast.success('Plan approved and locked');
      await fetchPlans();
    } catch (err) {
      console.error('Approval error:', err);
      toast.error('Failed to approve plan');
      throw err;
    }
  }, [fetchPlans]);

  // Override plan
  const overridePlan = useCallback(async (planId: string, newValues: Partial<InductionPlan>, reason: string) => {
    try {
      await agamiService.overridePlan(planId, newValues, reason);
      toast.success('Plan overridden - audit logged');
      await fetchPlans();
    } catch (err) {
      console.error('Override error:', err);
      toast.error('Failed to override plan');
      throw err;
    }
  }, [fetchPlans]);

  // Update constraint rule
  const updateRule = useCallback(async (id: string, updates: Partial<ConstraintRule>) => {
    try {
      await agamiService.updateConstraintRule(id, updates);
      toast.success('Constraint rule updated');
      await fetchRules();
    } catch (err) {
      console.error('Rule update error:', err);
      toast.error('Failed to update rule');
      throw err;
    }
  }, [fetchRules]);

  // Start/complete induction
  const startInduction = useCallback(async (planId: string) => {
    try {
      await agamiService.startInduction(planId);
      toast.success('Induction started');
      await fetchPlans();
    } catch (err) {
      console.error('Start error:', err);
      toast.error('Failed to start induction');
    }
  }, [fetchPlans]);

  const completeInduction = useCallback(async (planId: string) => {
    try {
      await agamiService.completeInduction(planId);
      toast.success('Induction completed');
      await fetchPlans();
    } catch (err) {
      console.error('Complete error:', err);
      toast.error('Failed to complete induction');
    }
  }, [fetchPlans]);

  // Real-time subscription
  useEffect(() => {
    fetchPlans();
    fetchRules();

    const channel = agamiService.subscribeToPlans(currentDate, (payload) => {
      console.log('Real-time update:', payload);
      
      if (payload.eventType === 'INSERT') {
        setPlans(prev => [...prev, payload.new as InductionPlan]);
      } else if (payload.eventType === 'UPDATE') {
        setPlans(prev => prev.map(p => 
          p.id === payload.new.id ? { ...p, ...payload.new } : p
        ));
      } else if (payload.eventType === 'DELETE') {
        setPlans(prev => prev.filter(p => p.id !== payload.old.id));
      }
    });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentDate, fetchPlans, fetchRules]);

  // Computed values
  const scheduledCount = plans.filter(p => p.status === 'planned').length;
  const inProgressCount = plans.filter(p => p.status === 'in_progress').length;
  const completedCount = plans.filter(p => p.status === 'completed').length;
  const conflictCount = plans.filter(p => p.blocking_issues?.length > 0).length;
  const averageConfidence = plans.length > 0 
    ? plans.reduce((sum, p) => sum + (p.ai_confidence || 0), 0) / plans.length 
    : 0;

  return {
    isLoading,
    isOptimizing,
    plans,
    constraintRules,
    optimizationResult,
    explanation,
    error,
    // Actions
    fetchPlans,
    runOptimization,
    getExplanation,
    approvePlan,
    overridePlan,
    updateRule,
    startInduction,
    completeInduction,
    // Stats
    stats: {
      total: plans.length,
      scheduled: scheduledCount,
      inProgress: inProgressCount,
      completed: completedCount,
      conflicts: conflictCount,
      averageConfidence
    }
  };
};
