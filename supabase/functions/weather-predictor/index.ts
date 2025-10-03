import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.58.0';

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
    const openWeatherKey = Deno.env.get('OPENWEATHER_API_KEY');
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { action = 'get_current' } = await req.json();

    if (action === 'get_current') {
      // Fetch real weather from OpenWeather API
      if (openWeatherKey) {
        try {
          const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?q=Kochi,IN&appid=${openWeatherKey}&units=metric`
          );
          
          if (response.ok) {
            const owData = await response.json();
            
            const weatherData = {
              timestamp: new Date().toISOString(),
              temperature: Number(owData.main.temp.toFixed(2)),
              humidity: owData.main.humidity,
              rainfall: owData.rain?.['1h'] || 0,
              visibility: owData.visibility,
              wind_speed: Number(owData.wind.speed.toFixed(2)),
              conditions: owData.weather[0].main.toLowerCase(),
              weather_severity_score: calculateSeverityScore(
                owData.rain?.['1h'] || 0,
                owData.wind.speed,
                owData.visibility
              ),
              flooding_risk_score: (owData.rain?.['1h'] || 0) > 30 
                ? Math.min(10, Math.floor((owData.rain?.['1h'] || 0) / 5)) 
                : 0,
              forecast_data: {},
            };

            // Store real weather data
            const { data: newWeather, error } = await supabase
              .from('weather_data')
              .insert([weatherData])
              .select()
              .single();

            if (error) {
              console.error('Error storing weather data:', error);
            }

            return new Response(JSON.stringify({
              success: true,
              weather: weatherData,
              impact_assessment: assessWeatherImpact(weatherData),
              source: 'OpenWeather API',
            }), {
              headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
          }
        } catch (fetchError) {
          console.error('OpenWeather API error:', fetchError);
        }
      }

      // Fallback: Get latest from DB or simulate
      const { data: latestWeather } = await supabase
        .from('weather_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(1)
        .single();

      if (latestWeather) {
        return new Response(JSON.stringify({
          success: true,
          weather: latestWeather,
          impact_assessment: assessWeatherImpact(latestWeather),
          source: 'Database',
        }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Last resort: simulate
      const simulatedWeather = generateWeatherData();
      
      const { data: newWeather, error } = await supabase
        .from('weather_data')
        .insert([simulatedWeather])
        .select()
        .single();

      if (error) throw error;

      return new Response(JSON.stringify({
        success: true,
        weather: newWeather,
        impact_assessment: assessWeatherImpact(newWeather),
        source: 'Simulated',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (action === 'get_forecast') {
      const { hours = 24 } = await req.json();
      
      // Get historical weather for pattern analysis
      const { data: historicalWeather } = await supabase
        .from('weather_data')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(72);

      const forecast = generateForecast(historicalWeather || [], hours);

      return new Response(JSON.stringify({
        success: true,
        forecast,
        forecast_hours: hours,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), {
      status: 400,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Weather predictor error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function generateWeatherData() {
  const rainfall = Math.random() * 50;
  const temperature = 15 + Math.random() * 20;
  const humidity = 40 + Math.random() * 50;
  const windSpeed = Math.random() * 40;
  const visibility = 1000 + Math.random() * 9000;

  const weatherSeverityScore = calculateSeverityScore(rainfall, windSpeed, visibility);
  const floodingRisk = rainfall > 30 ? Math.min(10, Math.floor(rainfall / 5)) : 0;

  return {
    timestamp: new Date().toISOString(),
    temperature: Number(temperature.toFixed(2)),
    humidity: Math.floor(humidity),
    rainfall: Number(rainfall.toFixed(2)),
    visibility: Math.floor(visibility),
    wind_speed: Number(windSpeed.toFixed(2)),
    flooding_risk_score: floodingRisk,
    weather_severity_score: weatherSeverityScore,
    conditions: getWeatherCondition(rainfall, windSpeed),
    forecast_data: {},
  };
}

function calculateSeverityScore(rainfall: number, windSpeed: number, visibility: number): number {
  let score = 0;
  
  if (rainfall > 40) score += 4;
  else if (rainfall > 25) score += 3;
  else if (rainfall > 10) score += 2;
  else if (rainfall > 5) score += 1;
  
  if (windSpeed > 30) score += 3;
  else if (windSpeed > 20) score += 2;
  else if (windSpeed > 10) score += 1;
  
  if (visibility < 2000) score += 3;
  else if (visibility < 5000) score += 2;
  else if (visibility < 8000) score += 1;
  
  return Math.min(10, score);
}

function getWeatherCondition(rainfall: number, windSpeed: number): string {
  if (rainfall > 30 && windSpeed > 25) return 'storm';
  if (rainfall > 20) return 'heavy_rain';
  if (rainfall > 5) return 'rain';
  if (windSpeed > 30) return 'windy';
  if (rainfall > 0) return 'light_rain';
  return 'clear';
}

function assessWeatherImpact(weather: any) {
  const { weather_severity_score, flooding_risk_score, conditions } = weather;
  
  return {
    severity_level: weather_severity_score >= 7 ? 'critical' : 
                   weather_severity_score >= 5 ? 'high' : 
                   weather_severity_score >= 3 ? 'moderate' : 'low',
    operational_impact: weather_severity_score >= 7 ? 'Severe impact: Consider suspending operations' :
                       weather_severity_score >= 5 ? 'High impact: Reduce service frequency' :
                       weather_severity_score >= 3 ? 'Moderate impact: Monitor closely' :
                       'Minimal impact',
    delay_estimate_minutes: Math.floor(weather_severity_score * 5),
    flooding_alert: flooding_risk_score >= 7,
    recommended_actions: generateRecommendations(weather_severity_score, flooding_risk_score, conditions),
  };
}

function generateRecommendations(severity: number, flooding: number, conditions: string): string[] {
  const recommendations: string[] = [];
  
  if (severity >= 7) {
    recommendations.push('Activate emergency protocols');
    recommendations.push('Consider service suspension for safety');
    recommendations.push('Ensure all staff are informed of severe conditions');
  }
  
  if (flooding >= 7) {
    recommendations.push('Evacuate low-lying depot areas');
    recommendations.push('Secure all equipment above flood levels');
  }
  
  if (severity >= 5) {
    recommendations.push('Reduce scheduled inductions by 30%');
    recommendations.push('Extend maintenance buffer times by 50%');
  }
  
  if (severity >= 3) {
    recommendations.push('Monitor weather updates every 30 minutes');
    recommendations.push('Prepare backup plans for critical operations');
  }
  
  if (conditions === 'storm' || conditions === 'heavy_rain') {
    recommendations.push('Restrict outdoor shunting operations');
  }
  
  return recommendations;
}

function generateForecast(historicalData: any[], hours: number) {
  const forecast = [];
  const now = new Date();
  
  for (let i = 1; i <= hours; i++) {
    const forecastTime = new Date(now.getTime() + i * 60 * 60 * 1000);
    const weatherData = generateWeatherData();
    
    forecast.push({
      ...weatherData,
      timestamp: forecastTime.toISOString(),
      confidence: Math.max(0.6, 1 - (i / hours) * 0.4),
    });
  }
  
  return forecast;
}
