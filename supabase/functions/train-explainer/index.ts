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

    const { trainsetId } = await req.json();

    if (!trainsetId) {
      throw new Error('trainsetId is required');
    }

    console.log(`Generating explanation for trainset: ${trainsetId}`);

    // Fetch trainset first
    const { data: trainset } = await supabase
      .from('trainsets')
      .select('*')
      .eq('id', trainsetId)
      .single();

    if (!trainset) {
      throw new Error(`Trainset ${trainsetId} not found`);
    }

    // Fetch comprehensive data
    const [
      { data: certificates },
      { data: maintenanceJobs },
      { data: brandingContract },
      { data: mileageRecords },
      { data: stablingPosition }
    ] = await Promise.all([
      supabase.from('fitness_certificates').select('*').eq('trainset_id', trainsetId),
      supabase.from('maintenance_jobs').select('*').eq('trainset_id', trainsetId).in('status', ['pending', 'in_progress']),
      supabase.from('branding_contracts').select('*').eq('id', trainset.branding_contract_id || 'none').single(),
      supabase.from('mileage_records').select('*').eq('trainset_id', trainsetId).order('date', { ascending: false }).limit(30),
      supabase.from('stabling_positions').select('*').eq('id', trainset.current_stabling_position || 'none').single()
    ]);

    const currentDate = new Date();

    // === CONSTRAINT CHECKS ===
    const constraints = {
      fitness: { passed: true, reasons: [] as string[] },
      maintenance: { passed: true, reasons: [] as string[] },
      health: { passed: true, reasons: [] as string[] },
      branding: { passed: true, reasons: [] as string[] }
    };

    // Fitness certificates
    const validCerts = certificates?.filter(c => c.status === 'valid' && new Date(c.expiry_date) > currentDate) || [];
    if (validCerts.length === 0) {
      constraints.fitness.passed = false;
      constraints.fitness.reasons.push('No valid fitness certificates');
    }
    certificates?.forEach(cert => {
      if (cert.status !== 'valid' || new Date(cert.expiry_date) < currentDate) {
        constraints.fitness.reasons.push(`${cert.certificate_type} certificate expired or invalid`);
      }
    });

    // Maintenance
    const criticalJobs = maintenanceJobs?.filter(j => j.priority === 'critical') || [];
    if (criticalJobs.length > 0) {
      constraints.maintenance.passed = false;
      constraints.maintenance.reasons.push(`${criticalJobs.length} critical maintenance job(s) pending`);
    }
    if (maintenanceJobs && maintenanceJobs.length > 0) {
      constraints.maintenance.reasons.push(`${maintenanceJobs.length} total open job card(s)`);
    }

    // Component health
    const healthScore = trainset.component_health_score || 100;
    if (healthScore < 70) {
      constraints.health.passed = false;
      constraints.health.reasons.push(`Component health score below threshold (${healthScore.toFixed(1)}%)`);
    }
    if (healthScore < 50) {
      constraints.health.reasons.push('CRITICAL: Component health critically low');
    }
    const iotAlerts = trainset.iot_sensor_alerts || [];
    if (iotAlerts.length > 0) {
      constraints.health.reasons.push(`${iotAlerts.length} IoT sensor alert(s) active`);
    }

    // Branding
    if (brandingContract && brandingContract.data) {
      const currentHours = trainset.operational_hours || 0;
      const requiredHours = brandingContract.data.requirements?.min_hours || 0;
      if (currentHours < requiredHours) {
        constraints.branding.reasons.push(`Branding hours shortfall: ${requiredHours - currentHours}hrs`);
      }
    }

    // === SCORING BREAKDOWN ===
    const scores = {
      mileage: 0,
      health: healthScore / 100,
      maintenance: maintenanceJobs && maintenanceJobs.length > 0 ? 0.5 : 1.0,
      fitness: validCerts.length > 0 ? 1.0 : 0,
      branding: brandingContract ? 0.8 : 0.5
    };

    // Calculate fleet average mileage
    const { data: allTrainsets } = await supabase.from('trainsets').select('total_mileage');
    const fleetAvgMileage = (allTrainsets && allTrainsets.length > 0)
      ? allTrainsets.reduce((sum, t) => sum + (t.total_mileage || 0), 0) / allTrainsets.length
      : 1;
    const mileageRatio = trainset.total_mileage / Math.max(fleetAvgMileage, 1);
    scores.mileage = 1 / (1 + Math.exp(5 * (mileageRatio - 1))); // Sigmoid inverse

    const weights = { mileage: 0.30, health: 0.20, maintenance: 0.25, fitness: 0.15, branding: 0.10 };
    const compositeScore = 
      weights.mileage * scores.mileage +
      weights.health * scores.health +
      weights.maintenance * scores.maintenance +
      weights.fitness * scores.fitness +
      weights.branding * scores.branding;

    // === SERVICE READINESS ===
    const isServiceReady = 
      constraints.fitness.passed && 
      constraints.maintenance.passed && 
      constraints.health.passed;

    // === OPERATIONAL SUMMARY ===
    const avgDailyMileage = mileageRecords && mileageRecords.length > 0
      ? mileageRecords.reduce((sum, r) => sum + (r.daily_mileage || 0), 0) / mileageRecords.length
      : 0;

    const daysSinceService = trainset.last_service_date 
      ? Math.floor((currentDate.getTime() - new Date(trainset.last_service_date).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    const explanation = {
      trainset_id: trainsetId,
      service_ready: isServiceReady,
      composite_score: compositeScore,
      constraints,
      scores,
      weights,
      operational_data: {
        total_mileage: trainset.total_mileage,
        fleet_avg_mileage: fleetAvgMileage,
        mileage_ratio: mileageRatio,
        avg_daily_mileage: avgDailyMileage,
        component_health_score: healthScore,
        battery_level: trainset.battery_level,
        operational_hours: trainset.operational_hours,
        days_since_service: daysSinceService,
        active_iot_alerts: iotAlerts.length,
        open_job_cards: maintenanceJobs?.length || 0,
        critical_job_cards: criticalJobs.length,
        valid_certificates: validCerts.length,
        total_certificates: certificates?.length || 0,
        current_location: trainset.current_location,
        stabling_position: stablingPosition?.data?.position_name || trainset.current_stabling_position
      },
      recommendation: isServiceReady 
        ? `Trainset ${trainsetId} is SERVICE READY with composite score ${(compositeScore * 100).toFixed(1)}%`
        : `Trainset ${trainsetId} is NOT SERVICE READY - see constraint failures`,
      timestamp: new Date().toISOString()
    };

    console.log(`Generated explanation for ${trainsetId}: Service Ready = ${isServiceReady}`);

    return new Response(JSON.stringify(explanation), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in train-explainer:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
