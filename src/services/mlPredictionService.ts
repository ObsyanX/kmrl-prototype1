import { supabase } from '@/integrations/supabase/client';

export interface MLPredictionRequest {
  trainsetId: string;
  predictionType?: 'reliability' | 'health' | 'performance';
}

export interface MLPredictionResult {
  trainset_id: string;
  prediction_type: string;
  reliability_score: number;
  risk_level: 'low' | 'medium' | 'high';
  recommended_action: string;
  confidence: number;
  key_factors: string[];
  reasoning: string;
  input_data: {
    total_mileage: number;
    health_score: number;
    days_since_service: number;
    open_job_cards: number;
    critical_jobs: number;
  };
  timestamp: string;
}

export interface TrainExplanation {
  trainset_id: string;
  service_ready: boolean;
  composite_score: number;
  constraints: {
    fitness: { passed: boolean; reasons: string[] };
    maintenance: { passed: boolean; reasons: string[] };
    health: { passed: boolean; reasons: string[] };
    branding: { passed: boolean; reasons: string[] };
  };
  scores: {
    mileage: number;
    health: number;
    maintenance: number;
    fitness: number;
    branding: number;
  };
  weights: {
    mileage: number;
    health: number;
    maintenance: number;
    fitness: number;
    branding: number;
  };
  operational_data: {
    total_mileage: number;
    fleet_avg_mileage: number;
    mileage_ratio: number;
    avg_daily_mileage: number;
    component_health_score: number;
    battery_level: number;
    operational_hours: number;
    days_since_service: number | null;
    active_iot_alerts: number;
    open_job_cards: number;
    critical_job_cards: number;
    valid_certificates: number;
    total_certificates: number;
    current_location: string;
    stabling_position: string;
  };
  recommendation: string;
  timestamp: string;
}

export interface FleetKPIs {
  fleet_size: number;
  readiness: {
    service_ready: number;
    partially_ready: number;
    not_ready: number;
    readiness_rate_percent: number;
  };
  mileage: {
    average: number;
    max: number;
    min: number;
    std_deviation: number;
    imbalance_score: number;
  };
  health: {
    average_score: number;
    distribution: {
      excellent: number;
      good: number;
      fair: number;
      poor: number;
    };
  };
  certificates: {
    valid: number;
    expiringSoon: number;
    expired: number;
  };
  maintenance: {
    critical: number;
    high: number;
    medium: number;
    low: number;
    total: number;
  };
  branding: {
    active_contracts: number;
    shortfalls: { contract: string; shortfall: number }[];
    compliance_rate: number;
  };
  stabling: {
    total_positions: number;
    occupied: number;
    available: number;
    utilization_percent: number;
  };
  optimization_performance: {
    recent_runs: number;
    avg_execution_time_ms: number;
    avg_confidence_score: number;
  };
  timestamp: string;
}

export const mlPredictionService = {
  /**
   * Get ML-based reliability prediction for a trainset
   */
  async getPrediction(request: MLPredictionRequest): Promise<MLPredictionResult> {
    const { data, error } = await supabase.functions.invoke('ml-predictor', {
      body: request
    });

    if (error) {
      console.error('ML prediction error:', error);
      throw error;
    }

    return data as MLPredictionResult;
  },

  /**
   * Get detailed explanation for a trainset's status and scoring
   */
  async getTrainExplanation(trainsetId: string): Promise<TrainExplanation> {
    const { data, error } = await supabase.functions.invoke('train-explainer', {
      body: { trainsetId }
    });

    if (error) {
      console.error('Train explanation error:', error);
      throw error;
    }

    return data as TrainExplanation;
  },

  /**
   * Get fleet-wide analytics and KPIs
   */
  async getFleetAnalytics(): Promise<FleetKPIs> {
    const { data, error } = await supabase.functions.invoke('fleet-analytics', {
      body: {}
    });

    if (error) {
      console.error('Fleet analytics error:', error);
      throw error;
    }

    return data as FleetKPIs;
  }
};
