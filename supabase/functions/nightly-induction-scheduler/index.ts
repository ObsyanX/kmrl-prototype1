import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Starting nightly induction plan generation...');

    // Calculate plan date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    const planDate = tomorrow.toISOString().split('T')[0];

    // Check if plan already exists for tomorrow
    const { data: existingPlan } = await supabase
      .from('daily_induction_plans')
      .select('id, approved')
      .eq('plan_date', planDate)
      .single();

    if (existingPlan && existingPlan.approved) {
      console.log('Plan already approved for', planDate);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Plan already approved for this date',
          plan_date: planDate
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Call hierarchical optimizer with all trainsets
    const optimizerResponse = await fetch(`${supabaseUrl}/functions/v1/hierarchical-optimizer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        includeWeather: true,
        includeDemand: true,
        includeCongestion: true,
        timeHorizon: 24
      })
    });

    if (!optimizerResponse.ok) {
      throw new Error('Optimizer failed: ' + await optimizerResponse.text());
    }

    const optimizationResult = await optimizerResponse.json();

    console.log('Optimization complete:', optimizationResult.summary);

    // Categorize trainsets based on optimization results
    const recommendations = optimizationResult.recommendations || [];
    const hardFailures = optimizationResult.hard_constraint_failures || [];

    // Top scorers go into service (aim for 18-20 trainsets)
    const trainsetsForService = recommendations
      .slice(0, 20)
      .map((r: any) => r.trainset_id);

    // Lower scorers on standby
    const trainsetsOnStandby = recommendations
      .slice(20)
      .map((r: any) => r.trainset_id);

    // Hard constraint failures must stay in maintenance
    const trainsetsInMaintenance = hardFailures.map((f: any) => f.trainset_id);

    // Prepare optimization summary
    const optimizationSummary = {
      algorithm_version: '2.0.0-hierarchical',
      optimization_id: optimizationResult.optimization_id,
      total_analyzed: optimizationResult.summary.total_trainsets_analyzed,
      eligible: optimizationResult.summary.eligible_trainsets,
      average_confidence: optimizationResult.summary.average_confidence,
      conflicts_detected: optimizationResult.conflicts?.length || 0,
      top_recommendations: recommendations.slice(0, 5).map((r: any) => ({
        trainset_id: r.trainset_id,
        trainset_name: r.trainset_name,
        total_score: r.total_score
      }))
    };

    const weatherContext = optimizationResult.context?.weather || {};
    const demandContext = {
      upcoming_events: optimizationResult.context?.upcoming_events || [],
      high_demand_expected: (optimizationResult.context?.upcoming_events || []).some((e: any) => e.ridership_multiplier > 1.5)
    };

    // Insert or update daily induction plan
    const planData = {
      plan_date: planDate,
      trainsets_for_service: trainsetsForService,
      trainsets_on_standby: trainsetsOnStandby,
      trainsets_in_maintenance: trainsetsInMaintenance,
      optimization_summary: optimizationSummary,
      weather_context: weatherContext,
      demand_forecast: demandContext,
      approved: false
    };

    let savedPlan;
    if (existingPlan) {
      const { data } = await supabase
        .from('daily_induction_plans')
        .update(planData)
        .eq('id', existingPlan.id)
        .select()
        .single();
      savedPlan = data;
    } else {
      const { data } = await supabase
        .from('daily_induction_plans')
        .insert(planData)
        .select()
        .single();
      savedPlan = data;
    }

    console.log('Induction plan saved for', planDate);

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Nightly induction plan generated successfully',
        plan_date: planDate,
        plan_id: savedPlan?.id,
        summary: {
          for_service: trainsetsForService.length,
          on_standby: trainsetsOnStandby.length,
          in_maintenance: trainsetsInMaintenance.length,
          conflicts: optimizationResult.conflicts?.length || 0
        },
        optimization_summary: optimizationSummary
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in nightly-induction-scheduler:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
