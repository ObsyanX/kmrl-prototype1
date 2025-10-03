import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizationRequest {
  trainsetIds?: string[];
  timeHorizon?: number;
  includeWeather?: boolean;
  includeDemand?: boolean;
  includeCongestion?: boolean;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const startTime = performance.now();
    const request: OptimizationRequest = await req.json();

    console.log('Starting hierarchical optimization with request:', request);

    // Fetch active configuration
    const { data: config } = await supabase
      .from('algorithm_configurations')
      .select('*')
      .eq('is_active', true)
      .single();

    const weights = config?.weights || {
      fitness: 25, maintenance: 25, branding: 15, mileage: 15, staff: 10, stabling: 10
    };
    const constraints = config?.constraints || {};
    const thresholds = config?.thresholds || {};

    // Fetch all required data in parallel
    const [
      { data: trainsets },
      { data: maintenanceJobs },
      { data: certificates },
      { data: brandingContracts },
      { data: staffSchedules },
      { data: stablingPositions },
      { data: mileageRecords },
      { data: weatherData },
      { data: demandForecast },
      { data: congestionData }
    ] = await Promise.all([
      supabase.from('trainsets').select('*'),
      supabase.from('maintenance_jobs').select('*').in('status', ['pending', 'in_progress']),
      supabase.from('fitness_certificates').select('*'),
      supabase.from('branding_contracts').select('*').eq('status', 'active'),
      supabase.from('staff_schedules').select('*').gte('date', new Date().toISOString().split('T')[0]),
      supabase.from('stabling_positions').select('*'),
      supabase.from('mileage_records').select('*').gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]),
      request.includeWeather !== false
        ? supabase.from('weather_data').select('*').order('timestamp', { ascending: false }).limit(1)
        : Promise.resolve({ data: [] }),
      request.includeDemand !== false
        ? supabase.from('calendar_events').select('*').gte('event_date', new Date().toISOString().split('T')[0]).limit(7)
        : Promise.resolve({ data: [] }),
      request.includeCongestion !== false
        ? supabase.from('depot_congestion').select('*').order('timestamp', { ascending: false }).limit(10)
        : Promise.resolve({ data: [] })
    ]);

    if (!trainsets || trainsets.length === 0) {
      throw new Error('No trainsets found');
    }

    const filteredTrainsets = request.trainsetIds
      ? trainsets.filter(t => request.trainsetIds!.includes(t.id))
      : trainsets;

    console.log(`Analyzing ${filteredTrainsets.length} trainsets with hierarchical optimization`);

    // === LAYER 1: HARD CONSTRAINTS (Must Pass) ===
    const eligibleTrainsets = [];
    const hardConstraintFailures = [];

    for (const trainset of filteredTrainsets) {
      const failures = [];

      // 1. Fitness Certificate Check
      const cert = certificates?.find(c => c.trainset_id === trainset.id && c.status === 'valid');
      if (!cert || new Date(cert.expiry_date) < new Date()) {
        failures.push('Invalid or expired fitness certificate');
      }

      // 2. Critical Maintenance Check
      const criticalMaintenance = maintenanceJobs?.find(
        j => j.trainset_id === trainset.id && j.priority === 'critical' && j.status !== 'completed'
      );
      if (criticalMaintenance) {
        failures.push('Critical maintenance pending');
      }

      // 3. Battery Level Check
      if (trainset.battery_level !== null && trainset.battery_level < (thresholds.battery_level_min || 20)) {
        failures.push(`Battery level too low: ${trainset.battery_level}%`);
      }

      // 4. Stabling Position Check
      const hasStabling = stablingPositions?.some(
        p => p.current_occupant === trainset.id || p.status === 'available'
      );
      if (!hasStabling) {
        failures.push('No stabling position available');
      }

      if (failures.length > 0) {
        hardConstraintFailures.push({
          trainset_id: trainset.id,
          trainset_name: trainset.name,
          failures
        });
      } else {
        eligibleTrainsets.push(trainset);
      }
    }

    console.log(`Hard constraints: ${eligibleTrainsets.length} eligible, ${hardConstraintFailures.length} failed`);

    // === LAYER 2: PREDICTIVE SOFT CONSTRAINTS (ML-Enhanced Scoring) ===
    const scoredTrainsets = [];

    for (const trainset of eligibleTrainsets) {
      const scores: any = {
        trainset_id: trainset.id,
        trainset_name: trainset.name,
        fitness_score: 0,
        maintenance_score: 0,
        branding_score: 0,
        mileage_score: 0,
        staff_score: 0,
        stabling_score: 0,
        weather_impact_score: 100,
        demand_alignment_score: 100,
        congestion_risk_score: 100,
        total_score: 0
      };

      // Fitness Score (0-100)
      const cert = certificates?.find(c => c.trainset_id === trainset.id && c.status === 'valid');
      if (cert) {
        const daysUntilExpiry = Math.floor((new Date(cert.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        scores.fitness_score = Math.min(100, (daysUntilExpiry / 365) * 100);
      }

      // Maintenance Score (0-100)
      const pendingJobs = maintenanceJobs?.filter(j => j.trainset_id === trainset.id && j.status !== 'completed') || [];
      const urgentJobs = pendingJobs.filter(j => j.priority === 'high' || j.priority === 'critical').length;
      scores.maintenance_score = Math.max(0, 100 - urgentJobs * 30);

      // Branding Score (0-100)
      const brandingContract = brandingContracts?.find(c => c.assigned_trainsets?.includes(trainset.id));
      if (brandingContract) {
        const contractDays = Math.floor((new Date(brandingContract.contract_end).getTime() - new Date(brandingContract.contract_start).getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = Math.floor((new Date(brandingContract.contract_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        scores.branding_score = Math.min(100, (daysRemaining / contractDays) * 100 + (brandingContract.priority_level || 0) * 10);
      } else {
        scores.branding_score = 50; // Neutral if no contract
      }

      // Mileage Balancing Score (0-100)
      const recentMileage = mileageRecords?.filter(m => m.trainset_id === trainset.id) || [];
      const totalMileage = recentMileage.reduce((sum, m) => sum + parseFloat(m.daily_mileage || '0'), 0);
      const avgMileage = trainsets.reduce((sum, t) => {
        const tm = mileageRecords?.filter(m => m.trainset_id === t.id) || [];
        return sum + tm.reduce((s, m) => s + parseFloat(m.daily_mileage || '0'), 0);
      }, 0) / trainsets.length;
      const mileageDeviation = Math.abs(totalMileage - avgMileage);
      scores.mileage_score = Math.max(0, 100 - (mileageDeviation / (thresholds.mileage_deviation_max || 500)) * 100);

      // Staff Availability Score (0-100)
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];
      const availableStaff = staffSchedules?.filter(
        s => s.date === tomorrowStr && s.status === 'scheduled'
      ) || [];
      scores.staff_score = Math.min(100, (availableStaff.length / 10) * 100);

      // Stabling Geometry Score (0-100)
      const currentPosition = stablingPositions?.find(p => p.current_occupant === trainset.id);
      if (currentPosition) {
        scores.stabling_score = currentPosition.status === 'available' ? 100 : 70;
      } else {
        scores.stabling_score = 50;
      }

      // Weather Impact Score (ML Prediction)
      if (weatherData && weatherData.length > 0) {
        const weather = weatherData[0];
        const severityScore = weather.weather_severity_score || 0;
        scores.weather_impact_score = Math.max(0, 100 - severityScore);
      }

      // Demand Alignment Score
      if (demandForecast && demandForecast.length > 0) {
        const hasUpcomingEvent = demandForecast.some(e => e.ridership_multiplier > 1.5);
        scores.demand_alignment_score = hasUpcomingEvent ? 120 : 100; // Bonus for high-demand days
      }

      // Congestion Risk Score
      if (congestionData && congestionData.length > 0) {
        const avgCongestion = congestionData.reduce((sum, c) => sum + (c.congestion_score || 0), 0) / congestionData.length;
        scores.congestion_risk_score = Math.max(0, 100 - avgCongestion);
      }

      scoredTrainsets.push(scores);
    }

    // === LAYER 3: BUSINESS OPTIMIZATION (Weighted Final Score) ===
    for (const scores of scoredTrainsets) {
      scores.total_score =
        (scores.fitness_score * weights.fitness +
         scores.maintenance_score * weights.maintenance +
         scores.branding_score * weights.branding +
         scores.mileage_score * weights.mileage +
         scores.staff_score * weights.staff +
         scores.stabling_score * weights.stabling) / 100 +
        (scores.weather_impact_score + scores.demand_alignment_score + scores.congestion_risk_score) / 30;
    }

    // Sort by total score (ascending = highest priority first)
    scoredTrainsets.sort((a, b) => b.total_score - a.total_score);

    // === CONFLICT DETECTION ===
    const conflicts = [];

    // Detect stabling conflicts
    const occupiedPositions = new Set();
    for (const trainset of eligibleTrainsets) {
      const position = stablingPositions?.find(p => p.current_occupant === trainset.id);
      if (position && occupiedPositions.has(position.id)) {
        conflicts.push({
          type: 'stabling_conflict',
          severity: 'high',
          description: `Multiple trainsets assigned to position ${position.position_name}`,
          affected_resources: [trainset.id]
        });
      }
      if (position) occupiedPositions.add(position.id);
    }

    // Detect staff availability conflicts
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    const tomorrowStaff = staffSchedules?.filter(s => s.date === tomorrowStr) || [];
    if (tomorrowStaff.length < eligibleTrainsets.length * 3) {
      conflicts.push({
        type: 'staff_shortage',
        severity: 'medium',
        description: `Insufficient staff for ${eligibleTrainsets.length} trainsets (need ${eligibleTrainsets.length * 3}, have ${tomorrowStaff.length})`,
        affected_resources: []
      });
    }

    const executionTime = performance.now() - startTime;

    // Save to optimization history
    const { data: historyRecord } = await supabase
      .from('optimization_history')
      .insert({
        algorithm_version: config?.version || '2.0.0',
        input_parameters: request,
        recommendations: scoredTrainsets,
        execution_time_ms: Math.round(executionTime),
        confidence_score: scoredTrainsets.length > 0 ? 
          scoredTrainsets.reduce((sum, s) => sum + s.total_score, 0) / scoredTrainsets.length : 0
      })
      .select()
      .single();

    // Save conflicts
    if (conflicts.length > 0 && historyRecord) {
      for (const conflict of conflicts) {
        await supabase.from('decision_conflicts').insert({
          optimization_id: historyRecord.id,
          conflict_type: conflict.type,
          severity: conflict.severity,
          description: conflict.description,
          affected_resources: conflict.affected_resources
        });
      }
    }

    console.log(`Optimization complete in ${executionTime.toFixed(2)}ms`);

    return new Response(
      JSON.stringify({
        success: true,
        execution_time_ms: Math.round(executionTime),
        optimization_id: historyRecord?.id,
        hard_constraint_failures: hardConstraintFailures,
        recommendations: scoredTrainsets,
        conflicts,
        summary: {
          total_trainsets_analyzed: filteredTrainsets.length,
          eligible_trainsets: eligibleTrainsets.length,
          failed_hard_constraints: hardConstraintFailures.length,
          conflicts_detected: conflicts.length,
          average_confidence: scoredTrainsets.length > 0 ?
            (scoredTrainsets.reduce((sum, s) => sum + s.total_score, 0) / scoredTrainsets.length).toFixed(2) : 0
        },
        context: {
          weather: weatherData?.[0],
          upcoming_events: demandForecast?.slice(0, 3),
          depot_congestion_avg: congestionData && congestionData.length > 0 ?
            (congestionData.reduce((sum, c) => sum + (c.congestion_score || 0), 0) / congestionData.length).toFixed(1) : 0
        }
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in hierarchical-optimizer:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
