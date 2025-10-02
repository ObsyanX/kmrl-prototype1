import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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

    const { action = 'analyze', lookbackDays = 30 } = await req.json();

    if (action === 'analyze') {
      // Get operation outcomes from the last N days
      const lookbackDate = new Date();
      lookbackDate.setDate(lookbackDate.getDate() - lookbackDays);

      const { data: outcomes, error } = await supabase
        .from('operation_outcomes')
        .select('*')
        .gte('created_at', lookbackDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!outcomes || outcomes.length === 0) {
        return new Response(JSON.stringify({
          success: true,
          message: 'No historical data available for analysis',
          patterns: [],
          model_version: '1.0.0',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Analyze patterns
      const patterns = analyzePatterns(outcomes);
      const modelUpdates = generateModelUpdates(patterns);

      return new Response(JSON.stringify({
        success: true,
        analysis_period: {
          start_date: lookbackDate.toISOString().split('T')[0],
          end_date: new Date().toISOString().split('T')[0],
          total_operations: outcomes.length,
        },
        patterns_discovered: patterns,
        model_updates: modelUpdates,
        model_version: '1.0.0',
        learning_confidence: calculateLearningConfidence(outcomes.length),
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'record_outcome') {
      const {
        optimization_id,
        trainset_id,
        planned_induction_time,
        actual_induction_time,
        predicted_duration_minutes,
        actual_duration_minutes,
        weather_impact_predicted,
        weather_impact_actual,
        congestion_impact_predicted,
        congestion_impact_actual,
      } = await req.json();

      // Calculate deviation and success score
      const plannedTime = new Date(planned_induction_time);
      const actualTime = new Date(actual_induction_time);
      const deviationMinutes = Math.abs((actualTime.getTime() - plannedTime.getTime()) / 60000);
      const punctualityAchieved = deviationMinutes <= 5; // Within 5 minutes is on-time

      const durationAccuracy = actual_duration_minutes > 0 
        ? 100 * (1 - Math.abs(predicted_duration_minutes - actual_duration_minutes) / actual_duration_minutes)
        : 0;

      const weatherAccuracy = weather_impact_actual !== undefined && weather_impact_predicted !== undefined
        ? 100 * (1 - Math.abs(weather_impact_predicted - weather_impact_actual) / Math.max(weather_impact_actual, 1))
        : 0;

      const congestionAccuracy = congestion_impact_actual !== undefined && congestion_impact_predicted !== undefined
        ? 100 * (1 - Math.abs(congestion_impact_predicted - congestion_impact_actual) / Math.max(congestion_impact_actual, 1))
        : 0;

      const successScore = (
        (punctualityAchieved ? 40 : 0) +
        (durationAccuracy * 0.3) +
        (weatherAccuracy * 0.15) +
        (congestionAccuracy * 0.15)
      );

      const { data: outcome, error } = await supabase
        .from('operation_outcomes')
        .insert([{
          optimization_id,
          trainset_id,
          planned_induction_time,
          actual_induction_time,
          predicted_duration_minutes,
          actual_duration_minutes,
          predicted_conflicts: 0,
          actual_conflicts: 0,
          weather_impact_predicted,
          weather_impact_actual,
          congestion_impact_predicted,
          congestion_impact_actual,
          punctuality_achieved: punctualityAchieved,
          deviation_minutes: Math.floor(deviationMinutes),
          success_score: Number(successScore.toFixed(2)),
          learning_data: {
            duration_accuracy: Number(durationAccuracy.toFixed(2)),
            weather_accuracy: Number(weatherAccuracy.toFixed(2)),
            congestion_accuracy: Number(congestionAccuracy.toFixed(2)),
          },
        }])
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        outcome,
        message: 'Operation outcome recorded successfully',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Pattern learner error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzePatterns(outcomes: any[]) {
  const patterns = [];

  // Pattern 1: Weather impact accuracy
  const weatherOutcomes = outcomes.filter(o => 
    o.weather_impact_predicted !== null && o.weather_impact_actual !== null
  );
  
  if (weatherOutcomes.length > 0) {
    const avgWeatherDeviation = weatherOutcomes.reduce((sum, o) => 
      sum + Math.abs(o.weather_impact_predicted - o.weather_impact_actual), 0
    ) / weatherOutcomes.length;

    patterns.push({
      pattern_type: 'weather_prediction',
      sample_size: weatherOutcomes.length,
      average_deviation: Number(avgWeatherDeviation.toFixed(2)),
      accuracy: Number((100 - (avgWeatherDeviation / 10) * 100).toFixed(2)),
      recommendation: avgWeatherDeviation > 2 
        ? 'Increase weather impact weighting in model'
        : 'Weather predictions performing well',
    });
  }

  // Pattern 2: Duration accuracy
  const durationOutcomes = outcomes.filter(o => 
    o.predicted_duration_minutes > 0 && o.actual_duration_minutes > 0
  );

  if (durationOutcomes.length > 0) {
    const avgDurationDeviation = durationOutcomes.reduce((sum, o) => 
      sum + Math.abs(o.predicted_duration_minutes - o.actual_duration_minutes), 0
    ) / durationOutcomes.length;

    patterns.push({
      pattern_type: 'duration_prediction',
      sample_size: durationOutcomes.length,
      average_deviation_minutes: Number(avgDurationDeviation.toFixed(2)),
      accuracy: Number((100 - (avgDurationDeviation / 60) * 100).toFixed(2)),
      recommendation: avgDurationDeviation > 15
        ? 'Adjust duration estimation buffers'
        : 'Duration predictions within acceptable range',
    });
  }

  // Pattern 3: Punctuality rate
  const punctualityRate = outcomes.filter(o => o.punctuality_achieved).length / outcomes.length * 100;
  
  patterns.push({
    pattern_type: 'punctuality_performance',
    sample_size: outcomes.length,
    punctuality_rate: Number(punctualityRate.toFixed(2)),
    meets_target: punctualityRate >= 99.5,
    recommendation: punctualityRate < 99.5
      ? `Improve by ${(99.5 - punctualityRate).toFixed(2)}% to meet 99.5% target`
      : 'Exceeding punctuality targets',
  });

  // Pattern 4: Success score trends
  const avgSuccessScore = outcomes.reduce((sum, o) => sum + (o.success_score || 0), 0) / outcomes.length;
  
  patterns.push({
    pattern_type: 'overall_performance',
    sample_size: outcomes.length,
    average_success_score: Number(avgSuccessScore.toFixed(2)),
    performance_grade: avgSuccessScore >= 90 ? 'Excellent' :
                      avgSuccessScore >= 80 ? 'Good' :
                      avgSuccessScore >= 70 ? 'Fair' : 'Needs Improvement',
    recommendation: avgSuccessScore < 85
      ? 'Review and adjust optimization weights'
      : 'System performing above expectations',
  });

  return patterns;
}

function generateModelUpdates(patterns: any[]) {
  const updates: any[] = [];

  patterns.forEach(pattern => {
    if (pattern.pattern_type === 'weather_prediction' && pattern.average_deviation > 2) {
      updates.push({
        component: 'weather_impact_weight',
        current_value: 0.15,
        suggested_value: 0.20,
        reason: 'Weather impact predictions showing higher deviation',
      });
    }

    if (pattern.pattern_type === 'duration_prediction' && pattern.average_deviation_minutes > 15) {
      updates.push({
        component: 'duration_buffer_factor',
        current_value: 1.1,
        suggested_value: 1.15,
        reason: 'Duration predictions require additional buffer',
      });
    }

    if (pattern.pattern_type === 'punctuality_performance' && !pattern.meets_target) {
      updates.push({
        component: 'optimization_aggressiveness',
        current_value: 0.8,
        suggested_value: 0.9,
        reason: 'Increase optimization aggressiveness to improve punctuality',
      });
    }
  });

  return updates;
}

function calculateLearningConfidence(sampleSize: number): number {
  if (sampleSize >= 100) return 0.95;
  if (sampleSize >= 50) return 0.85;
  if (sampleSize >= 25) return 0.75;
  if (sampleSize >= 10) return 0.65;
  return 0.50;
}
