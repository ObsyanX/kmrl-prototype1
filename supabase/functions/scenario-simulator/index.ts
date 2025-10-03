import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ScenarioRequest {
  scenarioType: 'breakdown' | 'weather_disruption' | 'staff_shortage' | 'peak_demand' | 'custom';
  parameters: any;
  trainsetIds?: string[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const request: ScenarioRequest = await req.json();
    const startTime = performance.now();

    console.log('Running scenario simulation:', request.scenarioType);

    // Get baseline data
    const { data: currentData } = await supabase
      .from('trainsets')
      .select('*');

    // Call hierarchical optimizer with baseline
    const baselineResponse = await fetch(`${supabaseUrl}/functions/v1/hierarchical-optimizer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        trainsetIds: request.trainsetIds,
        includeWeather: true,
        includeDemand: true,
        includeCongestion: true
      })
    });

    const baselineResult = await baselineResponse.json();

    // Apply scenario modifications
    let scenarioModifications: any = {};

    switch (request.scenarioType) {
      case 'breakdown':
        // Simulate trainset breakdown
        const affectedTrainset = request.parameters.trainset_id || 
          baselineResult.recommendations[0]?.trainset_id;
        scenarioModifications = {
          removed_trainsets: [affectedTrainset],
          reason: 'Emergency breakdown - trainset out of service',
          impact: {
            service_reduction: 1,
            standby_requirement: 1,
            estimated_delay_hours: request.parameters.repair_time || 8
          }
        };
        break;

      case 'weather_disruption':
        // Simulate severe weather
        scenarioModifications = {
          weather_severity: request.parameters.severity || 85,
          rainfall: request.parameters.rainfall || 50,
          flooding_risk: request.parameters.flooding_risk || 8,
          speed_restrictions: true,
          service_frequency_reduction: request.parameters.frequency_reduction || 20,
          impact: {
            punctuality_risk: 60,
            operational_capacity: 75
          }
        };
        break;

      case 'staff_shortage':
        // Simulate staff unavailability
        scenarioModifications = {
          available_staff_percentage: request.parameters.staff_reduction || 70,
          affected_roles: request.parameters.affected_roles || ['technician', 'driver'],
          trainset_capacity_reduction: Math.floor((100 - (request.parameters.staff_reduction || 70)) / 10),
          impact: {
            operational_capacity: request.parameters.staff_reduction || 70,
            maintenance_delays: true
          }
        };
        break;

      case 'peak_demand':
        // Simulate high ridership event
        scenarioModifications = {
          demand_multiplier: request.parameters.multiplier || 2.5,
          event_name: request.parameters.event_name || 'Major Festival',
          additional_trainsets_needed: Math.ceil((request.parameters.multiplier || 2.5 - 1) * 10),
          impact: {
            service_frequency_increase: 50,
            standby_utilization: 100,
            overcrowding_risk: 'high'
          }
        };
        break;

      case 'custom':
        scenarioModifications = request.parameters;
        break;
    }

    // Run modified optimization
    const scenarioParams = {
      ...request,
      modifications: scenarioModifications
    };

    // Calculate scenario predictions
    const predictions = {
      baseline_trainsets_available: baselineResult.recommendations?.length || 0,
      scenario_trainsets_available: Math.max(0, (baselineResult.recommendations?.length || 0) - 
        (scenarioModifications.removed_trainsets?.length || 0) - 
        (scenarioModifications.trainset_capacity_reduction || 0)),
      service_level_impact: calculateServiceImpact(scenarioModifications),
      punctuality_impact: calculatePunctualityImpact(scenarioModifications),
      resource_requirements: calculateResourceRequirements(scenarioModifications, baselineResult),
      risk_level: calculateRiskLevel(scenarioModifications),
      recommendations: generateRecommendations(scenarioModifications, baselineResult)
    };

    const executionTime = performance.now() - startTime;

    return new Response(
      JSON.stringify({
        success: true,
        scenario_type: request.scenarioType,
        execution_time_ms: Math.round(executionTime),
        baseline: {
          trainsets_available: baselineResult.recommendations?.length || 0,
          average_score: baselineResult.summary?.average_confidence || 0,
          conflicts: baselineResult.conflicts?.length || 0
        },
        scenario: scenarioModifications,
        predictions,
        comparison: {
          trainset_delta: predictions.scenario_trainsets_available - predictions.baseline_trainsets_available,
          service_impact_percentage: predictions.service_level_impact,
          risk_increase: predictions.risk_level
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in scenario-simulator:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateServiceImpact(mods: any): number {
  let impact = 0;
  
  if (mods.removed_trainsets) impact += mods.removed_trainsets.length * 5;
  if (mods.trainset_capacity_reduction) impact += mods.trainset_capacity_reduction * 4;
  if (mods.service_frequency_reduction) impact += mods.service_frequency_reduction;
  if (mods.weather_severity > 70) impact += 20;
  
  return Math.min(100, impact);
}

function calculatePunctualityImpact(mods: any): number {
  let impact = 100; // Start at perfect punctuality
  
  if (mods.weather_severity) impact -= (mods.weather_severity / 100) * 30;
  if (mods.flooding_risk > 5) impact -= 20;
  if (mods.available_staff_percentage < 80) impact -= (80 - mods.available_staff_percentage) / 2;
  if (mods.demand_multiplier > 1.5) impact -= (mods.demand_multiplier - 1) * 15;
  
  return Math.max(0, impact);
}

function calculateResourceRequirements(mods: any, baseline: any): any {
  return {
    additional_trainsets_needed: mods.additional_trainsets_needed || 0,
    standby_activation_required: mods.demand_multiplier > 1.5 || mods.removed_trainsets?.length > 0,
    maintenance_priority_change: mods.removed_trainsets?.length > 0,
    staff_reallocation_needed: mods.available_staff_percentage < 90,
    contingency_plan_activation: mods.weather_severity > 70 || mods.removed_trainsets?.length > 0
  };
}

function calculateRiskLevel(mods: any): string {
  const riskScore = 
    (mods.weather_severity || 0) / 100 * 40 +
    (mods.removed_trainsets?.length || 0) * 20 +
    (mods.trainset_capacity_reduction || 0) * 3 +
    (mods.demand_multiplier > 2 ? 20 : 0);

  if (riskScore > 60) return 'critical';
  if (riskScore > 35) return 'high';
  if (riskScore > 15) return 'medium';
  return 'low';
}

function generateRecommendations(mods: any, baseline: any): string[] {
  const recommendations = [];

  if (mods.removed_trainsets && mods.removed_trainsets.length > 0) {
    recommendations.push('Activate standby trainsets immediately');
    recommendations.push('Prioritize rapid maintenance to return trainset to service');
  }

  if (mods.weather_severity > 70) {
    recommendations.push('Implement speed restrictions and extended travel times');
    recommendations.push('Increase platform staffing for crowd management');
    recommendations.push('Prepare additional cleaning crews for weather-related maintenance');
  }

  if (mods.available_staff_percentage < 80) {
    recommendations.push('Activate cross-training protocols for staff reallocation');
    recommendations.push('Consider overtime approvals for critical roles');
    recommendations.push('Reduce non-essential maintenance to focus on operations');
  }

  if (mods.demand_multiplier > 1.8) {
    recommendations.push('Deploy all available trainsets including standby units');
    recommendations.push('Increase service frequency on high-demand routes');
    recommendations.push('Pre-position staff at key stations');
  }

  return recommendations;
}
