/**
 * Layer 2 Service Scheduling
 * Handles departure slot assignment using CP-SAT style optimization
 */

import { supabase } from '@/integrations/supabase/client';
import { ReadinessBreakdown } from './readinessCalculator';

export interface DepartureSlot {
  slotNumber: number;
  time: string;
  trainsetId: string;
  trainName: string;
  readinessScore: number;
  parkingPosition: number;
  shuntingMovesRequired: number;
  assignmentScore: number;
  rationale: string;
}

export interface ServiceSchedule {
  date: string;
  isHoliday: boolean;
  totalSlots: number;
  departures: DepartureSlot[];
  summary: {
    totalTrains: number;
    avgReadiness: number;
    totalShuntingMoves: number;
    optimizationScore: number;
  };
}

export interface Layer2Request {
  planDate: Date;
  isHoliday?: boolean;
  forServiceTrains: Array<{
    trainsetId: string;
    trainName: string;
    readiness: ReadinessBreakdown;
    parkingPosition: number;
  }>;
}

// CP-SAT style objective coefficients
const OBJECTIVE_WEIGHTS = {
  readiness: 1000,
  slotPreference: 10,
  positionBonus: 800,
  prioritySlotBonus: 2000,
  shuntingPenalty: -5000,
};

/**
 * Calculate assignment score for a train-slot combination
 */
function calculateAssignmentScore(
  readinessScore: number,
  slotNumber: number,
  parkingPosition: number,
  isPrioritySlot: boolean
): { score: number; shuntingMoves: number } {
  // Shunting moves = number of trains that need to be moved to access this train
  const shuntingMoves = Math.max(0, parkingPosition - 1);
  
  // CP-SAT style objective calculation
  let score = 0;
  
  // + readiness * 1000
  score += readinessScore * OBJECTIVE_WEIGHTS.readiness;
  
  // + slot_preference * readiness * 10
  score += slotNumber * readinessScore * OBJECTIVE_WEIGHTS.slotPreference;
  
  // + 800 / position (higher score for front positions)
  score += OBJECTIVE_WEIGHTS.positionBonus / Math.max(1, parkingPosition);
  
  // + 2000 priority slot bonus (slots 1-3 are priority)
  if (isPrioritySlot) {
    score += OBJECTIVE_WEIGHTS.prioritySlotBonus;
  }
  
  // - 5000 shunting penalty per move
  score += shuntingMoves * OBJECTIVE_WEIGHTS.shuntingPenalty;
  
  return { score, shuntingMoves };
}

/**
 * Generate scheduling rationale for a departure
 */
function generateRationale(
  trainName: string,
  slotNumber: number,
  readinessScore: number,
  shuntingMoves: number,
  assignmentScore: number
): string {
  const parts: string[] = [];
  
  if (readinessScore >= 90) {
    parts.push(`High readiness (${readinessScore.toFixed(1)}%)`);
  } else if (readinessScore >= 70) {
    parts.push(`Good readiness (${readinessScore.toFixed(1)}%)`);
  } else {
    parts.push(`Acceptable readiness (${readinessScore.toFixed(1)}%)`);
  }
  
  if (slotNumber <= 3) {
    parts.push('priority slot assignment');
  } else {
    parts.push(`scheduled for slot ${slotNumber}`);
  }
  
  if (shuntingMoves === 0) {
    parts.push('no shunting required');
  } else if (shuntingMoves === 1) {
    parts.push('1 shunting move needed');
  } else {
    parts.push(`${shuntingMoves} shunting moves needed`);
  }
  
  return `${trainName}: ${parts.join(', ')}. Optimization score: ${assignmentScore.toFixed(0)}`;
}

/**
 * Layer 2 Scheduler - Greedy assignment with CP-SAT scoring
 */
