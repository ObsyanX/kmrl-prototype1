import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InductionRequest {
  trainsetId: string;
  inductionDate?: string;
  priority?: 'normal' | 'urgent' | 'emergency';
  constraints?: string[];
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

    const requestData: InductionRequest = await req.json();
    console.log('Induction planning request:', requestData);

    const { trainsetId, inductionDate, priority = 'normal' } = requestData;

    // Step 1: Fetch trainset data
    const { data: trainset, error: trainsetError } = await supabase
      .from('trainsets')
      .select('*')
      .eq('id', trainsetId)
      .single();

    if (trainsetError || !trainset) {
      throw new Error('Trainset not found');
    }

    // Step 2: Validate fitness certificate
    const { data: certificates } = await supabase
      .from('fitness_certificates')
      .select('*')
      .eq('trainset_id', trainsetId)
      .order('expiry_date', { ascending: false });

    const validCert = certificates?.find(c => {
      const expiry = new Date(c.expiry_date);
      return expiry > new Date();
    });

    if (!validCert) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Cannot induct trainset: No valid fitness certificate',
          can_proceed: false,
          required_actions: ['Renew fitness certificate', 'Complete safety inspection'],
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    // Step 3: Check pending maintenance
    const { data: pendingJobs } = await supabase
      .from('maintenance_jobs')
      .select('*')
      .eq('trainset_id', trainsetId)
      .in('status', ['pending', 'scheduled', 'in_progress']);

    const criticalJobs = pendingJobs?.filter(j => j.priority === 'critical') || [];
    const blockingIssues: string[] = [];

    if (criticalJobs.length > 0) {
      blockingIssues.push(`${criticalJobs.length} critical maintenance job(s) pending`);
    }

    // Step 4: Check stabling availability
    const targetDate = inductionDate ? new Date(inductionDate) : new Date();
    const { data: availablePositions } = await supabase
      .from('stabling_positions')
      .select('*')
      .eq('status', 'available')
      .or('status.eq.available,current_occupant.is.null');

    if (!availablePositions || availablePositions.length === 0) {
      blockingIssues.push('No stabling positions available');
    }

    // Step 5: Check staff availability
    const dateStr = targetDate.toISOString().split('T')[0];
    const { data: availableStaff } = await supabase
      .from('staff_schedules')
      .select('*')
      .eq('date', dateStr)
      .is('assigned_trainset_id', null);

    const requiredRoles = ['driver', 'conductor'];
    const staffByRole: Record<string, any[]> = {};
    
    for (const role of requiredRoles) {
      staffByRole[role] = availableStaff?.filter(s => s.role === role) || [];
      if (staffByRole[role].length === 0) {
        blockingIssues.push(`No ${role} available on ${dateStr}`);
      }
    }

    // Step 6: Check branding requirements
    const { data: brandingContracts } = await supabase
      .from('branding_contracts')
      .select('*')
      .contains('assigned_trainsets', [trainsetId])
      .eq('status', 'active');

    const activeBranding = brandingContracts && brandingContracts.length > 0;

    // Step 7: Generate induction plan
    const inductionPlan = {
      trainset: {
        id: trainset.id,
        name: trainset.name,
        status: trainset.status,
      },
      can_proceed: blockingIssues.length === 0,
      blocking_issues: blockingIssues,
      priority,
      scheduled_date: targetDate.toISOString(),
      fitness_certificate: {
        valid: true,
        expires: validCert.expiry_date,
        days_remaining: Math.floor((new Date(validCert.expiry_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      },
      maintenance_status: {
        pending_jobs: pendingJobs?.length || 0,
        critical_jobs: criticalJobs.length,
        high_priority_jobs: pendingJobs?.filter(j => j.priority === 'high').length || 0,
        estimated_completion: criticalJobs.length > 0 ? 'TBD - Complete critical maintenance first' : 'Ready',
      },
      stabling_assignment: availablePositions && availablePositions.length > 0 ? {
        recommended_position: availablePositions[0].id,
        position_name: availablePositions[0].position_name,
        facilities: availablePositions[0].facilities,
      } : null,
      staff_assignment: blockingIssues.length === 0 ? {
        driver: staffByRole.driver?.[0]?.staff_name || 'TBD',
        conductor: staffByRole.conductor?.[0]?.staff_name || 'TBD',
      } : null,
      branding_status: activeBranding ? {
        has_active_contract: true,
        client: brandingContracts?.[0]?.client_name,
        priority_level: brandingContracts?.[0]?.priority_level,
      } : {
        has_active_contract: false,
        available_for_branding: true,
      },
      recommendations: [] as string[],
      estimated_ready_time: 'TBD',
    };

    // Add recommendations
    if (inductionPlan.can_proceed) {
      inductionPlan.recommendations.push('Trainset ready for induction');
      inductionPlan.recommendations.push('Assign crew and confirm stabling position');
      inductionPlan.estimated_ready_time = 'Within 2 hours';
      
      if (inductionPlan.fitness_certificate.days_remaining < 30) {
        inductionPlan.recommendations.push('Schedule fitness certificate renewal soon');
      }
    } else {
      inductionPlan.recommendations.push('Resolve blocking issues before induction:');
      inductionPlan.recommendations.push(...blockingIssues.map(issue => `- ${issue}`));
      
      if (criticalJobs.length > 0) {
        const estimatedTime = criticalJobs.reduce((sum, job) => sum + (job.estimated_duration || 0), 0);
        inductionPlan.estimated_ready_time = `${Math.ceil(estimatedTime / 60)} hours (after maintenance completion)`;
      }
    }

    // Step 8: If can proceed, create preliminary schedule
    if (inductionPlan.can_proceed && priority !== 'normal') {
      // Auto-assign resources for urgent/emergency inductions
      if (availablePositions && availablePositions.length > 0) {
        await supabase
          .from('stabling_positions')
          .update({
            current_occupant: trainsetId,
            status: 'reserved',
          })
          .eq('id', availablePositions[0].id);
      }

      // Assign staff
      for (const role of requiredRoles) {
        if (staffByRole[role].length > 0) {
          await supabase
            .from('staff_schedules')
            .update({ assigned_trainset_id: trainsetId })
            .eq('id', staffByRole[role][0].id);
        }
      }

      inductionPlan.recommendations.push('Resources auto-assigned due to priority level');
    }

    console.log('Induction plan generated:', inductionPlan.can_proceed ? 'APPROVED' : 'BLOCKED');

    return new Response(
      JSON.stringify({
        success: true,
        ...inductionPlan,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Induction planning error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
