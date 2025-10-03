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

    const { days = 90 } = await req.json();
    
    console.log(`Generating comprehensive ${days}-day dataset for ML training...`);
    
    const results = {
      weather: 0,
      calendarEvents: 0,
      operationOutcomes: 0,
      performanceMetrics: 0,
      depotCongestion: 0,
      mileageRecords: 0,
      cleaningSchedules: 0,
      incidents: 0,
      accuracyMetrics: 0
    };

    // Generate realistic 90-day historical data
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. Weather Data - 4 records per day (every 6 hours)
    const weatherData = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      for (let hour = 0; hour < 24; hour += 6) {
        const timestamp = new Date(date);
        timestamp.setHours(hour, 0, 0, 0);
        
        // Monsoon season pattern (June-September)
        const month = timestamp.getMonth();
        const isMonsoon = month >= 5 && month <= 8;
        
        const rainfall = isMonsoon 
          ? Math.random() * 50 + (Math.random() > 0.7 ? 30 : 0) // Heavy rain during monsoon
          : Math.random() * 5; // Light rain otherwise
        
        const temperature = 25 + Math.random() * 10 + (isMonsoon ? -3 : 2);
        const humidity = isMonsoon ? 75 + Math.random() * 20 : 55 + Math.random() * 25;
        const windSpeed = Math.random() * 20 + (isMonsoon ? 10 : 0);
        const visibility = Math.max(100, 10000 - rainfall * 100 - windSpeed * 50);
        
        const severityScore = calculateSeverityScore(rainfall, windSpeed, visibility);
        const floodingRisk = rainfall > 30 ? Math.floor(Math.random() * 5) + 6 : Math.floor(Math.random() * 5);
        
        weatherData.push({
          timestamp: timestamp.toISOString(),
          temperature: temperature.toFixed(1),
          humidity: Math.round(humidity),
          rainfall: rainfall.toFixed(1),
          wind_speed: windSpeed.toFixed(1),
          visibility: Math.round(visibility),
          conditions: getWeatherCondition(rainfall, windSpeed),
          weather_severity_score: severityScore,
          flooding_risk_score: floodingRisk,
          forecast_data: {
            next_6h: {
              rainfall_probability: Math.random() * 100,
              temperature_change: (Math.random() - 0.5) * 4
            }
          }
        });
      }
    }

    const { data: weatherInserted, error: weatherError } = await supabase
      .from('weather_data')
      .insert(weatherData);
    
    if (weatherError) console.error('Weather insert error:', weatherError);
    else results.weather = weatherData.length;

    // 2. Calendar Events - Major festivals and events
    const events = [
      { name: 'Onam Festival', date: -75, multiplier: 2.5, type: 'festival' },
      { name: 'Diwali', date: -50, multiplier: 3.0, type: 'festival' },
      { name: 'Christmas', date: -25, multiplier: 2.2, type: 'festival' },
      { name: 'Tech Summit Kochi', date: -40, multiplier: 1.8, type: 'conference' },
      { name: 'School Reopening', date: -60, multiplier: 1.5, type: 'academic' },
      { name: 'Thrissur Pooram', date: -70, multiplier: 2.8, type: 'festival' },
      { name: 'New Year', date: -15, multiplier: 2.0, type: 'holiday' },
      { name: 'Independence Day', date: -85, multiplier: 1.6, type: 'national_holiday' }
    ];

    const calendarEvents = events.map(event => {
      const eventDate = new Date(startDate);
      eventDate.setDate(eventDate.getDate() + days + event.date);
      
      return {
        event_name: event.name,
        event_type: event.type,
        event_date: eventDate.toISOString().split('T')[0],
        ridership_multiplier: event.multiplier,
        expected_demand_factor: event.multiplier,
        fleet_adjustment_required: event.multiplier > 2.0,
        notes: `${event.name} - Expected ${Math.round((event.multiplier - 1) * 100)}% increase in ridership`
      };
    });

    const { error: eventsError } = await supabase
      .from('calendar_events')
      .insert(calendarEvents);
    
    if (eventsError) console.error('Events insert error:', eventsError);
    else results.calendarEvents = calendarEvents.length;

    // 3. Fetch trainsets for realistic data
    const { data: trainsets } = await supabase
      .from('trainsets')
      .select('id, name');

    if (!trainsets || trainsets.length === 0) {
      throw new Error('No trainsets found. Please create trainsets first.');
    }

    // 4. Operation Outcomes - 2-3 per trainset per day
    const operationOutcomes = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Select 15-20 trainsets for service each day
      const dailyTrainsets = trainsets
        .sort(() => Math.random() - 0.5)
        .slice(0, Math.floor(Math.random() * 6) + 15);
      
      for (const trainset of dailyTrainsets) {
        const plannedTime = new Date(date);
        plannedTime.setHours(Math.floor(Math.random() * 4) + 4, Math.floor(Math.random() * 60));
        
        const actualTime = new Date(plannedTime);
        const delay = Math.random() > 0.8 ? Math.floor(Math.random() * 30) + 5 : 0;
        actualTime.setMinutes(actualTime.getMinutes() + delay);
        
        const predictedDuration = 720 + Math.floor(Math.random() * 120); // 12-14 hours
        const actualDuration = predictedDuration + (Math.random() - 0.5) * 60;
        
        const predictedConflicts = Math.floor(Math.random() * 3);
        const actualConflicts = Math.random() > 0.85 ? predictedConflicts + 1 : predictedConflicts;
        
        const weatherImpact = Math.floor(Math.random() * 20);
        const congestionImpact = Math.floor(Math.random() * 15);
        
        const deviationMinutes = Math.abs(actualDuration - predictedDuration);
        const punctualityAchieved = delay < 5;
        
        // Success score calculation
        const durationAccuracy = Math.max(0, 100 - (deviationMinutes / predictedDuration) * 100);
        const conflictAccuracy = predictedConflicts === actualConflicts ? 100 : 50;
        const punctualityScore = punctualityAchieved ? 100 : Math.max(0, 100 - delay * 3);
        const successScore = (durationAccuracy * 0.4 + conflictAccuracy * 0.3 + punctualityScore * 0.3) / 100;
        
        operationOutcomes.push({
          trainset_id: trainset.id,
          planned_induction_time: plannedTime.toISOString(),
          actual_induction_time: actualTime.toISOString(),
          predicted_duration_minutes: Math.round(predictedDuration),
          actual_duration_minutes: Math.round(actualDuration),
          predicted_conflicts: predictedConflicts,
          actual_conflicts: actualConflicts,
          weather_impact_predicted: weatherImpact,
          weather_impact_actual: weatherImpact + (Math.random() - 0.5) * 5,
          congestion_impact_predicted: congestionImpact,
          congestion_impact_actual: congestionImpact + (Math.random() - 0.5) * 5,
          punctuality_achieved: punctualityAchieved,
          deviation_minutes: Math.round(deviationMinutes),
          success_score: successScore.toFixed(4),
          learning_data: {
            weather_condition: weatherData[i * 4].conditions,
            day_of_week: date.getDay(),
            was_festival: calendarEvents.some(e => e.event_date === date.toISOString().split('T')[0])
          }
        });
      }
    }

    const { error: outcomesError } = await supabase
      .from('operation_outcomes')
      .insert(operationOutcomes);
    
    if (outcomesError) console.error('Outcomes insert error:', outcomesError);
    else results.operationOutcomes = operationOutcomes.length;

    // 5. Performance Metrics - Daily aggregations
    const performanceMetrics = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      const dayOutcomes = operationOutcomes.filter(o => {
        const outcomeDate = new Date(o.planned_induction_time);
        return outcomeDate.toDateString() === date.toDateString();
      });
      
      if (dayOutcomes.length > 0) {
        const totalPredictions = dayOutcomes.length;
        const accurateDuration = dayOutcomes.filter(o => Math.abs(o.deviation_minutes) < 30).length;
        const accurateConflicts = dayOutcomes.filter(o => o.predicted_conflicts === o.actual_conflicts).length;
        const punctual = dayOutcomes.filter(o => o.punctuality_achieved).length;
        
        performanceMetrics.push({
          metric_date: date.toISOString().split('T')[0],
          metric_type: 'daily_aggregation',
          ml_model_version: '2.0.0',
          total_predictions: totalPredictions,
          accurate_predictions: accurateDuration,
          accuracy_percentage: ((accurateDuration / totalPredictions) * 100).toFixed(2),
          punctuality_rate: ((punctual / totalPredictions) * 100).toFixed(2),
          weather_prediction_accuracy: ((accurateDuration / totalPredictions) * 100).toFixed(2),
          demand_prediction_accuracy: (85 + Math.random() * 10).toFixed(2),
          average_deviation_minutes: (dayOutcomes.reduce((sum, o) => sum + o.deviation_minutes, 0) / totalPredictions).toFixed(2),
          total_conflicts_predicted: dayOutcomes.reduce((sum, o) => sum + o.predicted_conflicts, 0),
          total_conflicts_actual: dayOutcomes.reduce((sum, o) => sum + o.actual_conflicts, 0),
          detailed_metrics: {
            duration_accuracy: accurateDuration,
            conflict_accuracy: accurateConflicts,
            average_success_score: (dayOutcomes.reduce((sum, o) => sum + parseFloat(o.success_score), 0) / totalPredictions).toFixed(4)
          }
        });
      }
    }

    const { error: metricsError } = await supabase
      .from('performance_metrics')
      .insert(performanceMetrics);
    
    if (metricsError) console.error('Metrics insert error:', metricsError);
    else results.performanceMetrics = performanceMetrics.length;

    // 6. Depot Congestion - 4 readings per day per section
    const depotSections = ['Main Yard', 'Maintenance Bay', 'Cleaning Zone', 'Storage Area'];
    const depotCongestion = [];
    
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      for (const section of depotSections) {
        for (let hour = 6; hour < 24; hour += 6) {
          const timestamp = new Date(date);
          timestamp.setHours(hour, 0, 0, 0);
          
          const isPeakHour = hour >= 6 && hour <= 9 || hour >= 17 && hour <= 20;
          const congestionScore = isPeakHour 
            ? Math.floor(Math.random() * 30) + 60 
            : Math.floor(Math.random() * 40) + 20;
          
          depotCongestion.push({
            timestamp: timestamp.toISOString(),
            depot_section: section,
            congestion_score: congestionScore,
            available_tracks: Math.floor(Math.random() * 5) + (congestionScore > 70 ? 0 : 3),
            active_shunting_moves: Math.floor(congestionScore / 10),
            estimated_delay_minutes: congestionScore > 70 ? Math.floor(Math.random() * 20) + 10 : Math.floor(Math.random() * 5),
            traffic_flow: congestionScore > 70 ? 'heavy' : congestionScore > 40 ? 'moderate' : 'light',
            sensor_data: {
              occupancy_percentage: congestionScore,
              movement_rate: Math.floor(Math.random() * 10) + 5
            }
          });
        }
      }
    }

    const { error: congestionError } = await supabase
      .from('depot_congestion')
      .insert(depotCongestion);
    
    if (congestionError) console.error('Congestion insert error:', congestionError);
    else results.depotCongestion = depotCongestion.length;

    // 7. Mileage Records - Daily for each trainset
    const mileageRecords = [];
    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      for (const trainset of trainsets) {
        const dailyMileage = 150 + Math.random() * 100; // 150-250 km per day
        
        mileageRecords.push({
          trainset_id: trainset.id,
          date: date.toISOString().split('T')[0],
          daily_mileage: dailyMileage.toFixed(2),
          route_details: {
            routes: ['Aluva-Petta', 'Petta-Thykoodam'],
            trips: Math.floor(Math.random() * 5) + 8
          }
        });
      }
    }

    const { error: mileageError } = await supabase
      .from('mileage_records')
      .insert(mileageRecords);
    
    if (mileageError) console.error('Mileage insert error:', mileageError);
    else results.mileageRecords = mileageRecords.length;

    console.log('Data generation complete:', results);

    return new Response(
      JSON.stringify({
        success: true,
        message: `Generated ${days}-day comprehensive dataset for ML training`,
        results,
        totalRecords: Object.values(results).reduce((a, b) => a + b, 0)
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in enhanced-data-seeder:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

function calculateSeverityScore(rainfall: number, windSpeed: number, visibility: number): number {
  let score = 0;
  
  if (rainfall > 20) score += 30;
  else if (rainfall > 10) score += 15;
  else if (rainfall > 5) score += 5;
  
  if (windSpeed > 30) score += 30;
  else if (windSpeed > 20) score += 15;
  else if (windSpeed > 10) score += 5;
  
  if (visibility < 1000) score += 30;
  else if (visibility < 3000) score += 15;
  else if (visibility < 5000) score += 5;
  
  return Math.min(100, score);
}

function getWeatherCondition(rainfall: number, windSpeed: number): string {
  if (rainfall > 30 && windSpeed > 30) return 'Severe Storm';
  if (rainfall > 20) return 'Heavy Rain';
  if (rainfall > 10) return 'Moderate Rain';
  if (rainfall > 2) return 'Light Rain';
  if (windSpeed > 25) return 'Windy';
  if (windSpeed > 15) return 'Breezy';
  return 'Clear';
}
