import { useState } from 'react';
import { mlPredictionService, MLPredictionRequest, MLPredictionResult, TrainExplanation, FleetKPIs } from '@/services/mlPredictionService';
import { toast } from 'sonner';

export const useMLPrediction = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [prediction, setPrediction] = useState<MLPredictionResult | null>(null);
  const [explanation, setExplanation] = useState<TrainExplanation | null>(null);
  const [fleetKPIs, setFleetKPIs] = useState<FleetKPIs | null>(null);

  const getPrediction = async (request: MLPredictionRequest) => {
    try {
      setIsLoading(true);
      const data = await mlPredictionService.getPrediction(request);
      setPrediction(data);
      toast.success('ML prediction generated successfully');
      return data;
    } catch (error) {
      console.error('Prediction error:', error);
      toast.error('Failed to generate prediction');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getExplanation = async (trainsetId: string) => {
    try {
      setIsLoading(true);
      const data = await mlPredictionService.getTrainExplanation(trainsetId);
      setExplanation(data);
      toast.success('Train explanation generated');
      return data;
    } catch (error) {
      console.error('Explanation error:', error);
      toast.error('Failed to generate explanation');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getFleetAnalytics = async () => {
    try {
      setIsLoading(true);
      const data = await mlPredictionService.getFleetAnalytics();
      setFleetKPIs(data);
      toast.success('Fleet analytics loaded');
      return data;
    } catch (error) {
      console.error('Fleet analytics error:', error);
      toast.error('Failed to load fleet analytics');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isLoading,
    prediction,
    explanation,
    fleetKPIs,
    getPrediction,
    getExplanation,
    getFleetAnalytics
  };
};