export function scheduleLayer2(request: Layer2Request): ServiceSchedule {
  const { planDate, isHoliday = false, forServiceTrains } = request;
  
  // 10 slots for regular days, 15 for holidays
  const totalSlots = isHoliday ? 15 : 10;
  const departures: DepartureSlot[] = [];
  
  // Sort trains by readiness score (highest first)
  const sortedTrains = [...forServiceTrains].sort(
    (a, b) => b.readiness.total_score - a.readiness.total_score
  );
  
  // Track assigned slots and trains
  const assignedSlots = new Set<number>();
  const assignedTrains = new Set<string>();
  
  // Greedy assignment: for each slot, find best available train
  for (let slotNumber = 1; slotNumber <= totalSlots; slotNumber++) {
    let bestTrain = null;
    let bestScore = -Infinity;
    let bestShuntingMoves = 0;
    
    for (const train of sortedTrains) {
      if (assignedTrains.has(train.trainsetId)) continue;
      
      const isPrioritySlot = slotNumber <= 3;
      const { score, shuntingMoves } = calculateAssignmentScore(
        train.readiness.total_score,
        slotNumber,
        train.parkingPosition,
        isPrioritySlot
      );
      
      if (score > bestScore) {
        bestScore = score;
        bestTrain = train;
        bestShuntingMoves = shuntingMoves;
      }
    }
    
    if (bestTrain) {
      const departureTime = new Date(planDate);
      // First departure at 6:00 AM, 10-minute intervals
      departureTime.setHours(6, (slotNumber - 1) * 10, 0, 0);
      
      const rationale = generateRationale(
        bestTrain.trainName,
        slotNumber,
        bestTrain.readiness.total_score,
        bestShuntingMoves,
        bestScore
      );
      
      departures.push({
        slotNumber,
        time: departureTime.toISOString(),
        trainsetId: bestTrain.trainsetId,
        trainName: bestTrain.trainName,
        readinessScore: bestTrain.readiness.total_score,
        parkingPosition: bestTrain.parkingPosition,
        shuntingMovesRequired: bestShuntingMoves,
        assignmentScore: bestScore,
        rationale,
      });
      
      assignedSlots.add(slotNumber);
      assignedTrains.add(bestTrain.trainsetId);
    }
  }
  
  // Calculate summary statistics
  const totalShuntingMoves = departures.reduce((sum, d) => sum + d.shuntingMovesRequired, 0);
  const avgReadiness = departures.length > 0
    ? departures.reduce((sum, d) => sum + d.readinessScore, 0) / departures.length
    : 0;
  const optimizationScore = departures.reduce((sum, d) => sum + d.assignmentScore, 0);
  
  return {
    date: planDate.toISOString().split('T')[0],
    isHoliday,
    totalSlots,
    departures,
    summary: {
      totalTrains: departures.length,
      avgReadiness,
      totalShuntingMoves,
      optimizationScore,
    },
  };
}

/**
 * Save Layer 2 schedule to database
 */
export async function saveServiceSchedule(schedule: ServiceSchedule): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  
  const { error } = await (supabase
    .from('daily_induction_plans' as any)
    .upsert({
      plan_date: schedule.date,
      service_schedule: schedule.departures,
      optimization_summary: {
        ...schedule.summary,
        is_holiday: schedule.isHoliday,
        total_slots: schedule.totalSlots,
      },
      status: 'scheduled',
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'plan_date',
    }) as any);
  
  if (error) {
    console.error('Failed to save service schedule:', error);
    throw error;
  }
}

/**
 * Fetch Layer 2 schedule from database
 */
export async function getServiceSchedule(planDate: string): Promise<ServiceSchedule | null> {
  const { data, error } = await (supabase
    .from('daily_induction_plans' as any)
    .select('*')
    .eq('plan_date', planDate) as any)
    .single();
  
  if (error || !data) {
    return null;
  }
  
  const summary = (data as any).optimization_summary || {};
  
  return {
    date: data.plan_date,
    isHoliday: summary.is_holiday || false,
    totalSlots: summary.total_slots || 10,
    departures: (data as any).service_schedule || [],
    summary: {
      totalTrains: summary.totalTrains || 0,
      avgReadiness: summary.avgReadiness || 0,
      totalShuntingMoves: summary.totalShuntingMoves || 0,
      optimizationScore: summary.optimizationScore || 0,
    },
  };
}

export const layer2Service = {
  scheduleLayer2,
  saveServiceSchedule,
  getServiceSchedule,
};
