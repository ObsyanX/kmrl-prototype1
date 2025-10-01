import { useState, useCallback } from 'react';
import { optimizationService, OptimizationRequest, OptimizationResult } from '@/services/optimizationService';
import { useToast } from '@/hooks/use-toast';

export const useOptimization = () => {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optimizationResult, setOptimizationResult] = useState<OptimizationResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const runOptimization = useCallback(async (request: OptimizationRequest = {}) => {
    setIsOptimizing(true);
    setError(null);

    try {
      const result = await optimizationService.runOptimization(request);
      setOptimizationResult(result);

      if (result.summary.critical_issues > 0) {
        toast({
          title: "⚠️ Critical Issues Detected",
          description: `Found ${result.summary.critical_issues} critical issue(s) requiring immediate attention.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "✅ Optimization Complete",
          description: `Analyzed ${result.summary.total_trainsets} trainsets in ${result.execution_time_ms}ms.`,
        });
      }

      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Optimization failed';
      setError(errorMessage);
      toast({
        title: "Optimization Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    } finally {
      setIsOptimizing(false);
    }
  }, [toast]);

  const getAIRecommendation = useCallback(async (
    trainsetId?: string,
    analysisType?: 'induction_planning' | 'maintenance_priority' | 'resource_allocation' | 'conflict_resolution',
    context?: any
  ) => {
    try {
      const result = await optimizationService.getAIRecommendation(trainsetId, analysisType, context);
      
      toast({
        title: "AI Recommendation Generated",
        description: "AI analysis completed successfully.",
      });

      return result;
    } catch (err: any) {
      toast({
        title: "AI Recommendation Error",
        description: err.message || 'Failed to generate AI recommendation',
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const validateCertificates = useCallback(async (
    action: 'validate_all' | 'check_trainset' | 'renew_certificate',
    params?: any
  ) => {
    try {
      const result = await optimizationService.validateCertificates(action, params);
      
      if (action === 'validate_all' && result.critical_issues > 0) {
        toast({
          title: "⚠️ Certificate Issues Found",
          description: `${result.critical_issues} trainset(s) have expired certificates.`,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Certificate Validation Complete",
          description: "All certificates validated successfully.",
        });
      }

      return result;
    } catch (err: any) {
      toast({
        title: "Certificate Validation Error",
        description: err.message || 'Failed to validate certificates',
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const planInduction = useCallback(async (
    trainsetId: string,
    inductionDate?: string,
    priority?: 'normal' | 'urgent' | 'emergency',
    constraints?: string[]
  ) => {
    try {
      const result = await optimizationService.planInduction(trainsetId, inductionDate, priority, constraints);
      
      if (result.can_proceed) {
        toast({
          title: "✅ Induction Approved",
          description: `Trainset ${trainsetId} is ready for induction.`,
        });
      } else {
        toast({
          title: "⚠️ Induction Blocked",
          description: `${result.blocking_issues?.length || 0} issue(s) prevent induction.`,
          variant: "destructive",
        });
      }

      return result;
    } catch (err: any) {
      toast({
        title: "Induction Planning Error",
        description: err.message || 'Failed to plan induction',
        variant: "destructive",
      });
      throw err;
    }
  }, [toast]);

  const submitFeedback = useCallback(async (optimizationId: string, feedbackScore: number, applied: boolean) => {
    try {
      await optimizationService.submitOptimizationFeedback(optimizationId, feedbackScore, applied);
      
      toast({
        title: "Feedback Submitted",
        description: "Thank you for your feedback!",
      });
    } catch (err: any) {
      toast({
        title: "Feedback Error",
        description: err.message || 'Failed to submit feedback',
        variant: "destructive",
      });
    }
  }, [toast]);

  return {
    isOptimizing,
    optimizationResult,
    error,
    runOptimization,
    getAIRecommendation,
    validateCertificates,
    planInduction,
    submitFeedback,
  };
};
