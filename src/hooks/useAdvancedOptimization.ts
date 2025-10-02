import { useState } from 'react';
import { advancedOptimizationService } from '@/services/advancedOptimizationService';
import { toast } from 'sonner';

export const useAdvancedOptimization = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [weatherData, setWeatherData] = useState<any>(null);
  const [demandForecast, setDemandForecast] = useState<any[]>([]);
  const [congestionData, setCongestionData] = useState<any>(null);
  const [performanceMetrics, setPerformanceMetrics] = useState<any>(null);
  const [patterns, setPatterns] = useState<any>(null);

  const getWeather = async () => {
    try {
      setIsLoading(true);
      const data = await advancedOptimizationService.getWeatherData();
      setWeatherData(data);
      return data;
    } catch (error) {
      console.error('Weather fetch error:', error);
      toast.error('Failed to fetch weather data');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getDemandForecast = async (daysAhead = 7) => {
    try {
      setIsLoading(true);
      const data = await advancedOptimizationService.getDemandForecast(daysAhead);
      setDemandForecast(data);
      return data;
    } catch (error) {
      console.error('Demand forecast error:', error);
      toast.error('Failed to fetch demand forecast');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getCongestion = async () => {
    try {
      setIsLoading(true);
      const data = await advancedOptimizationService.getDepotCongestion();
      setCongestionData(data);
      return data;
    } catch (error) {
      console.error('Congestion fetch error:', error);
      toast.error('Failed to fetch congestion data');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const getPerformance = async () => {
    try {
      setIsLoading(true);
      const data = await advancedOptimizationService.getCurrentPerformance();
      setPerformanceMetrics(data);
      return data;
    } catch (error) {
      console.error('Performance fetch error:', error);
      toast.error('Failed to fetch performance metrics');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const analyzePatterns = async (lookbackDays = 30) => {
    try {
      setIsLoading(true);
      const data = await advancedOptimizationService.analyzePatterns(lookbackDays);
      setPatterns(data);
      toast.success('Pattern analysis complete');
      return data;
    } catch (error) {
      console.error('Pattern analysis error:', error);
      toast.error('Failed to analyze patterns');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const runEnhancedOptimization = async (request: {
    trainsetIds?: string[];
    timeHorizon?: number;
    includeWeather?: boolean;
    includeDemand?: boolean;
    includeCongestion?: boolean;
  }) => {
    try {
      setIsLoading(true);
      const data = await advancedOptimizationService.runEnhancedOptimization(request);
      toast.success('Enhanced optimization complete');
      return data;
    } catch (error) {
      console.error('Enhanced optimization error:', error);
      toast.error('Failed to run enhanced optimization');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const recordOutcome = async (outcome: any) => {
    try {
      const data = await advancedOptimizationService.recordOperationOutcome(outcome);
      toast.success('Operation outcome recorded');
      return data;
    } catch (error) {
      console.error('Outcome recording error:', error);
      toast.error('Failed to record outcome');
      throw error;
    }
  };

  return {
    isLoading,
    weatherData,
    demandForecast,
    congestionData,
    performanceMetrics,
    patterns,
    getWeather,
    getDemandForecast,
    getCongestion,
    getPerformance,
    analyzePatterns,
    runEnhancedOptimization,
    recordOutcome,
  };
};
