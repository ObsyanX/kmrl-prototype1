import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ExplainRequest {
  inductionPlanId?: string;
  trainsetId?: string;
  explanationType: 'decision' | 'constraint' | 'risk' | 'override_impact' | 'what_if';
  context?: any;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const lovableApiKey = Deno.env.get('LOVABLE_API_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('No authorization header');
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    const requestData: ExplainRequest = await req.json();
    console.log('Explainer request:', requestData);

    // Fetch context data
    let inductionPlan = null;
    let trainset = null;
    let constraints = [];
    let conflictHistory = [];

    if (requestData.inductionPlanId) {
      const { data } = await supabase
        .from('induction_plans')
        .select('*, trainsets(*), stabling_positions(*)')
        .eq('id', requestData.inductionPlanId)
        .single();
      inductionPlan = data;
      trainset = data?.trainsets;
    }

    if (requestData.trainsetId && !trainset) {
      const { data } = await supabase
        .from('trainsets')
        .select('*')
        .eq('id', requestData.trainsetId)
        .single();
      trainset = data;
    }

    // Fetch active constraints
    const { data: rulesData } = await supabase
      .from('constraint_rules')
      .select('*')
      .eq('is_active', true);
    constraints = rulesData || [];

    // Fetch conflict history for this trainset
    if (trainset?.id) {
      const { data: conflictsData } = await supabase
        .from('decision_conflicts')
        .select('*')
        .contains('trainset_ids', [trainset.id])
        .order('created_at', { ascending: false })
        .limit(5);
      conflictHistory = conflictsData || [];
    }

    // Build the prompt based on explanation type
    let systemPrompt = `You are AGAMI (Automated Guidance & Assistance for Metro Induction), an expert AI system for explaining metro rail induction planning decisions. 

You provide clear, actionable explanations that help OCC supervisors and depot controllers understand:
- Why specific scheduling decisions were made
- What constraints are binding and why
- Risk factors and their implications
- Impact of potential overrides

Always structure your explanations with:
1. Summary (1-2 sentences)
2. Key factors considered
3. Binding constraints
4. Risk assessment
5. Recommendations

Use professional railway operations terminology. Be concise but thorough.`;

    let userPrompt = '';

    switch (requestData.explanationType) {
      case 'decision':
        userPrompt = `Explain the induction planning decision for this trainset:

TRAINSET: ${trainset?.name || trainset?.train_id || 'Unknown'}
Status: ${trainset?.status}
Battery Level: ${trainset?.battery_level}%
Total Mileage: ${trainset?.total_mileage} km

INDUCTION PLAN:
Scheduled Start: ${inductionPlan?.scheduled_start_time || 'Not scheduled'}
Scheduled End: ${inductionPlan?.scheduled_end_time || 'N/A'}
Platform: ${inductionPlan?.stabling_positions?.bay_name || 'TBA'}
Priority: ${inductionPlan?.priority || 'normal'}
AI Confidence: ${(inductionPlan?.ai_confidence * 100)?.toFixed(1) || 'N/A'}%

CONSTRAINT VIOLATIONS:
${JSON.stringify(inductionPlan?.constraint_violations || [], null, 2)}

BLOCKING ISSUES:
${JSON.stringify(inductionPlan?.blocking_issues || [], null, 2)}

Active Constraints Applied:
${constraints.map(c => `- ${c.rule_name}: ${c.description}`).join('\n')}

Explain why this scheduling decision was made, highlighting the binding constraints and key factors.`;
        break;

      case 'constraint':
        userPrompt = `Analyze the constraint satisfaction for this induction plan:

TRAINSET: ${trainset?.name || 'Unknown'}

ACTIVE CONSTRAINTS:
${constraints.map(c => `
Rule: ${c.rule_name}
Type: ${c.rule_type} (${c.rule_type === 'hard' ? 'Must satisfy' : 'Preference'})
Category: ${c.rule_category}
Parameters: ${JSON.stringify(c.parameters)}
Weight: ${c.weight}
Penalty for violation: ${c.violation_penalty}
`).join('\n---\n')}

VIOLATIONS DETECTED:
${JSON.stringify(inductionPlan?.constraint_violations || [], null, 2)}

Explain which constraints are binding (limiting the solution), which are satisfied with margin, and the implications of any violations.`;
        break;

      case 'risk':
        userPrompt = `Provide a risk assessment for this induction plan:

TRAINSET: ${trainset?.name || 'Unknown'}
Status: ${trainset?.status}

PLAN DETAILS:
Start Time: ${inductionPlan?.scheduled_start_time}
Priority: ${inductionPlan?.priority}
Risk Score: ${inductionPlan?.risk_score}

BLOCKING ISSUES:
${JSON.stringify(inductionPlan?.blocking_issues || [], null, 2)}

HISTORICAL CONFLICTS:
${conflictHistory.map(c => `- ${c.conflict_type}: ${c.description} (Severity: ${c.severity})`).join('\n') || 'No recent conflicts'}

Provide a comprehensive risk assessment including:
1. Immediate risks
2. Operational impact risks
3. Safety considerations
4. Mitigation strategies`;
        break;

      case 'override_impact':
        userPrompt = `Analyze the impact of overriding this AI recommendation:

CURRENT PLAN:
Trainset: ${trainset?.name}
Scheduled Time: ${inductionPlan?.scheduled_start_time}
AI Confidence: ${(inductionPlan?.ai_confidence * 100)?.toFixed(1)}%
AI Reasoning: ${inductionPlan?.ai_reasoning}

OVERRIDE CONTEXT:
${JSON.stringify(requestData.context || {}, null, 2)}

ACTIVE HARD CONSTRAINTS:
${constraints.filter(c => c.rule_type === 'hard').map(c => `- ${c.rule_name}`).join('\n')}

Explain:
1. What happens if this recommendation is overridden
2. Which safety constraints might be affected
3. Downstream scheduling impacts
4. Audit and compliance implications`;
        break;

      case 'what_if':
        userPrompt = `Analyze this what-if scenario:

SCENARIO PARAMETERS:
${JSON.stringify(requestData.context || {}, null, 2)}

CURRENT BASELINE:
Trainset: ${trainset?.name || 'Fleet-wide'}
Current Status: ${trainset?.status || 'Various'}

ACTIVE CONSTRAINTS:
${constraints.map(c => `- ${c.rule_name} (${c.rule_type})`).join('\n')}

Analyze:
1. Feasibility of this scenario
2. Expected impact on throughput
3. Delay propagation risk
4. Resource reallocation needs
5. Recommended adjustments`;
        break;

      default:
        throw new Error('Invalid explanation type');
    }

    // Call Lovable AI Gateway
    const aiResponse = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${lovableApiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.7,
        max_tokens: 1500
      })
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error('Lovable AI error:', errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits exhausted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      throw new Error(`AI Gateway error: ${aiResponse.status}`);
    }

    const aiData = await aiResponse.json();
    const explanation = aiData.choices?.[0]?.message?.content || 'Unable to generate explanation';

    console.log('Explanation generated:', explanation.substring(0, 200) + '...');

    // Save explanation to database
    if (inductionPlan?.id) {
      await supabase.from('ai_explanations').insert({
        induction_plan_id: inductionPlan.id,
        explanation_type: requestData.explanationType,
        active_constraints: constraints.map(c => ({ id: c.id, name: c.rule_name })),
        binding_bottleneck: inductionPlan?.blocking_issues?.[0] || null,
        risk_factors: inductionPlan?.constraint_violations || [],
        natural_language_explanation: explanation
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        explanation_type: requestData.explanationType,
        trainset_id: trainset?.id,
        induction_plan_id: inductionPlan?.id,
        explanation,
        context: {
          trainset: trainset?.name,
          constraints_checked: constraints.length,
          violations_found: inductionPlan?.constraint_violations?.length || 0
        },
        generated_at: new Date().toISOString()
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('AGAMI explainer error:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
