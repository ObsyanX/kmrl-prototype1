import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

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

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const { action, certificateId, trainsetId } = await req.json();
    console.log('Certificate validation request:', { action, certificateId, trainsetId });

    if (action === 'validate_all') {
      // Validate all certificates and update statuses
      const { data: certificates, error: fetchError } = await supabase
        .from('fitness_certificates')
        .select('*, trainsets(*)');

      if (fetchError) throw fetchError;

      const now = new Date();
      const updates: any[] = [];

      for (const cert of certificates || []) {
        const expiryDate = new Date(cert.expiry_date);
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        let newStatus: string = cert.status;
        let updateTrainset = false;

        if (daysUntilExpiry < 0) {
          newStatus = 'expired';
          updateTrainset = true;
          updates.push({
            certificateId: cert.id,
            trainsetId: cert.trainset_id,
            oldStatus: cert.status,
            newStatus: 'expired',
            daysUntilExpiry,
            action: 'BLOCK_OPERATIONS',
            message: `Certificate expired ${Math.abs(daysUntilExpiry)} days ago - trainset cannot operate`
          });
        } else if (daysUntilExpiry <= 7) {
          newStatus = 'expiring_soon';
          updateTrainset = true;
          updates.push({
            certificateId: cert.id,
            trainsetId: cert.trainset_id,
            oldStatus: cert.status,
            newStatus: 'expiring_soon',
            daysUntilExpiry,
            action: 'URGENT_RENEWAL',
            message: `Certificate expiring in ${daysUntilExpiry} days - immediate renewal required`
          });
        } else if (daysUntilExpiry <= 30) {
          newStatus = 'expiring_soon';
          updates.push({
            certificateId: cert.id,
            trainsetId: cert.trainset_id,
            oldStatus: cert.status,
            newStatus: 'expiring_soon',
            daysUntilExpiry,
            action: 'SCHEDULE_RENEWAL',
            message: `Certificate expiring in ${daysUntilExpiry} days - schedule renewal`
          });
        } else if (cert.status !== 'valid') {
          newStatus = 'valid';
        }

        // Update certificate status if changed
        if (newStatus !== cert.status) {
          await supabase
            .from('fitness_certificates')
            .update({ status: newStatus })
            .eq('id', cert.id);
        }

        // Update trainset status if certificate is critical
        if (updateTrainset && daysUntilExpiry < 0) {
          await supabase
            .from('trainsets')
            .update({ 
              status: 'awaiting_fitness',
              fitness_certificate_expiry: cert.expiry_date
            })
            .eq('id', cert.trainset_id);
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          total_certificates: certificates?.length || 0,
          updates_required: updates.length,
          critical_issues: updates.filter(u => u.action === 'BLOCK_OPERATIONS').length,
          urgent_renewals: updates.filter(u => u.action === 'URGENT_RENEWAL').length,
          scheduled_renewals: updates.filter(u => u.action === 'SCHEDULE_RENEWAL').length,
          details: updates,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'check_trainset' && trainsetId) {
      // Check specific trainset certificates
      const { data: certificates, error: fetchError } = await supabase
        .from('fitness_certificates')
        .select('*')
        .eq('trainset_id', trainsetId);

      if (fetchError) throw fetchError;

      const now = new Date();
      const analysis = {
        trainset_id: trainsetId,
        total_certificates: certificates?.length || 0,
        valid: 0,
        expiring_soon: 0,
        expired: 0,
        can_operate: true,
        issues: [] as string[],
        recommendations: [] as string[],
      };

      for (const cert of certificates || []) {
        const expiryDate = new Date(cert.expiry_date);
        const daysUntilExpiry = Math.floor((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

        if (daysUntilExpiry < 0) {
          analysis.expired++;
          analysis.can_operate = false;
          analysis.issues.push(`${cert.certificate_type} expired ${Math.abs(daysUntilExpiry)} days ago`);
          analysis.recommendations.push(`CRITICAL: Renew ${cert.certificate_type} immediately - trainset grounded`);
        } else if (daysUntilExpiry <= 7) {
          analysis.expiring_soon++;
          analysis.issues.push(`${cert.certificate_type} expiring in ${daysUntilExpiry} days`);
          analysis.recommendations.push(`URGENT: Schedule ${cert.certificate_type} renewal within ${daysUntilExpiry} days`);
        } else if (daysUntilExpiry <= 30) {
          analysis.expiring_soon++;
          analysis.recommendations.push(`Plan ${cert.certificate_type} renewal in next ${daysUntilExpiry} days`);
        } else {
          analysis.valid++;
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          ...analysis,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );

    } else if (action === 'renew_certificate' && certificateId) {
      // Simulate certificate renewal process
      const { data: oldCert, error: fetchError } = await supabase
        .from('fitness_certificates')
        .select('*')
        .eq('id', certificateId)
        .single();

      if (fetchError) throw fetchError;

      // Create new certificate with extended validity
      const newExpiryDate = new Date();
      newExpiryDate.setMonth(newExpiryDate.getMonth() + 12); // 1 year validity

      const { data: newCert, error: insertError } = await supabase
        .from('fitness_certificates')
        .insert({
          id: `${oldCert.trainset_id}-${oldCert.certificate_type}-${Date.now()}`,
          trainset_id: oldCert.trainset_id,
          certificate_type: oldCert.certificate_type,
          issue_date: new Date().toISOString(),
          expiry_date: newExpiryDate.toISOString(),
          status: 'valid',
          issuing_authority: oldCert.issuing_authority,
          certificate_number: `CERT-${Date.now()}`,
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update old certificate as expired/replaced
      await supabase
        .from('fitness_certificates')
        .update({ status: 'expired' })
        .eq('id', certificateId);

      // Update trainset status
      await supabase
        .from('trainsets')
        .update({
          status: 'operational',
          fitness_certificate_expiry: newExpiryDate.toISOString(),
        })
        .eq('id', oldCert.trainset_id);

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Certificate renewed successfully',
          old_certificate: oldCert,
          new_certificate: newCert,
          new_expiry_date: newExpiryDate.toISOString(),
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action');

  } catch (error) {
    console.error('Certificate validation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
