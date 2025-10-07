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

    console.log('Generating fleet-wide analytics');

    const currentDate = new Date();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    // Fetch all data in parallel
    const [
      { data: trainsets },
      { data: certificates },
      { data: maintenanceJobs },
      { data: brandingContracts },
      { data: mileageRecords },
      { data: stablingPositions },
      { data: recentOptimizations }
    ] = await Promise.all([
      supabase.from('trainsets').select('*'),
      supabase.from('fitness_certificates').select('*'),
      supabase.from('maintenance_jobs').select('*').in('status', ['pending', 'in_progress']),
      supabase.from('branding_contracts').select('*').eq('status', 'active'),
      supabase.from('mileage_records').select('*').gte('date', thirtyDaysAgo.toISOString().split('T')[0]),
      supabase.from('stabling_positions').select('*'),
      supabase.from('optimization_history').select('*').order('created_at', { ascending: false }).limit(10)
    ]);

    if (!trainsets || trainsets.length === 0) {
      throw new Error('No trainsets found');
    }

    // === FLEET READINESS ===
    let serviceReady = 0;
    let partiallyReady = 0;
    let notReady = 0;

    trainsets.forEach(trainset => {
      const validCert = certificates?.find(c => 
        c.trainset_id === trainset.id && 
        c.status === 'valid' && 
        new Date(c.expiry_date) > currentDate
      );
      const criticalMaintenance = maintenanceJobs?.find(j => 
        j.trainset_id === trainset.id && 
        j.priority === 'critical'
      );
      const healthScore = trainset.component_health_score || 100;

      if (validCert && !criticalMaintenance && healthScore >= 70) {
        serviceReady++;
      } else if (validCert || (!criticalMaintenance && healthScore >= 50)) {
        partiallyReady++;
      } else {
        notReady++;
      }
    });

    const readinessRate = (serviceReady / trainsets.length) * 100;

    // === MILEAGE STATISTICS ===
    const mileages = trainsets.map(t => t.total_mileage || 0);
    const avgMileage = mileages.reduce((sum, m) => sum + m, 0) / mileages.length;
    const maxMileage = Math.max(...mileages);
    const minMileage = Math.min(...mileages);
    const mileageStdDev = Math.sqrt(
      mileages.reduce((sum, m) => sum + Math.pow(m - avgMileage, 2), 0) / mileages.length
    );

    // Calculate daily mileage trends
    const dailyMileageByTrainset: { [key: string]: number } = {};
    mileageRecords?.forEach(record => {
      if (!dailyMileageByTrainset[record.trainset_id]) {
        dailyMileageByTrainset[record.trainset_id] = 0;
      }
      dailyMileageByTrainset[record.trainset_id] += record.daily_mileage || 0;
    });

    // === BRANDING COMPLIANCE ===
    const brandingShortfalls: { contract: string; shortfall: number }[] = [];
    brandingContracts?.forEach(contract => {
      const assignedTrainsets = contract.assigned_trainsets || [];
      assignedTrainsets.forEach((trainsetId: string) => {
        const trainset = trainsets.find(t => t.id === trainsetId);
        if (trainset) {
          const requiredHours = contract.requirements?.min_hours || 0;
          const currentHours = trainset.operational_hours || 0;
          if (currentHours < requiredHours) {
            brandingShortfalls.push({
              contract: contract.client_name,
              shortfall: requiredHours - currentHours
            });
          }
        }
      });
    });

    // === HEALTH DISTRIBUTION ===
    const healthDistribution = {
      excellent: trainsets.filter(t => (t.component_health_score || 100) >= 90).length,
      good: trainsets.filter(t => (t.component_health_score || 100) >= 70 && (t.component_health_score || 100) < 90).length,
      fair: trainsets.filter(t => (t.component_health_score || 100) >= 50 && (t.component_health_score || 100) < 70).length,
      poor: trainsets.filter(t => (t.component_health_score || 100) < 50).length
    };

    const avgHealthScore = trainsets.reduce((sum, t) => sum + (t.component_health_score || 100), 0) / trainsets.length;

    // === CERTIFICATE STATUS ===
    const certificateStatus = {
      valid: certificates?.filter(c => c.status === 'valid' && new Date(c.expiry_date) > currentDate).length || 0,
      expiringSoon: certificates?.filter(c => {
        const daysToExpiry = (new Date(c.expiry_date).getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24);
        return c.status === 'valid' && daysToExpiry > 0 && daysToExpiry <= 30;
      }).length || 0,
      expired: certificates?.filter(c => c.status === 'expired' || new Date(c.expiry_date) < currentDate).length || 0
    };

    // === MAINTENANCE BACKLOG ===
    const maintenanceBacklog = {
      critical: maintenanceJobs?.filter(j => j.priority === 'critical').length || 0,
      high: maintenanceJobs?.filter(j => j.priority === 'high').length || 0,
      medium: maintenanceJobs?.filter(j => j.priority === 'medium').length || 0,
      low: maintenanceJobs?.filter(j => j.priority === 'low').length || 0,
      total: maintenanceJobs?.length || 0
    };

    // === STABLING UTILIZATION ===
    const occupiedPositions = stablingPositions?.filter(p => p.status === 'occupied').length || 0;
    const totalPositions = stablingPositions?.length || 1;
    const stablingUtilization = (occupiedPositions / totalPositions) * 100;

    // === OPTIMIZATION PERFORMANCE ===
    const avgOptimizationTime = (recentOptimizations && recentOptimizations.length > 0)
      ? recentOptimizations.reduce((sum, opt) => sum + (opt.execution_time_ms || 0), 0) / recentOptimizations.length
      : 0;

    const avgConfidenceScore = (recentOptimizations && recentOptimizations.length > 0)
      ? recentOptimizations.reduce((sum, opt) => sum + (opt.confidence_score || 0), 0) / recentOptimizations.length
      : 0;

    // === FLEET KPIs ===
    const kpis = {
      fleet_size: trainsets.length,
      readiness: {
        service_ready: serviceReady,
        partially_ready: partiallyReady,
        not_ready: notReady,
        readiness_rate_percent: readinessRate
      },
      mileage: {
        average: avgMileage,
        max: maxMileage,
        min: minMileage,
        std_deviation: mileageStdDev,
        imbalance_score: (mileageStdDev / avgMileage) * 100
      },
      health: {
        average_score: avgHealthScore,
        distribution: healthDistribution
      },
      certificates: certificateStatus,
      maintenance: maintenanceBacklog,
      branding: {
        active_contracts: brandingContracts?.length || 0,
        shortfalls: brandingShortfalls,
        compliance_rate: ((brandingContracts?.length || 0) - brandingShortfalls.length) / Math.max(brandingContracts?.length || 1, 1) * 100
      },
      stabling: {
        total_positions: totalPositions,
        occupied: occupiedPositions,
        available: totalPositions - occupiedPositions,
        utilization_percent: stablingUtilization
      },
      optimization_performance: {
        recent_runs: recentOptimizations?.length || 0,
        avg_execution_time_ms: avgOptimizationTime,
        avg_confidence_score: avgConfidenceScore
      },
      timestamp: new Date().toISOString()
    };

    console.log(`Generated fleet analytics: ${trainsets.length} trainsets, ${readinessRate.toFixed(1)}% ready`);

    return new Response(JSON.stringify(kpis), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in fleet-analytics:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
