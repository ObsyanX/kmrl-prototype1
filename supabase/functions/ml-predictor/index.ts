import "https://deno.land/x/xhr@0.1.0/mod.ts";
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
    const geminiApiKey = Deno.env.get('GEMINI_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { trainsetId, predictionType = 'reliability' } = await req.json();

    if (!trainsetId) {
      throw new Error('trainsetId is required');
    }

    if (!geminiApiKey) {
      throw new Error('GEMINI_API_KEY not configured');
    }

    console.log(`Generating ${predictionType} prediction for trainset: ${trainsetId}`);

    // Fetch comprehensive data
    const [
      { data: trainset },
      { data: maintenanceJobs },
      { data: mileageRecords },
      { data: certificates }
    ] = await Promise.all([
      supabase.from('trainsets').select('*').eq('id', trainsetId).single(),
      supabase.from('maintenance_jobs').select('*').eq('trainset_id', trainsetId).order('created_at', { ascending: false }).limit(10),
      supabase.from('mileage_records').select('*').eq('trainset_id', trainsetId).order('date', { ascending: false }).limit(30),
      supabase.from('fitness_certificates').select('*').eq('trainset_id', trainsetId)
    ]);

    if (!trainset) {
      throw new Error(`Trainset ${trainsetId} not found`);
    }

    // Calculate derived metrics
    const daysSinceService = trainset.last_service_date 
      ? Math.floor((Date.now() - new Date(trainset.last_service_date).getTime()) / (1000 * 60 * 60 * 24))
      : 999;

    const avgDailyMileage = mileageRecords && mileageRecords.length > 0
      ? mileageRecords.reduce((sum, r) => sum + (r.daily_mileage || 0), 0) / mileageRecords.length
      : 0;

    const recentMaintenance = maintenanceJobs?.slice(0, 5) || [];
    const criticalJobs = maintenanceJobs?.filter(j => j.priority === 'critical').length || 0;

    // Build context for AI
    const prompt = `Analyze train reliability and performance:

TRAIN DATA:
- Train ID: ${trainsetId}
- Total Mileage: ${trainset.total_mileage}km
- Operational Hours: ${trainset.operational_hours}hrs
- Component Health Score: ${trainset.component_health_score || 100}%
- Battery Level: ${trainset.battery_level}%
- Days Since Last Service: ${daysSinceService}
- Average Daily Mileage: ${avgDailyMileage.toFixed(1)}km

MAINTENANCE HISTORY:
- Total Open Job Cards: ${maintenanceJobs?.length || 0}
- Critical Jobs: ${criticalJobs}
- Recent Jobs: ${recentMaintenance.map(j => `${j.job_type} (${j.priority})`).join(', ')}

CERTIFICATES:
- Total Certificates: ${certificates?.length || 0}
- Valid Certificates: ${certificates?.filter(c => c.status === 'valid').length || 0}

IOT ALERTS:
- Active Alerts: ${(trainset.iot_sensor_alerts || []).length}

HISTORICAL PERFORMANCE:
${JSON.stringify(trainset.historical_performance || [], null, 2)}

Based on this data, predict:
1. Reliability Score (0.0-1.0): How reliable is this train for service?
2. Risk Level (low/medium/high): What's the risk of service disruption?
3. Recommended Action: What should operators do?
4. Confidence (0.0-1.0): How confident are you in this prediction?
5. Key Factors: What are the 3 most important factors affecting this prediction?

Respond in JSON format:
{
  "reliability_score": 0.85,
  "risk_level": "medium",
  "recommended_action": "Schedule preventive maintenance within 7 days",
  "confidence": 0.90,
  "key_factors": ["High mileage", "Pending job cards", "Battery level"],
  "reasoning": "Brief explanation"
}`;

    // Call Gemini API
    const geminiResponse = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-goog-api-key': geminiApiKey
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.3,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API error:', geminiResponse.status, errorText);
      throw new Error(`Gemini API error: ${geminiResponse.status}`);
    }

    const geminiData = await geminiResponse.json();
    const generatedText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Parse JSON from response
    let prediction;
    try {
      const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        prediction = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      console.error('Failed to parse Gemini response:', generatedText);
      // Fallback prediction
      prediction = {
        reliability_score: 0.75,
        risk_level: 'medium',
        recommended_action: 'Review detailed metrics',
        confidence: 0.5,
        key_factors: ['Unable to parse AI response'],
        reasoning: 'Fallback prediction due to parse error'
      };
    }

    const result = {
      trainset_id: trainsetId,
      prediction_type: predictionType,
      ...prediction,
      input_data: {
        total_mileage: trainset.total_mileage,
        health_score: trainset.component_health_score || 100,
        days_since_service: daysSinceService,
        open_job_cards: maintenanceJobs?.length || 0,
        critical_jobs: criticalJobs
      },
      timestamp: new Date().toISOString()
    };

    console.log(`Generated ${predictionType} prediction for ${trainsetId}: ${prediction.reliability_score}`);

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error in ml-predictor:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
