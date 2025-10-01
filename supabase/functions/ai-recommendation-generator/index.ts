import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AIRequest {
  trainsetId?: string;
  analysisType?: 'induction_planning' | 'maintenance_priority' | 'resource_allocation' | 'conflict_resolution';
  context?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const requestData: AIRequest = await req.json();
    console.log('AI recommendation request:', requestData);

    // Fetch relevant data based on analysis type
    let contextData: any = {};

    if (requestData.trainsetId) {
      const [
        { data: trainset },
        { data: maintenanceJobs },
        { data: certificates },
        { data: mileageRecords }
      ] = await Promise.all([
        supabase.from('trainsets').select('*').eq('id', requestData.trainsetId).single(),
        supabase.from('maintenance_jobs').select('*').eq('trainset_id', requestData.trainsetId),
        supabase.from('fitness_certificates').select('*').eq('trainset_id', requestData.trainsetId),
        supabase.from('mileage_records').select('*').eq('trainset_id', requestData.trainsetId).limit(30)
      ]);

      contextData = { trainset, maintenanceJobs, certificates, mileageRecords };
    }

    // Build AI prompt based on analysis type
    let systemPrompt = '';
    let userPrompt = '';

    switch (requestData.analysisType) {
      case 'induction_planning':
        systemPrompt = `You are an expert train induction planner for Kochi Metro Rail Limited (KMRL). 
Your task is to analyze trainset data and provide intelligent recommendations for induction planning.
Consider: fitness certificates, maintenance schedules, branding contracts, mileage balancing, staff availability, and stabling geometry.
Provide actionable, prioritized recommendations with clear reasoning.`;

        userPrompt = `Analyze this trainset and provide induction planning recommendations:

Trainset: ${contextData.trainset?.name || 'Unknown'} (ID: ${requestData.trainsetId})
Status: ${contextData.trainset?.status}
Total Mileage: ${contextData.trainset?.total_mileage} km
Battery Level: ${contextData.trainset?.battery_level}%
Current Location: ${contextData.trainset?.current_location || 'Unknown'}

Maintenance Jobs: ${contextData.maintenanceJobs?.length || 0} pending
Critical Jobs: ${contextData.maintenanceJobs?.filter((j: any) => j.priority === 'critical').length || 0}

Certificates: ${contextData.certificates?.length || 0}
${contextData.certificates?.map((c: any) => `- ${c.certificate_type}: Expires ${new Date(c.expiry_date).toLocaleDateString()}`).join('\n') || 'None'}

Recent Mileage (last 30 days): ${contextData.mileageRecords?.reduce((sum: number, r: any) => sum + Number(r.daily_mileage), 0) || 0} km

Provide:
1. Immediate actions needed (if any critical issues)
2. Priority recommendations for the next 24 hours
3. Medium-term planning suggestions (next 7 days)
4. Risk assessment and mitigation strategies
5. Resource allocation suggestions

Format as structured JSON with: { immediate_actions: [], priority_24h: [], medium_term: [], risks: [], resources: [] }`;
        break;

      case 'maintenance_priority':
        systemPrompt = `You are a maintenance planning expert for metro rail systems.
Analyze maintenance jobs and provide intelligent prioritization considering safety, operational impact, and resource constraints.`;

        userPrompt = `Analyze these maintenance jobs and recommend optimal prioritization:

${JSON.stringify(contextData.maintenanceJobs || [], null, 2)}

Consider:
- Safety criticality
- Operational impact
- Resource availability
- Preventive vs corrective maintenance
- Dependencies between jobs

Provide prioritized action plan as JSON: { priority_order: [], reasoning: [], estimated_timeline: [] }`;
        break;

      case 'resource_allocation':
        systemPrompt = `You are a resource optimization expert for metro operations.
Analyze staff, equipment, and facility availability to recommend optimal resource allocation.`;

        userPrompt = `Analyze current resource allocation and provide recommendations:

Context: ${JSON.stringify(requestData.context || {}, null, 2)}

Optimize for:
- Operational efficiency
- Cost-effectiveness
- Staff workload balance
- Equipment utilization
- Compliance with regulations

Provide recommendations as JSON: { staff_allocation: [], equipment_usage: [], facility_optimization: [], cost_savings: [] }`;
        break;

      case 'conflict_resolution':
        systemPrompt = `You are a decision support expert for complex operational conflicts in metro systems.
Analyze conflicts between competing priorities and recommend resolution strategies.`;

        userPrompt = `Resolve this operational conflict:

Conflict Details: ${JSON.stringify(requestData.context || {}, null, 2)}

Consider:
- Safety as top priority
- Operational continuity
- Contractual obligations
- Cost implications
- Stakeholder impact

Provide resolution strategy as JSON: { recommended_action: "", trade_offs: [], implementation_steps: [], contingency_plan: "" }`;
        break;

      default:
        throw new Error('Invalid analysis type');
    }

    // Call Gemini AI API
    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${geminiApiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: systemPrompt },
                { text: userPrompt }
              ]
            }
          ],
          generationConfig: {
            temperature: 0.7,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 2048,
          },
        }),
      }
    );

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const aiRecommendation = geminiData.candidates[0]?.content?.parts[0]?.text || '';

    console.log('AI recommendation generated:', aiRecommendation.substring(0, 200) + '...');

    // Try to parse JSON response
    let structuredRecommendation;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiRecommendation.match(/```json\n([\s\S]*?)\n```/) || 
                       aiRecommendation.match(/```\n([\s\S]*?)\n```/) ||
                       [null, aiRecommendation];
      structuredRecommendation = JSON.parse(jsonMatch[1] || aiRecommendation);
    } catch {
      structuredRecommendation = { raw_text: aiRecommendation };
    }

    return new Response(
      JSON.stringify({
        success: true,
        analysis_type: requestData.analysisType,
        trainset_id: requestData.trainsetId,
        recommendation: structuredRecommendation,
        raw_response: aiRecommendation,
        confidence: 0.85,
        generated_at: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AI recommendation error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
