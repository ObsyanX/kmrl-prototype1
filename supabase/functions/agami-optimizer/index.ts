import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InductionSlot {
  trainsetId: string;
  trainsetName: string;
  platformId: string;
  platformName: string;
  startTime: Date;
  endTime: Date;
  crewIds: string[];
  priority: number;
  constraints: ConstraintResult[];
  score: number;
}

interface ConstraintResult {
  ruleId: string;
  ruleName: string;
  satisfied: boolean;
  penalty: number;
  details: string;
}

interface OptimizationResult {
  success: boolean;
  feasible: boolean;
  objectiveValue: number;
  schedule: InductionSlot[];
  conflicts: any[];
  constraintViolations: ConstraintResult[];
  executionTimeMs: number;
  iterations: number;
}

// MILP-style constraint satisfaction optimizer
class InductionOptimizer {
  private trainsets: any[];
  private platforms: any[];
  private crews: any[];
  private rules: any[];
  private timeSlots: Date[];
  private schedule: Map<string, InductionSlot>;

  constructor(
    trainsets: any[],
    platforms: any[],
    crews: any[],
    rules: any[],
    planDate: Date
  ) {
    this.trainsets = trainsets;
    this.platforms = platforms;
    this.crews = crews;
    this.rules = rules;
    this.schedule = new Map();
    this.timeSlots = this.generateTimeSlots(planDate);
  }

