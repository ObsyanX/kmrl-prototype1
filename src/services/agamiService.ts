import { supabase } from '@/integrations/supabase/client';

export interface InductionPlan {
  id: string;
  trainset_id: string;
  plan_date: string;
  shift_type: string;
  scheduled_start_time: string;
  scheduled_end_time: string;
  actual_start_time?: string;
  actual_end_time?: string;
  platform_id?: string;
  assigned_crew: string[];
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled' | 'delayed';
  priority: 'critical' | 'high' | 'normal' | 'low';
  ai_confidence: number;
  ai_reasoning?: string;
  blocking_issues: string[];
  constraint_violations: any[];
  risk_score: number;
  turnaround_minutes: number;
  headway_buffer_minutes: number;
  power_block_required: boolean;
  safety_clearance_status: 'pending' | 'approved' | 'rejected';
  override_reason?: string;
  overridden_by?: string;
  overridden_at?: string;
  locked: boolean;
  locked_by?: string;
  locked_at?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // Joined data
  trainsets?: any;
  stabling_positions?: any;
}

export interface ConstraintRule {
  id: string;
  rule_name: string;
  rule_category: string;
  rule_type: 'hard' | 'soft';
  description?: string;
  parameters: Record<string, any>;
  weight: number;
  is_active: boolean;
  violation_penalty: number;
}

export interface OptimizationResult {
  success: boolean;
  feasible: boolean;
  objectiveValue: number;
  schedule: any[];
  conflicts: any[];
  constraintViolations: any[];
  executionTimeMs: number;
  iterations: number;
  optimization_id?: string;
  plan_date: string;
}

export const agamiService = {
  // Run the AGAMI optimizer
  async runOptimization(planDate?: Date, trainsetIds?: string[]): Promise<OptimizationResult> {
    const { data, error } = await supabase.functions.invoke('agami-optimizer', {
      body: { 
        planDate: planDate?.toISOString() || new Date().toISOString(),
        trainsetIds 
      }
    });

    if (error) throw error;
    return data;
  },

  // Get explanation for a decision
  async getExplanation(
    explanationType: 'decision' | 'constraint' | 'risk' | 'override_impact' | 'what_if',
    inductionPlanId?: string,
    trainsetId?: string,
    context?: any
  ) {
    const { data, error } = await supabase.functions.invoke('agami-explainer', {
      body: { explanationType, inductionPlanId, trainsetId, context }
    });

    if (error) throw error;
    return data;
  },

  // Fetch induction plans for a date
  async getInductionPlans(planDate: string): Promise<InductionPlan[]> {
    const { data, error } = await (supabase
      .from('induction_plans' as any)
      .select('*')
      .eq('plan_date', planDate)
      .order('scheduled_start_time', { ascending: true }) as any);

    if (error) throw error;
    return (data || []) as InductionPlan[];
  },

  // Get constraint rules
  async getConstraintRules(): Promise<ConstraintRule[]> {
    const { data, error } = await (supabase
      .from('constraint_rules' as any)
      .select('*')
      .order('rule_category', { ascending: true }) as any);

    if (error) throw error;
    return (data || []) as ConstraintRule[];
  },

  // Update constraint rule
  async updateConstraintRule(id: string, updates: Partial<ConstraintRule>) {
    const { data, error } = await supabase
      .from('constraint_rules' as any)
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Approve induction plan
  async approvePlan(planId: string, notes?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { data, error } = await supabase
      .from('induction_plans' as any)
      .update({
        safety_clearance_status: 'approved',
        status: 'planned',
        locked: true,
        locked_by: user?.id,
        locked_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;

    // Log audit action
    await supabase.from('audit_actions' as any).insert({
      action_type: 'plan_approved',
      entity_type: 'induction_plan',
      entity_id: planId,
      user_id: user?.id,
      action_details: { notes, approved_at: new Date().toISOString() }
    });

    return data;
  },

  // Override induction plan
  async overridePlan(planId: string, newValues: Partial<InductionPlan>, reason: string) {
    const { data: { user } } = await supabase.auth.getUser();
    
    // Get current state for audit
    const { data: currentPlan } = await supabase
      .from('induction_plans' as any)
      .select('*')
      .eq('id', planId)
      .single();

    const { data, error } = await supabase
      .from('induction_plans' as any)
      .update({
        ...newValues,
        override_reason: reason,
        overridden_by: user?.id,
        overridden_at: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;

    // Log audit action with before/after
    await supabase.from('audit_actions' as any).insert({
      action_type: 'plan_overridden',
      entity_type: 'induction_plan',
      entity_id: planId,
      user_id: user?.id,
      reason,
      previous_state: currentPlan,
      new_state: data,
      action_details: { override_reason: reason }
    });

    return data;
  },

  // Start induction (update status)
  async startInduction(planId: string) {
    const { data, error } = await supabase
      .from('induction_plans' as any)
      .update({
        status: 'in_progress',
        actual_start_time: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Complete induction
  async completeInduction(planId: string) {
    const { data, error } = await supabase
      .from('induction_plans' as any)
      .update({
        status: 'completed',
        actual_end_time: new Date().toISOString()
      })
      .eq('id', planId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Subscribe to real-time updates
  subscribeToPlans(planDate: string, callback: (payload: any) => void) {
    return supabase
      .channel(`induction_plans_${planDate}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'induction_plans',
          filter: `plan_date=eq.${planDate}`
        },
        callback
      )
      .subscribe();
  },

  // Get audit trail for a plan
  async getAuditTrail(planId: string) {
    const { data, error } = await supabase
      .from('audit_actions' as any)
      .select('*')
      .eq('entity_id', planId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  // Run simulation scenario
  async runSimulation(scenarioType: string, parameters: any) {
    const { data, error } = await supabase.functions.invoke('scenario-simulator', {
      body: { scenarioType, ...parameters }
    });

    if (error) throw error;
    return data;
  }
};
