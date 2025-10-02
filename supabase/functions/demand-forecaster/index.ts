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
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { targetDate, daysAhead = 7 } = await req.json();
    
    const startDate = targetDate ? new Date(targetDate) : new Date();
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + daysAhead);

    // Get calendar events in the forecast period
    const { data: events, error: eventsError } = await supabase
      .from('calendar_events')
      .select('*')
      .gte('event_date', startDate.toISOString().split('T')[0])
      .lte('event_date', endDate.toISOString().split('T')[0])
      .order('event_date', { ascending: true });

    if (eventsError) throw eventsError;

    // Generate demand forecast for each day
    const forecast = [];
    for (let d = 0; d < daysAhead; d++) {
      const forecastDate = new Date(startDate);
      forecastDate.setDate(forecastDate.getDate() + d);
      const dateStr = forecastDate.toISOString().split('T')[0];
      
      // Check for events on this date
      const dayEvents = events?.filter(e => e.event_date === dateStr) || [];
      
      // Calculate demand factors
      const demandAnalysis = calculateDemandFactor(forecastDate, dayEvents);
      
      forecast.push({
        date: dateStr,
        day_of_week: forecastDate.toLocaleDateString('en-US', { weekday: 'long' }),
        ...demandAnalysis,
        events: dayEvents.map(e => ({
          name: e.event_name,
          type: e.event_type,
          impact: e.expected_demand_factor,
        })),
      });
    }

    // Calculate overall period statistics
    const avgDemandFactor = forecast.reduce((sum, f) => sum + f.demand_factor, 0) / forecast.length;
    const peakDay = forecast.reduce((max, f) => f.demand_factor > max.demand_factor ? f : max);
    const lowDay = forecast.reduce((min, f) => f.demand_factor < min.demand_factor ? f : min);

    return new Response(JSON.stringify({
      success: true,
      forecast_period: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0],
        days: daysAhead,
      },
      daily_forecast: forecast,
      period_statistics: {
        average_demand_factor: Number(avgDemandFactor.toFixed(2)),
        peak_demand_day: {
          date: peakDay.date,
          factor: peakDay.demand_factor,
          reason: peakDay.demand_drivers.join(', '),
        },
        lowest_demand_day: {
          date: lowDay.date,
          factor: lowDay.demand_factor,
        },
        high_demand_days_count: forecast.filter(f => f.demand_factor >= 1.3).length,
      },
      fleet_recommendations: generateFleetRecommendations(forecast),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Demand forecaster error:', error);
    return new Response(JSON.stringify({
      error: error instanceof Error ? error.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function calculateDemandFactor(date: Date, events: any[]) {
  let baseFactor = 1.0;
  const demandDrivers: string[] = [];
  
  // Day of week factor
  const dayOfWeek = date.getDay();
  if (dayOfWeek === 0 || dayOfWeek === 6) {
    baseFactor *= 0.8; // Weekend reduction
    demandDrivers.push('Weekend pattern');
  } else if (dayOfWeek === 1 || dayOfWeek === 5) {
    baseFactor *= 1.1; // Monday/Friday increase
    demandDrivers.push('Weekday peak');
  }
  
  // Time of month factor
  const dayOfMonth = date.getDate();
  if (dayOfMonth >= 1 && dayOfMonth <= 5) {
    baseFactor *= 1.05; // Start of month
    demandDrivers.push('Month start');
  } else if (dayOfMonth >= 25) {
    baseFactor *= 1.08; // End of month
    demandDrivers.push('Month end');
  }
  
  // Events factor
  let eventMultiplier = 1.0;
  events.forEach(event => {
    if (event.event_type === 'holiday' || event.event_type === 'festival') {
      eventMultiplier = Math.max(eventMultiplier, event.expected_demand_factor || 1.3);
      demandDrivers.push(`${event.event_name} (${event.event_type})`);
    } else if (event.event_type === 'maintenance_window') {
      eventMultiplier *= 0.7;
      demandDrivers.push('Planned maintenance reduction');
    }
  });
  
  baseFactor *= eventMultiplier;
  
  // Seasonal factor (simplified)
  const month = date.getMonth();
  if (month === 11 || month === 0) {
    baseFactor *= 1.15; // Holiday season
    demandDrivers.push('Holiday season');
  } else if (month >= 5 && month <= 7) {
    baseFactor *= 1.1; // Summer travel
    demandDrivers.push('Summer peak');
  }
  
  // Cap demand factor at reasonable limits
  const finalFactor = Math.min(1.8, Math.max(0.5, baseFactor));
  
  return {
    demand_factor: Number(finalFactor.toFixed(2)),
    demand_category: finalFactor >= 1.4 ? 'Very High' :
                    finalFactor >= 1.2 ? 'High' :
                    finalFactor >= 0.9 ? 'Normal' :
                    finalFactor >= 0.7 ? 'Low' : 'Very Low',
    demand_drivers: demandDrivers.length > 0 ? demandDrivers : ['Normal operations'],
    recommended_fleet_size: calculateFleetSize(finalFactor),
  };
}

function calculateFleetSize(demandFactor: number): number {
  const baseFleetSize = 100; // Configurable base fleet
  return Math.ceil(baseFleetSize * demandFactor);
}

function generateFleetRecommendations(forecast: any[]) {
  const recommendations = [];
  
  // Find high-demand consecutive days
  let highDemandStreak = 0;
  for (const day of forecast) {
    if (day.demand_factor >= 1.3) {
      highDemandStreak++;
    } else {
      if (highDemandStreak >= 3) {
        recommendations.push({
          priority: 'high',
          action: `Prepare for ${highDemandStreak}-day high-demand period`,
          impact: 'Fleet availability critical',
        });
      }
      highDemandStreak = 0;
    }
  }
  
  // Peak day preparation
  const peakDays = forecast.filter(f => f.demand_factor >= 1.4);
  if (peakDays.length > 0) {
    recommendations.push({
      priority: 'critical',
      action: `Maximize fleet availability for ${peakDays.length} peak demand day(s)`,
      impact: 'Service quality dependent',
      dates: peakDays.map(d => d.date),
    });
  }
  
  // Low demand optimization
  const lowDays = forecast.filter(f => f.demand_factor <= 0.8);
  if (lowDays.length >= 2) {
    recommendations.push({
      priority: 'medium',
      action: `Schedule major maintenance during ${lowDays.length} low-demand days`,
      impact: 'Cost optimization opportunity',
      dates: lowDays.map(d => d.date),
    });
  }
  
  return recommendations;
}
