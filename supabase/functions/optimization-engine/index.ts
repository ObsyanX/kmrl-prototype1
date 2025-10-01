import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OptimizationRequest {
  trainsetIds?: string[];
  timeHorizon?: number; // hours
  constraints?: {
    fitness_certificates?: boolean;
    maintenance_schedule?: boolean;
    branding_priority?: boolean;
    mileage_balancing?: boolean;
    staff_availability?: boolean;
    stabling_geometry?: boolean;
  };
  weights?: {
    fitness: number;
    maintenance: number;
    branding: number;
    mileage: number;
    staff: number;
    stabling: number;
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const requestData: OptimizationRequest = await req.json();
    console.log('Optimization request:', requestData);

    const startTime = Date.now();

    // Default weights (normalized to sum to 1.0)
    const weights = requestData.weights || {
      fitness: 0.25,
      maintenance: 0.20,
      branding: 0.15,
      mileage: 0.15,
      staff: 0.15,
      stabling: 0.10,
    };

    // Fetch all trainsets or specific ones
    const { data: trainsets, error: trainsetsError } = await supabase
      .from('trainsets')
      .select('*')
      .in('id', requestData.trainsetIds || []);

    if (trainsetsError) throw trainsetsError;

    // Fetch related data
    const [
      { data: maintenanceJobs },
      { data: certificates },
      { data: brandingContracts },
      { data: mileageRecords },
      { data: staffSchedules },
      { data: stablingPositions }
    ] = await Promise.all([
      supabase.from('maintenance_jobs').select('*').in('status', ['pending', 'scheduled']),
      supabase.from('fitness_certificates').select('*'),
      supabase.from('branding_contracts').select('*').eq('status', 'active'),
      supabase.from('mileage_records').select('*').gte('date', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      supabase.from('staff_schedules').select('*').gte('date', new Date().toISOString().split('T')[0]),
      supabase.from('stabling_positions').select('*')
    ]);

    // Core optimization algorithm
    const recommendations: any[] = [];
    const conflicts: any[] = [];

    for (const trainset of trainsets || []) {
      const trainsetScore = {
        id: trainset.id,
        name: trainset.name,
        scores: {
          fitness: 0,
          maintenance: 0,
          branding: 0,
          mileage: 0,
          staff: 0,
          stabling: 0,
        },
        totalScore: 0,
        recommendations: [] as string[],
        urgency: 'normal' as 'critical' | 'high' | 'normal' | 'low',
      };

      // 1. FITNESS CERTIFICATE VALIDATION
      const cert = certificates?.find(c => c.trainset_id === trainset.id);
      if (cert) {
        const daysUntilExpiry = Math.floor((new Date(cert.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntilExpiry < 0) {
          trainsetScore.scores.fitness = 0;
          trainsetScore.urgency = 'critical';
          trainsetScore.recommendations.push(`CRITICAL: Certificate expired ${Math.abs(daysUntilExpiry)} days ago - immediate action required`);
          conflicts.push({
            type: 'certificate_expired',
            severity: 'critical',
            trainset_id: trainset.id,
            description: `Certificate expired, trainset cannot operate`,
          });
        } else if (daysUntilExpiry < 7) {
          trainsetScore.scores.fitness = 0.3;
          trainsetScore.urgency = 'high';
          trainsetScore.recommendations.push(`Certificate expiring in ${daysUntilExpiry} days - schedule renewal immediately`);
        } else if (daysUntilExpiry < 30) {
          trainsetScore.scores.fitness = 0.7;
          trainsetScore.recommendations.push(`Certificate expiring in ${daysUntilExpiry} days - plan renewal soon`);
        } else {
          trainsetScore.scores.fitness = 1.0;
        }
      } else {
        trainsetScore.scores.fitness = 0;
        trainsetScore.urgency = 'critical';
        trainsetScore.recommendations.push('CRITICAL: No fitness certificate found');
      }

      // 2. MAINTENANCE SCHEDULE
      const pendingJobs = maintenanceJobs?.filter(j => j.trainset_id === trainset.id && j.status !== 'completed') || [];
      const criticalJobs = pendingJobs.filter(j => j.priority === 'critical');
      
      if (criticalJobs.length > 0) {
        trainsetScore.scores.maintenance = 0.2;
        trainsetScore.urgency = trainsetScore.urgency === 'critical' ? 'critical' : 'high';
        trainsetScore.recommendations.push(`${criticalJobs.length} critical maintenance job(s) pending`);
      } else if (pendingJobs.length > 3) {
        trainsetScore.scores.maintenance = 0.5;
        trainsetScore.recommendations.push(`${pendingJobs.length} maintenance jobs pending - prioritize scheduling`);
      } else if (pendingJobs.length > 0) {
        trainsetScore.scores.maintenance = 0.8;
        trainsetScore.recommendations.push(`${pendingJobs.length} maintenance job(s) pending`);
      } else {
        trainsetScore.scores.maintenance = 1.0;
      }

      // 3. BRANDING PRIORITY
      const brandingContract = brandingContracts?.find(bc => 
        bc.assigned_trainsets?.includes(trainset.id)
      );
      
      if (brandingContract) {
        const contractDaysRemaining = Math.floor((new Date(brandingContract.contract_end).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        trainsetScore.scores.branding = Math.min(1.0, (brandingContract.priority_level || 5) / 10);
        
        if (contractDaysRemaining < 7) {
          trainsetScore.recommendations.push(`Branding contract ending in ${contractDaysRemaining} days`);
        }
      } else {
        trainsetScore.scores.branding = 1.0; // Available for branding
        trainsetScore.recommendations.push('Available for branding contracts');
      }

      // 4. MILEAGE BALANCING
      const recentMileage = mileageRecords?.filter(m => m.trainset_id === trainset.id) || [];
      const avgMileage = recentMileage.reduce((sum, r) => sum + Number(r.daily_mileage), 0) / (recentMileage.length || 1);
      const allAvgMileage = (mileageRecords?.reduce((sum, r) => sum + Number(r.daily_mileage), 0) || 0) / (mileageRecords?.length || 1);
      
      const mileageDeviation = Math.abs(avgMileage - allAvgMileage) / (allAvgMileage || 1);
      trainsetScore.scores.mileage = Math.max(0, 1 - mileageDeviation);
      
      if (mileageDeviation > 0.3) {
        trainsetScore.recommendations.push(`Mileage ${avgMileage > allAvgMileage ? 'above' : 'below'} fleet average by ${Math.round(mileageDeviation * 100)}%`);
      }

      // 5. STAFF AVAILABILITY
      const assignedStaff = staffSchedules?.filter(s => s.assigned_trainset_id === trainset.id) || [];
      trainsetScore.scores.staff = assignedStaff.length > 0 ? 1.0 : 0.5;
      
      if (assignedStaff.length === 0) {
        trainsetScore.recommendations.push('No staff currently assigned - check crew availability');
      }

      // 6. STABLING GEOMETRY
      const currentPosition = stablingPositions?.find(p => p.current_occupant === trainset.id);
      if (currentPosition) {
        trainsetScore.scores.stabling = currentPosition.status === 'occupied' ? 1.0 : 0.8;
      } else {
        trainsetScore.scores.stabling = 0.3;
        trainsetScore.recommendations.push('Trainset position unknown - update stabling location');
      }

      // Calculate weighted total score
      trainsetScore.totalScore = 
        trainsetScore.scores.fitness * weights.fitness +
        trainsetScore.scores.maintenance * weights.maintenance +
        trainsetScore.scores.branding * weights.branding +
        trainsetScore.scores.mileage * weights.mileage +
        trainsetScore.scores.staff * weights.staff +
        trainsetScore.scores.stabling * weights.stabling;

      recommendations.push(trainsetScore);
    }

    // Sort by total score (lowest first - need most attention)
    recommendations.sort((a, b) => a.totalScore - b.totalScore);

    const executionTime = Date.now() - startTime;

    // Save optimization history
    const { data: optimizationRecord } = await supabase
      .from('optimization_history')
      .insert({
        algorithm_version: '1.0.0-phase1',
        input_parameters: requestData,
        recommendations: { trainsets: recommendations, conflicts },
        confidence_score: recommendations.length > 0 ? 0.85 : 0.5,
        execution_time_ms: executionTime,
        created_by: user.id,
      })
      .select()
      .single();

    // Save conflicts
    if (conflicts.length > 0 && optimizationRecord) {
      await supabase.from('decision_conflicts').insert(
        conflicts.map(c => ({
          optimization_id: optimizationRecord.id,
          conflict_type: c.type,
          severity: c.severity,
          affected_resources: { trainset_id: c.trainset_id },
          description: c.description,
        }))
      );
    }

    console.log(`Optimization completed in ${executionTime}ms, ${recommendations.length} trainsets analyzed`);

    return new Response(
      JSON.stringify({
        success: true,
        execution_time_ms: executionTime,
        recommendations,
        conflicts,
        summary: {
          total_trainsets: recommendations.length,
          critical_issues: recommendations.filter(r => r.urgency === 'critical').length,
          high_priority: recommendations.filter(r => r.urgency === 'high').length,
          conflicts_detected: conflicts.length,
        },
        optimization_id: optimizationRecord?.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Optimization error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
