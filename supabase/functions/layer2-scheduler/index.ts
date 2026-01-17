import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScheduleRequest {
  planDate: string;
  isHoliday: boolean;
}

interface SlotAssignment {
  slot: number;
  departureTime: string;
  trainId: string;
  trainName: string;
  readinessScore: number;
  shuntingMoves: number;
  objectiveScore: number;
  rationale: string;
}

interface ScheduleResult {
  planDate: string;
  scheduleType: 'regular' | 'holiday';
  totalSlots: number;
  assignments: SlotAssignment[];
  unassignedTrains: string[];
  optimizationMetrics: {
    totalObjective: number;
    averageReadiness: number;
    totalShuntingMoves: number;
    executionTimeMs: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const startTime = Date.now();

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { planDate, isHoliday } = await req.json() as ScheduleRequest;
    const totalSlots = isHoliday ? 15 : 10;

    console.log(`Layer 2 Scheduling for ${planDate}, slots: ${totalSlots}`);

    // Fetch trains ready for service (from Layer 1 output or daily_induction_plans)
    const { data: inductionPlan } = await supabase
      .from('daily_induction_plans')
      .select('*')
      .eq('plan_date', planDate)
      .maybeSingle();

    let serviceTrainIds: string[] = [];
    
    if (inductionPlan?.for_service) {
      serviceTrainIds = Array.isArray(inductionPlan.for_service) 
        ? inductionPlan.for_service 
        : [];
    }

    // If no plan exists, fetch trains with status 'operational' or 'in_service'
    if (serviceTrainIds.length === 0) {
      const { data: operationalTrains } = await supabase
        .from('trainsets')
        .select('id')
        .in('status', ['operational', 'in_service', 'available'])
        .limit(20);
      
      serviceTrainIds = operationalTrains?.map(t => t.id) || [];
    }

    if (serviceTrainIds.length === 0) {
      return new Response(JSON.stringify({
        error: 'No trains available for scheduling',
        planDate,
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch full train data
    const { data: trains } = await supabase
      .from('trainsets')
      .select('*')
      .in('id', serviceTrainIds);

    // Fetch readiness scores
    const { data: readinessData } = await supabase
      .from('readiness_scores')
      .select('*')
      .in('trainset_id', serviceTrainIds)
      .eq('score_date', planDate);

    // Fetch parking assignments
    const { data: parkingData } = await supabase
      .from('parking_assignments')
      .select('*')
      .in('trainset_id', serviceTrainIds)
      .eq('plan_date', planDate);

    // Build train objects with all data
    const trainData = trains?.map(train => {
      const readiness = readinessData?.find(r => r.trainset_id === train.id);
      const parking = parkingData?.find(p => p.trainset_id === train.id);
      
      return {
        id: train.id,
        trainId: train.train_id,
        name: train.name || train.train_id,
        readinessScore: readiness?.total_score || 70,
        position: parking?.position_in_track || Math.floor(Math.random() * 5) + 1,
        shuntingMoves: parking?.shunting_moves_required || 0,
        homeBay: train.home_bay,
      };
    }) || [];

    // Sort by readiness (descending)
    trainData.sort((a, b) => b.readinessScore - a.readinessScore);

    // Generate departure times (05:30 to 22:30, distributed evenly)
    const generateDepartureTimes = (slots: number): string[] => {
      const startHour = 5.5; // 05:30
      const endHour = 22.5; // 22:30
      const interval = (endHour - startHour) / (slots - 1);
      
      return Array.from({ length: slots }, (_, i) => {
        const hour = startHour + i * interval;
        const h = Math.floor(hour);
        const m = Math.round((hour - h) * 60);
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      });
    };

    const departureTimes = generateDepartureTimes(totalSlots);
    
    // Priority slots (morning rush: 1-3, evening rush: based on total)
    const prioritySlots = isHoliday 
      ? [1, 2, 3, 4, 11, 12, 13, 14] 
      : [1, 2, 3, 7, 8, 9];

    // CP-SAT style assignment with objective function
    const assignments: SlotAssignment[] = [];
    const assignedTrains = new Set<string>();

    for (let slot = 1; slot <= totalSlots; slot++) {
      // Find best unassigned train for this slot
      let bestTrain = null;
      let bestScore = -Infinity;

      for (const train of trainData) {
        if (assignedTrains.has(train.id)) continue;

        // Calculate objective score
        // + readiness * 1000 (primary factor)
        // + slot_preference * readiness * 10
        // + 800 / position (favor front positions)
        // + 2000 priority slot bonus
        // - 5000 * shunting_penalty

        const slotPreference = prioritySlots.includes(slot) ? 1.5 : 1.0;
        const positionBonus = 800 / (train.position || 1);
        const priorityBonus = prioritySlots.includes(slot) && train.readinessScore > 85 ? 2000 : 0;
        const shuntingPenalty = train.shuntingMoves * 500;

        const objectiveScore = 
          train.readinessScore * 1000 +
          slotPreference * train.readinessScore * 10 +
          positionBonus +
          priorityBonus -
          shuntingPenalty;

        if (objectiveScore > bestScore) {
          bestScore = objectiveScore;
          bestTrain = train;
        }
      }

      if (bestTrain) {
        assignedTrains.add(bestTrain.id);
        
        const rationale = generateRationale(bestTrain, slot, prioritySlots.includes(slot));
        
        assignments.push({
          slot,
          departureTime: departureTimes[slot - 1],
          trainId: bestTrain.trainId,
          trainName: bestTrain.name,
          readinessScore: bestTrain.readinessScore,
          shuntingMoves: bestTrain.shuntingMoves,
          objectiveScore: Math.round(bestScore),
          rationale,
        });
      }
    }

    // Find unassigned trains
    const unassignedTrains = trainData
      .filter(t => !assignedTrains.has(t.id))
      .map(t => t.trainId);

    // Calculate metrics
    const totalObjective = assignments.reduce((sum, a) => sum + a.objectiveScore, 0);
    const averageReadiness = assignments.length > 0
      ? assignments.reduce((sum, a) => sum + a.readinessScore, 0) / assignments.length
      : 0;
    const totalShuntingMoves = assignments.reduce((sum, a) => sum + a.shuntingMoves, 0);

    const result: ScheduleResult = {
      planDate,
      scheduleType: isHoliday ? 'holiday' : 'regular',
      totalSlots,
      assignments,
      unassignedTrains,
      optimizationMetrics: {
        totalObjective,
        averageReadiness: Math.round(averageReadiness * 10) / 10,
        totalShuntingMoves,
        executionTimeMs: Date.now() - startTime,
      },
    };

    // Store schedule in daily_induction_plans
    await supabase
      .from('daily_induction_plans')
      .upsert({
        plan_date: planDate,
        service_schedule: assignments,
        optimization_summary: result.optimizationMetrics,
        status: 'draft',
        updated_at: new Date().toISOString(),
      }, { onConflict: 'plan_date' });

    console.log(`Schedule complete: ${assignments.length} trains assigned in ${result.optimizationMetrics.executionTimeMs}ms`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Layer 2 Scheduler error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Scheduling failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateRationale(train: any, slot: number, isPriority: boolean): string {
  const parts: string[] = [];
  
  if (train.readinessScore >= 90) {
    parts.push('Highest readiness score');
  } else if (train.readinessScore >= 80) {
    parts.push('Strong readiness score');
  } else {
    parts.push('Adequate readiness');
  }

  if (isPriority) {
    parts.push('assigned to peak hour slot');
  }

  if (train.position <= 2) {
    parts.push('minimal shunting required');
  } else if (train.shuntingMoves > 3) {
    parts.push(`${train.shuntingMoves} shunting moves needed`);
  }

  if (train.homeBay) {
    parts.push(`from ${train.homeBay}`);
  }

  return parts.join(', ') + '.';
}
