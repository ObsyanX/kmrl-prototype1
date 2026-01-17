/**
 * What-If Swap Analysis Service
 * AI-powered analysis for train swap decisions
 */

import { supabase } from '@/integrations/supabase/client';

export interface TrainInfo {
  id: string;
  name: string;
  readinessScore: number;
  category: 'service' | 'standby' | 'maintenance' | 'ibl';
  parkingPosition?: number;
}

export interface SwapAnalysis {
  recommendation: 'ACCEPTED' | 'FEASIBLE' | 'REVIEW_REQUIRED' | 'REJECTED';
  confidence: number;
  readinessDelta: number;
  shuntingMovesRequired: number;
  estimatedFuelCost: number;
  risks: {
    safety: string[];
    operational: string[];
    maintenance: string[];
  };
  aiExplanation: string;
  impact: {
    serviceQuality: number;
    operationalEfficiency: number;
    costImpact: number;
  };
}

export interface SwapScenario {
  scheduledTrain: TrainInfo;
  standbyTrain: TrainInfo;
  reason?: string;
  analysis?: SwapAnalysis;
}

/**
 * Analyze a potential swap between scheduled and standby trains
 */
export async function analyzeSwap(
  scheduledTrain: TrainInfo,
  standbyTrain: TrainInfo,
  reason?: string
): Promise<SwapAnalysis> {
  try {
    const { data, error } = await supabase.functions.invoke('what-if-analyzer', {
      body: {
        scheduledTrain,
        standbyTrain,
        reason,
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('What-If analysis failed:', error);
    // Return fallback analysis
    return generateFallbackAnalysis(scheduledTrain, standbyTrain);
  }
}

/**
 * Generate fallback analysis when API is unavailable
 */
function generateFallbackAnalysis(
  scheduledTrain: TrainInfo,
  standbyTrain: TrainInfo
): SwapAnalysis {
  const readinessDelta = standbyTrain.readinessScore - scheduledTrain.readinessScore;
  const shuntingMoves = Math.abs((standbyTrain.parkingPosition || 1) - (scheduledTrain.parkingPosition || 1));
  const fuelCost = shuntingMoves * 15; // Estimated $15 per shunting move

  // Determine recommendation based on readiness delta
  let recommendation: SwapAnalysis['recommendation'];
  if (readinessDelta > 0) {
    recommendation = 'ACCEPTED';
  } else if (readinessDelta >= -3) {
    recommendation = 'REVIEW_REQUIRED';
  } else if (readinessDelta >= -8) {
    recommendation = 'FEASIBLE';
  } else {
    recommendation = 'REJECTED';
  }

  const risks: SwapAnalysis['risks'] = {
    safety: [],
    operational: [],
    maintenance: [],
  };

  if (standbyTrain.readinessScore < 70) {
    risks.safety.push('Standby train has lower than optimal readiness');
  }
  if (shuntingMoves > 3) {
    risks.operational.push(`High shunting complexity: ${shuntingMoves} moves required`);
  }
  if (readinessDelta < -5) {
    risks.maintenance.push('Significant readiness downgrade may affect service quality');
  }

  return {
    recommendation,
    confidence: 0.75,
    readinessDelta,
    shuntingMovesRequired: shuntingMoves,
    estimatedFuelCost: fuelCost,
    risks,
    aiExplanation: `Swap analysis: ${standbyTrain.name} would ${readinessDelta >= 0 ? 'improve' : 'reduce'} overall readiness by ${Math.abs(readinessDelta).toFixed(1)} points. ${shuntingMoves} shunting moves required.`,
    impact: {
      serviceQuality: Math.max(0, Math.min(100, 70 + readinessDelta)),
      operationalEfficiency: Math.max(0, 100 - shuntingMoves * 10),
      costImpact: -fuelCost,
    },
  };
}

/**
 * Get list of standby trains available for swap
 */
export async function getStandbyTrains(): Promise<TrainInfo[]> {
  const { data, error } = await supabase
    .from('trainsets')
    .select('*')
    .eq('status', 'standby');

  if (error) throw error;

  return (data || []).map(train => ({
    id: train.id,
    name: train.name || train.train_id,
    readinessScore: 75, // Default - would come from readiness calculation
    category: 'standby' as const,
  }));
}

/**
 * Get all possible swap scenarios
 */
export async function getAllSwapScenarios(
  scheduledTrains: TrainInfo[]
): Promise<SwapScenario[]> {
  const standbyTrains = await getStandbyTrains();
  const scenarios: SwapScenario[] = [];

  for (const scheduled of scheduledTrains) {
    for (const standby of standbyTrains) {
      scenarios.push({
        scheduledTrain: scheduled,
        standbyTrain: standby,
      });
    }
  }

  return scenarios;
}

/**
 * Execute a swap (record the decision)
 */
export async function executeSwap(
  scheduledTrain: TrainInfo,
  standbyTrain: TrainInfo,
  reason: string,
  analysis: SwapAnalysis
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();

  // Record the override decision
  await supabase.from('override_decisions').insert({
    from_train_id: scheduledTrain.id,
    to_train_id: standbyTrain.id,
    reason,
    user_id: user?.id,
    context: {
      scheduled_readiness: scheduledTrain.readinessScore,
      standby_readiness: standbyTrain.readinessScore,
      recommendation: analysis.recommendation,
      confidence: analysis.confidence,
    },
  });

  // Update trainset statuses
  await Promise.all([
    supabase
      .from('trainsets')
      .update({ status: 'standby' })
      .eq('id', scheduledTrain.id),
    supabase
      .from('trainsets')
      .update({ status: 'operational' })
      .eq('id', standbyTrain.id),
  ]);
}

export const whatIfService = {
  analyzeSwap,
  getStandbyTrains,
  getAllSwapScenarios,
  executeSwap,
};