  private generateTimeSlots(planDate: Date): Date[] {
    const slots: Date[] = [];
    const startHour = 5; // 5 AM
    const endHour = 9; // 9 AM (morning induction window)
    
    for (let hour = startHour; hour < endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        const slot = new Date(planDate);
        slot.setHours(hour, minute, 0, 0);
        slots.push(slot);
      }
    }
    return slots;
  }

  // Check platform exclusivity constraint
  private checkPlatformExclusivity(slot: InductionSlot): ConstraintResult {
    const rule = this.rules.find(r => r.rule_name === 'Platform Exclusivity');
    const bufferMinutes = rule?.parameters?.buffer_minutes || 5;
    
    let conflicting = false;
    for (const [, existingSlot] of this.schedule) {
      if (existingSlot.platformId === slot.platformId) {
        const existingEnd = new Date(existingSlot.endTime);
        existingEnd.setMinutes(existingEnd.getMinutes() + bufferMinutes);
        
        if (slot.startTime < existingEnd && existingSlot.startTime < slot.endTime) {
          conflicting = true;
          break;
        }
      }
    }

    return {
      ruleId: rule?.id || 'platform_exclusivity',
      ruleName: 'Platform Exclusivity',
      satisfied: !conflicting,
      penalty: conflicting ? (rule?.violation_penalty || 1000) : 0,
      details: conflicting ? 'Platform already occupied during this time window' : 'Platform available'
    };
  }

  // Check headway constraint
  private checkHeadway(slot: InductionSlot): ConstraintResult {
    const rule = this.rules.find(r => r.rule_name === 'Headway Minimum');
    const minHeadwaySeconds = rule?.parameters?.min_headway_seconds || 180;
    
    let violated = false;
    for (const [, existingSlot] of this.schedule) {
      const timeDiff = Math.abs(slot.startTime.getTime() - existingSlot.startTime.getTime()) / 1000;
      if (timeDiff < minHeadwaySeconds && timeDiff > 0) {
        violated = true;
        break;
      }
    }

    return {
      ruleId: rule?.id || 'headway_minimum',
      ruleName: 'Headway Minimum',
      satisfied: !violated,
      penalty: violated ? (rule?.violation_penalty || 500) : 0,
      details: violated ? `Headway less than ${minHeadwaySeconds}s` : 'Headway constraint satisfied'
    };
  }

  // Check crew rest constraint
  private checkCrewRest(slot: InductionSlot, crewSchedules: any[]): ConstraintResult {
    const rule = this.rules.find(r => r.rule_name === 'Crew Rest Requirement');
    const minRestHours = rule?.parameters?.min_rest_hours || 8;
    
    let violated = false;
    let details = 'Crew rest requirements met';

    for (const crewId of slot.crewIds) {
      const crewSchedule = crewSchedules.find(s => s.staff_id === crewId);
      if (crewSchedule) {
        const lastShiftEnd = new Date(crewSchedule.end_time);
        const hoursSinceLastShift = (slot.startTime.getTime() - lastShiftEnd.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceLastShift < minRestHours) {
          violated = true;
          details = `Crew ${crewId} has only ${hoursSinceLastShift.toFixed(1)}h rest (min: ${minRestHours}h)`;
          break;
        }
      }
    }

    return {
      ruleId: rule?.id || 'crew_rest',
      ruleName: 'Crew Rest Requirement',
      satisfied: !violated,
      penalty: violated ? (rule?.violation_penalty || 800) : 0,
      details
    };
  }

  // Check safety margin constraint
  private checkSafetyMargin(slot: InductionSlot): ConstraintResult {
    const rule = this.rules.find(r => r.rule_name === 'Safety Margin');
    const preCheckMinutes = rule?.parameters?.pre_departure_check_minutes || 10;
    
    const slotDuration = (slot.endTime.getTime() - slot.startTime.getTime()) / (1000 * 60);
    const hasMargin = slotDuration >= preCheckMinutes;

    return {
      ruleId: rule?.id || 'safety_margin',
      ruleName: 'Safety Margin',
      satisfied: hasMargin,
      penalty: hasMargin ? 0 : (rule?.violation_penalty || 900),
      details: hasMargin ? 'Safety checks time available' : `Insufficient time for ${preCheckMinutes}min safety checks`
    };
  }

  // Check power block window
  private checkPowerBlock(slot: InductionSlot): ConstraintResult {
    const rule = this.rules.find(r => r.rule_name === 'Power Block Window');
    const powerStart = rule?.parameters?.power_available_start || '05:30';
    const powerEnd = rule?.parameters?.power_available_end || '23:30';

    const [startHour, startMin] = powerStart.split(':').map(Number);
    const [endHour, endMin] = powerEnd.split(':').map(Number);

    const slotHour = slot.startTime.getHours();
    const slotMin = slot.startTime.getMinutes();

    const inPowerWindow = (slotHour > startHour || (slotHour === startHour && slotMin >= startMin)) &&
                          (slotHour < endHour || (slotHour === endHour && slotMin <= endMin));

    return {
      ruleId: rule?.id || 'power_block',
      ruleName: 'Power Block Window',
      satisfied: inPowerWindow,
      penalty: inPowerWindow ? 0 : (rule?.violation_penalty || 1000),
      details: inPowerWindow ? 'Within power availability window' : 'Outside power availability window'
    };
  }

  // Calculate priority score
  private calculatePriorityScore(trainset: any, certificates: any[], maintenanceJobs: any[]): number {
    let score = 100;

    // Certificate urgency
    const cert = certificates.find(c => c.trainset_id === trainset.id);
    if (cert) {
      const daysToExpiry = Math.floor((new Date(cert.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      if (daysToExpiry < 7) score += 50;
      else if (daysToExpiry < 14) score += 30;
    }

    // Maintenance urgency
    const criticalJobs = maintenanceJobs.filter(j => 
      j.trainset_id === trainset.id && j.priority === 'critical'
    );
    score += criticalJobs.length * 20;

    // Battery level
    if (trainset.battery_level < 30) score += 40;
    else if (trainset.battery_level < 50) score += 20;

    return score;
  }

  async optimize(crewSchedules: any[], certificates: any[], maintenanceJobs: any[]): Promise<OptimizationResult> {
    const startTime = Date.now();
    const conflicts: any[] = [];
    const allViolations: ConstraintResult[] = [];
    let iterations = 0;

    // Sort trainsets by priority
    const prioritizedTrainsets = this.trainsets
      .filter(t => t.status === 'operational' || t.status === 'standby')
      .map(t => ({
        ...t,
        priority: this.calculatePriorityScore(t, certificates, maintenanceJobs)
      }))
      .sort((a, b) => b.priority - a.priority);

    // Greedy assignment with constraint checking
    for (const trainset of prioritizedTrainsets) {
      iterations++;
      let bestSlot: InductionSlot | null = null;
      let bestScore = -Infinity;

      // Try each time slot and platform combination
      for (const timeSlot of this.timeSlots) {
        for (const platform of this.platforms.filter(p => p.status === 'available' || !p.is_occupied)) {
          const endTime = new Date(timeSlot);
          endTime.setMinutes(endTime.getMinutes() + 20); // 20 min per induction

          // Assign available crew
          const availableCrew = this.crews
            .filter(c => c.status === 'available' || c.status === 'scheduled')
            .slice(0, 2);

          const candidateSlot: InductionSlot = {
            trainsetId: trainset.id,
            trainsetName: trainset.name || trainset.train_id,
            platformId: platform.id,
            platformName: platform.bay_name || platform.position_name,
            startTime: new Date(timeSlot),
            endTime,
            crewIds: availableCrew.map(c => c.id || c.staff_id),
            priority: trainset.priority,
            constraints: [],
            score: 0
          };

          // Check all constraints
          const constraints = [
            this.checkPlatformExclusivity(candidateSlot),
            this.checkHeadway(candidateSlot),
            this.checkCrewRest(candidateSlot, crewSchedules),
            this.checkSafetyMargin(candidateSlot),
            this.checkPowerBlock(candidateSlot)
          ];

          candidateSlot.constraints = constraints;

          // Calculate slot score (lower penalty = better)
          const totalPenalty = constraints.reduce((sum, c) => sum + c.penalty, 0);
          const slotScore = trainset.priority - totalPenalty;
          candidateSlot.score = slotScore;

          // Track violations
          const violations = constraints.filter(c => !c.satisfied);
          if (violations.length > 0) {
            allViolations.push(...violations);
          }

          // Check if this is the best feasible slot (all hard constraints satisfied)
          const hardConstraintsSatisfied = constraints
            .filter(c => ['Platform Exclusivity', 'Power Block Window', 'Crew Rest Requirement'].includes(c.ruleName))
            .every(c => c.satisfied);

          if (hardConstraintsSatisfied && slotScore > bestScore) {
            bestScore = slotScore;
            bestSlot = candidateSlot;
          }
        }
      }

      if (bestSlot) {
        this.schedule.set(trainset.id, bestSlot);
      } else {
        conflicts.push({
          type: 'unschedulable',
          trainsetId: trainset.id,
          trainsetName: trainset.name,
          reason: 'No feasible slot found satisfying all hard constraints'
        });
      }
    }

    const executionTime = Date.now() - startTime;
    const scheduleArray = Array.from(this.schedule.values()).sort((a, b) => 
      a.startTime.getTime() - b.startTime.getTime()
    );

    // Calculate objective value (sum of scores)
    const objectiveValue = scheduleArray.reduce((sum, slot) => sum + slot.score, 0);

    return {
      success: true,
      feasible: conflicts.length === 0,
      objectiveValue,
      schedule: scheduleArray,
      conflicts,
      constraintViolations: allViolations,
      executionTimeMs: executionTime,
      iterations
    };
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { planDate, trainsetIds, overrideRules } = await req.json();
    const targetDate = planDate ? new Date(planDate) : new Date();
    
    console.log(`Starting AGAMI optimization for ${targetDate.toISOString()}`);

    // Fetch all required data in parallel
    const [
      { data: trainsets },
      { data: platforms },
      { data: staffSchedules },
      { data: rules },
      { data: certificates },
      { data: maintenanceJobs }
    ] = await Promise.all([
      trainsetIds?.length > 0 
        ? supabase.from('trainsets').select('*').in('id', trainsetIds)
        : supabase.from('trainsets').select('*'),
      supabase.from('stabling_positions').select('*'),
      supabase.from('staff_schedules').select('*').gte('date', targetDate.toISOString().split('T')[0]),
      supabase.from('constraint_rules').select('*').eq('is_active', true),
      supabase.from('fitness_certificates').select('*'),
      supabase.from('maintenance_jobs').select('*').in('status', ['pending', 'scheduled', 'in_progress'])
    ]);

    // Apply rule overrides if provided
    const activeRules = overrideRules 
      ? rules?.map(r => overrideRules[r.id] ? { ...r, ...overrideRules[r.id] } : r)
      : rules;

    // Create optimizer and run
    const optimizer = new InductionOptimizer(
      trainsets || [],
      platforms || [],
      staffSchedules || [],
      activeRules || [],
      targetDate
    );

    const result = await optimizer.optimize(
      staffSchedules || [],
      certificates || [],
      maintenanceJobs || []
    );

    console.log(`Optimization completed: ${result.schedule.length} trains scheduled, ${result.conflicts.length} conflicts`);

    // Save optimization results to database
    const { data: optimizationRecord, error: saveError } = await supabase
      .from('optimization_history')
      .insert({
        optimization_type: 'agami_induction',
        parameters: { planDate: targetDate.toISOString(), trainsetCount: trainsets?.length },
        results: {
          schedule: result.schedule,
          conflicts: result.conflicts,
          objectiveValue: result.objectiveValue,
          iterations: result.iterations
        },
        execution_time_ms: result.executionTimeMs,
        status: result.feasible ? 'completed' : 'partial'
      })
      .select()
      .single();

    if (saveError) {
      console.error('Failed to save optimization record:', saveError);
    }

    // Save induction plans
    if (result.schedule.length > 0) {
      const planInserts = result.schedule.map(slot => ({
        trainset_id: slot.trainsetId,
        plan_date: targetDate.toISOString().split('T')[0],
        shift_type: 'morning',
        scheduled_start_time: slot.startTime.toISOString(),
        scheduled_end_time: slot.endTime.toISOString(),
        platform_id: slot.platformId,
        assigned_crew: slot.crewIds,
        status: 'planned',
        priority: slot.priority > 100 ? 'high' : slot.priority > 50 ? 'normal' : 'low',
        ai_confidence: Math.min(0.99, Math.max(0.7, (slot.score + 100) / 200)),
        ai_reasoning: slot.constraints.map(c => `${c.ruleName}: ${c.details}`).join('; '),
        blocking_issues: slot.constraints.filter(c => !c.satisfied).map(c => c.details),
        constraint_violations: slot.constraints.filter(c => !c.satisfied),
        risk_score: slot.constraints.filter(c => !c.satisfied).length * 0.1,
        created_by: user.id
      }));

      const { error: insertError } = await supabase
        .from('induction_plans')
        .insert(planInserts);

      if (insertError) {
        console.error('Failed to save induction plans:', insertError);
      }
    }

    // Log audit action
    await supabase.from('audit_actions').insert({
      action_type: 'plan_created',
      entity_type: 'induction_plan',
      entity_id: optimizationRecord?.id || 'batch',
      user_id: user.id,
      action_details: {
        trainsets_scheduled: result.schedule.length,
        conflicts: result.conflicts.length,
        objective_value: result.objectiveValue
      }
    });

    return new Response(
      JSON.stringify({
        ...result,
        optimization_id: optimizationRecord?.id,
        plan_date: targetDate.toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AGAMI optimization error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
