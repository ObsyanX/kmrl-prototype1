import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OverrideRequest {
  action: 'store' | 'suggest' | 'feedback';
  data?: {
    fromTrainId: string;
    toTrainId: string;
    reason: string;
    userId?: string;
    userName?: string;
    context?: Record<string, unknown>;
  };
  overrideId?: string;
  success?: boolean;
}

interface OverrideSuggestion {
  id: string;
  pattern: string;
  suggestedAction: string;
  confidence: number;
  basedOnCount: number;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const request = await req.json() as OverrideRequest;

    switch (request.action) {
      case 'store': {
        if (!request.data) {
          throw new Error('Missing override data');
        }

        const { fromTrainId, toTrainId, reason, userId, userName, context } = request.data;

        // Store the override decision
        const { data: override, error } = await supabase
          .from('override_decisions')
          .insert({
            from_train_id: fromTrainId,
            to_train_id: toTrainId,
            reason,
            user_id: userId,
            user_name: userName || 'Unknown',
            context: context || {},
            timestamp: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;

        // Also log to audit trail
        await supabase.from('audit_actions').insert({
          action_type: 'override_decision',
          entity_type: 'induction_plan',
          entity_id: fromTrainId,
          user_id: userId,
          user_role: 'supervisor',
          action_details: {
            from_train: fromTrainId,
            to_train: toTrainId,
            reason,
          },
          previous_state: { scheduled_train: fromTrainId },
          new_state: { scheduled_train: toTrainId },
          reason,
        });

        console.log(`Override stored: ${fromTrainId} → ${toTrainId}`);

        return new Response(JSON.stringify({ 
          success: true, 
          overrideId: override.id 
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'suggest': {
        // Get last 20 override decisions to find patterns
        const { data: recentOverrides } = await supabase
          .from('override_decisions')
          .select('*')
          .order('timestamp', { ascending: false })
          .limit(20);

        if (!recentOverrides || recentOverrides.length === 0) {
          return new Response(JSON.stringify({ suggestions: [] }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        // Analyze patterns in override reasons
        const reasonPatterns = new Map<string, number>();
        const trainPatterns = new Map<string, { count: number; trains: Set<string> }>();

        for (const override of recentOverrides) {
          // Extract key reason phrases
          const reason = override.reason?.toLowerCase() || '';
          const patterns = extractPatterns(reason);
          
          for (const pattern of patterns) {
            reasonPatterns.set(pattern, (reasonPatterns.get(pattern) || 0) + 1);
          }

          // Track train substitution patterns
          const key = `${override.from_train_id}`;
          if (!trainPatterns.has(key)) {
            trainPatterns.set(key, { count: 0, trains: new Set() });
          }
          const entry = trainPatterns.get(key)!;
          entry.count++;
          entry.trains.add(override.to_train_id);
        }

        // Generate suggestions based on patterns
        const suggestions: OverrideSuggestion[] = [];

        // Find common reason patterns
        const sortedPatterns = Array.from(reasonPatterns.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5);

        for (const [pattern, count] of sortedPatterns) {
          if (count >= 2) {
            suggestions.push({
              id: `pattern_${pattern.replace(/\s+/g, '_')}`,
              pattern: `"${pattern}" cited ${count} times`,
              suggestedAction: getSuggestionForPattern(pattern),
              confidence: Math.min(90, 50 + count * 10),
              basedOnCount: count,
            });
          }
        }

        // Find frequently overridden trains
        for (const [trainId, data] of trainPatterns.entries()) {
          if (data.count >= 3) {
            suggestions.push({
              id: `train_${trainId}`,
              pattern: `Train ${trainId} overridden ${data.count} times`,
              suggestedAction: 'Review maintenance status or consider removing from service rotation',
              confidence: Math.min(85, 40 + data.count * 8),
              basedOnCount: data.count,
            });
          }
        }

        console.log(`Generated ${suggestions.length} suggestions from ${recentOverrides.length} overrides`);

        return new Response(JSON.stringify({ 
          suggestions,
          totalOverrides: recentOverrides.length,
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      case 'feedback': {
        if (!request.overrideId) {
          throw new Error('Missing override ID for feedback');
        }

        // Update the override decision with outcome
        const { error } = await supabase
          .from('override_decisions')
          .update({ 
            outcome_success: request.success,
            ai_suggestion_used: false,
          })
          .eq('id', request.overrideId);

        if (error) throw error;

        console.log(`Feedback recorded for override ${request.overrideId}: ${request.success ? 'success' : 'failure'}`);

        return new Response(JSON.stringify({ success: true }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      default:
        throw new Error(`Unknown action: ${request.action}`);
    }

  } catch (error) {
    console.error('Override Learner error:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Operation failed' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function extractPatterns(reason: string): string[] {
  const patterns: string[] = [];
  
  // Common override reason keywords
  const keywords = [
    'maintenance', 'cleaning', 'fitness', 'certificate', 'expired',
    'mileage', 'battery', 'urgent', 'priority', 'vip', 'emergency',
    'delay', 'breakdown', 'inspection', 'shunting', 'position',
  ];

  for (const keyword of keywords) {
    if (reason.includes(keyword)) {
      patterns.push(keyword);
    }
  }

  return patterns;
}

function getSuggestionForPattern(pattern: string): string {
  const suggestions: Record<string, string> = {
    'maintenance': 'Consider pre-scheduling maintenance checks before service assignment',
    'cleaning': 'Review cleaning schedule alignment with induction planning',
    'fitness': 'Implement automated fitness certificate expiry alerts',
    'certificate': 'Add certificate validation to Layer 1 readiness calculation',
    'expired': 'Set up 7-day advance expiry warnings',
    'mileage': 'Review mileage balancing algorithm parameters',
    'battery': 'Add battery level to readiness score calculation',
    'urgent': 'Create fast-track override process for urgent situations',
    'priority': 'Review priority slot assignment algorithm',
    'vip': 'Consider VIP service requirements in scheduling',
    'emergency': 'Document emergency override procedures',
    'delay': 'Analyze delay patterns for proactive scheduling',
    'breakdown': 'Increase standby train buffer during peak hours',
    'inspection': 'Align inspection schedules with off-peak hours',
    'shunting': 'Optimize parking assignments to minimize shunting',
    'position': 'Review track position assignment strategy',
  };

  return suggestions[pattern] || 'Review and adjust relevant scheduling parameters';
}
