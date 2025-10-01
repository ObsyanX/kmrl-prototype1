import { supabase } from '@/integrations/supabase/client';

export interface OptimizationRequest {
  trainsetIds?: string[];
  timeHorizon?: number;
  constraints?: {
    fitness_certificates?: boolean;
    maintenance_schedule?: boolean;
    branding_priority?: boolean;
    mileage_balancing?: boolean;
    staff_availability?: boolean;
    stabling_geometry?: boolean;
  };
  weights?: {
    fitness: number;
    maintenance: number;
    branding: number;
    mileage: number;
    staff: number;
    stabling: number;
  };
}

export interface OptimizationResult {
  success: boolean;
  execution_time_ms: number;
  recommendations: any[];
  conflicts: any[];
  summary: {
    total_trainsets: number;
    critical_issues: number;
    high_priority: number;
    conflicts_detected: number;
  };
  optimization_id?: string;
}

export const optimizationService = {
  /**
   * Run the multi-objective optimization algorithm
   */
  async runOptimization(request: OptimizationRequest): Promise<OptimizationResult> {
    const { data, error } = await supabase.functions.invoke('optimization-engine', {
      body: request,
    });

    if (error) throw error;
    return data;
  },

  /**
   * Get AI-powered recommendations for specific scenarios
   */
  async getAIRecommendation(
    trainsetId?: string,
    analysisType: 'induction_planning' | 'maintenance_priority' | 'resource_allocation' | 'conflict_resolution' = 'induction_planning',
    context?: any
  ) {
    const { data, error } = await supabase.functions.invoke('ai-recommendation-generator', {
      body: { trainsetId, analysisType, context },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Validate fitness certificates for all or specific trainset
   */
  async validateCertificates(action: 'validate_all' | 'check_trainset' | 'renew_certificate', params?: any) {
    const { data, error } = await supabase.functions.invoke('fitness-certificate-validator', {
      body: { action, ...params },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Plan train induction
   */
  async planInduction(trainsetId: string, inductionDate?: string, priority?: 'normal' | 'urgent' | 'emergency', constraints?: string[]) {
    const { data, error } = await supabase.functions.invoke('train-induction-planner', {
      body: { trainsetId, inductionDate, priority, constraints },
    });

    if (error) throw error;
    return data;
  },

  /**
   * Fetch optimization history
   */
  async getOptimizationHistory(limit = 10) {
    const { data, error } = await supabase
      .from('optimization_history')
      .select('*')
      .order('execution_timestamp', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  /**
   * Get decision conflicts
   */
  async getConflicts(resolved?: boolean) {
    let query = supabase
      .from('decision_conflicts')
      .select('*')
      .order('created_at', { ascending: false });

    if (resolved !== undefined) {
      query = query.eq('resolved', resolved);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data;
  },

  /**
   * Mark conflict as resolved
   */
  async resolveConflict(conflictId: string, resolutionStrategy: string) {
    const { data, error } = await supabase
      .from('decision_conflicts')
      .update({
        resolved: true,
        resolved_at: new Date().toISOString(),
        resolution_strategy: resolutionStrategy,
      })
      .eq('id', conflictId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Submit feedback for optimization
   */
  async submitOptimizationFeedback(optimizationId: string, feedbackScore: number, applied: boolean) {
    const { data, error } = await supabase
      .from('optimization_history')
      .update({
        feedback_score: feedbackScore,
        applied,
      })
      .eq('id', optimizationId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};
