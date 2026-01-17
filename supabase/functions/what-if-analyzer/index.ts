import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SwapRequest {
  scheduledTrainId: string;
  standbyTrainId: string;
  planDate: string;
}

interface SwapAnalysis {
  originalTrain: {
    trainId: string;
    name: string;
    readinessScore: number;
    status: string;
  };
  proposedTrain: {
    trainId: string;
    name: string;
    readinessScore: number;
    status: string;
  };
  readinessDelta: number;
  shuntingMoves: number;
  fuelCostEstimate: number;
  recommendation: 'ACCEPTED' | 'FEASIBLE' | 'REVIEW_REQUIRED' | 'REJECTED';
  confidence: number;
  risks: {
    safety: string[];
    operational: string[];
    maintenance: string[];
  };
  aiReasoning: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { scheduledTrainId, standbyTrainId, planDate } = await req.json() as SwapRequest;

    console.log(`Analyzing swap: ${scheduledTrainId} <-> ${standbyTrainId} for ${planDate}`);

    // Fetch both trains' data
    const { data: trains, error: trainsError } = await supabase
      .from('trainsets')
      .select('*')
      .in('id', [scheduledTrainId, standbyTrainId]);

    if (trainsError || !trains || trains.length !== 2) {
      throw new Error('Could not fetch train data');
    }

    const scheduledTrain = trains.find(t => t.id === scheduledTrainId);
    const standbyTrain = trains.find(t => t.id === standbyTrainId);

    if (!scheduledTrain || !standbyTrain) {
      throw new Error('One or both trains not found');
    }

    // Fetch readiness scores
    const { data: readinessData } = await supabase
      .from('readiness_scores')
      .select('*')
      .in('trainset_id', [scheduledTrainId, standbyTrainId])
      .eq('score_date', planDate);

    const scheduledReadiness = readinessData?.find(r => r.trainset_id === scheduledTrainId)?.total_score || 75;
    const standbyReadiness = readinessData?.find(r => r.trainset_id === standbyTrainId)?.total_score || 70;

    // Fetch parking assignments for shunting calculation
    const { data: parkingData } = await supabase
      .from('parking_assignments')
      .select('*')
      .in('trainset_id', [scheduledTrainId, standbyTrainId])
      .eq('plan_date', planDate);

    const scheduledParking = parkingData?.find(p => p.trainset_id === scheduledTrainId);
    const standbyParking = parkingData?.find(p => p.trainset_id === standbyTrainId);

    // Calculate shunting moves (based on track positions)
    const scheduledPosition = scheduledParking?.position_in_track || 1;
    const standbyPosition = standbyParking?.position_in_track || 3;
    const shuntingMoves = Math.abs(scheduledPosition - standbyPosition) + 
                          (scheduledPosition > 1 ? scheduledPosition - 1 : 0) +
                          (standbyPosition > 1 ? standbyPosition - 1 : 0);

    // Calculate readiness delta
    const readinessDelta = standbyReadiness - scheduledReadiness;

    // Fuel cost estimate (₹1500 per shunting move)
    const fuelCostEstimate = shuntingMoves * 1500;

    // Generate risks based on train data
    const risks = {
      safety: [] as string[],
      operational: [] as string[],
      maintenance: [] as string[],
    };

    // Safety risks
    if (standbyReadiness < 60) {
      risks.safety.push('Standby train has low readiness score - may have pending safety checks');
    }
    if (shuntingMoves > 4) {
      risks.safety.push('High number of shunting moves increases collision risk');
    }

    // Operational risks
    if (readinessDelta < -5) {
      risks.operational.push('Swap would reduce overall service quality');
    }
    if (standbyTrain.battery_level && standbyTrain.battery_level < 30) {
      risks.operational.push('Standby train has low battery level');
    }

    // Maintenance risks
    if (standbyTrain.operational_hours && standbyTrain.operational_hours > 5000) {
      risks.maintenance.push('Standby train is due for scheduled maintenance');
    }

    // Determine recommendation based on readiness delta
    let recommendation: SwapAnalysis['recommendation'];
    let confidence: number;

    if (readinessDelta > 0) {
      recommendation = 'ACCEPTED';
      confidence = Math.min(95, 70 + readinessDelta * 2);
    } else if (readinessDelta >= -3) {
      recommendation = 'FEASIBLE';
      confidence = 60 + readinessDelta * 5;
    } else if (readinessDelta > -8) {
      recommendation = 'REVIEW_REQUIRED';
      confidence = 40 + readinessDelta * 3;
    } else {
      recommendation = 'REJECTED';
      confidence = Math.max(20, 50 + readinessDelta * 2);
    }

    // Generate AI reasoning
    const aiReasoning = generateReasoning(
      scheduledTrain,
      standbyTrain,
      readinessDelta,
      shuntingMoves,
      recommendation,
      risks
    );

    const analysis: SwapAnalysis = {
      originalTrain: {
        trainId: scheduledTrain.train_id,
        name: scheduledTrain.name || scheduledTrain.train_id,
        readinessScore: scheduledReadiness,
        status: scheduledTrain.status,
      },
      proposedTrain: {
        trainId: standbyTrain.train_id,
        name: standbyTrain.name || standbyTrain.train_id,
        readinessScore: standbyReadiness,
        status: standbyTrain.status,
      },
      readinessDelta,
      shuntingMoves,
      fuelCostEstimate,
      recommendation,
      confidence,
      risks,
      aiReasoning,
    };

    // Store the analysis in simulation_scenarios
    await supabase.from('simulation_scenarios').insert({
      scenario_name: `Swap Analysis: ${scheduledTrain.train_id} ↔ ${standbyTrain.train_id}`,
      scenario_type: 'what_if_swap',
      input_parameters: {
        scheduledTrainId,
        standbyTrainId,
        planDate,
      },
      simulation_results: analysis,
      feasibility_score: confidence,
      risk_assessment: risks,
    });

    console.log(`Analysis complete: ${recommendation} with ${confidence}% confidence`);

    return new Response(JSON.stringify(analysis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('What-If Analyzer error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Analysis failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateReasoning(
  scheduled: any,
  standby: any,
  delta: number,
  shunting: number,
  recommendation: string,
  risks: { safety: string[]; operational: string[]; maintenance: string[] }
): string {
  const parts: string[] = [];

  parts.push(`Swap analysis between ${scheduled.train_id} and ${standby.train_id}:`);
  
  if (delta > 0) {
    parts.push(`This swap would improve readiness by ${delta.toFixed(1)} points.`);
  } else if (delta < 0) {
    parts.push(`This swap would reduce readiness by ${Math.abs(delta).toFixed(1)} points.`);
  } else {
    parts.push(`Readiness scores are equivalent.`);
  }

  parts.push(`${shunting} shunting moves required for the swap.`);

  if (risks.safety.length > 0) {
    parts.push(`Safety concerns: ${risks.safety.join('; ')}`);
  }
  
  if (risks.operational.length > 0) {
    parts.push(`Operational notes: ${risks.operational.join('; ')}`);
  }

  if (risks.maintenance.length > 0) {
    parts.push(`Maintenance alerts: ${risks.maintenance.join('; ')}`);
  }

  const recommendationText = {
    'ACCEPTED': 'RECOMMENDED - This swap improves service quality.',
    'FEASIBLE': 'FEASIBLE - Marginal change, proceed if operationally convenient.',
    'REVIEW_REQUIRED': 'NEEDS REVIEW - Supervisor approval recommended before proceeding.',
    'REJECTED': 'NOT RECOMMENDED - Significant service quality reduction.',
  };

  parts.push(recommendationText[recommendation as keyof typeof recommendationText]);

  return parts.join(' ');
}
