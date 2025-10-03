import React, { useState, useEffect } from 'react';
import { Database, Wifi, Activity, CheckCircle, AlertCircle, Cloud, Calendar } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdvancedOptimization } from '@/hooks/useAdvancedOptimization';
import { toast } from 'sonner';

const DataSources: React.FC = () => {
  const { getWeather, getDemandForecast, getCongestion, weatherData, demandForecast, congestionData } = useAdvancedOptimization();
  const [sources, setSources] = useState({
    openweather: { status: 'checking', latency: 0 },
    demand_forecaster: { status: 'checking', latency: 0 },
    depot_sensors: { status: 'checking', latency: 0 },
    maximo: { status: 'not_connected', latency: 0 },
  });

  useEffect(() => {
    checkDataSources();
  }, []);

  const checkDataSources = async () => {
    // Check OpenWeather API
    const weatherStart = Date.now();
    try {
      await getWeather();
      setSources(prev => ({
        ...prev,
        openweather: { status: 'connected', latency: Date.now() - weatherStart },
      }));
    } catch (error) {
      setSources(prev => ({
        ...prev,
        openweather: { status: 'error', latency: 0 },
      }));
    }

    // Check Demand Forecaster
    const demandStart = Date.now();
    try {
      await getDemandForecast();
      setSources(prev => ({
        ...prev,
        demand_forecaster: { status: 'connected', latency: Date.now() - demandStart },
      }));
    } catch (error) {
      setSources(prev => ({
        ...prev,
        demand_forecaster: { status: 'error', latency: 0 },
      }));
    }

    // Check Depot Sensors
    const congestionStart = Date.now();
    try {
      await getCongestion();
      setSources(prev => ({
        ...prev,
        depot_sensors: { status: 'connected', latency: Date.now() - congestionStart },
      }));
    } catch (error) {
      setSources(prev => ({
        ...prev,
        depot_sensors: { status: 'error', latency: 0 },
      }));
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'connected':
        return <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" /> Connected</Badge>;
      case 'error':
        return <Badge variant="destructive"><AlertCircle className="w-3 h-3 mr-1" /> Error</Badge>;
      case 'not_connected':
        return <Badge variant="secondary">Not Connected</Badge>;
      default:
        return <Badge variant="outline">Checking...</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-glow mb-2">Data Sources</h1>
        <p className="text-muted-foreground">Monitor and manage external data integrations</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-glow flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              OpenWeather API
            </CardTitle>
            <CardDescription>Real-time weather data for Kochi, India</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              {getStatusBadge(sources.openweather.status)}
            </div>
            {sources.openweather.latency > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Latency:</span>
                <span className="text-sm font-mono">{sources.openweather.latency}ms</span>
              </div>
            )}
            {weatherData && (
              <div className="pt-2 border-t border-border/50 space-y-1">
                <div className="text-xs text-muted-foreground">Latest Data:</div>
                <div className="text-sm">Temperature: {weatherData.temperature}°C</div>
                <div className="text-sm">Conditions: {weatherData.conditions}</div>
                <div className="text-sm">Severity Score: {weatherData.weather_severity_score}/10</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-glow flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              Demand Forecaster
            </CardTitle>
            <CardDescription>AI-powered ridership prediction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              {getStatusBadge(sources.demand_forecaster.status)}
            </div>
            {sources.demand_forecaster.latency > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Latency:</span>
                <span className="text-sm font-mono">{sources.demand_forecaster.latency}ms</span>
              </div>
            )}
            {demandForecast && demandForecast.length > 0 && (
              <div className="pt-2 border-t border-border/50 space-y-1">
                <div className="text-xs text-muted-foreground">Next Forecast:</div>
                <div className="text-sm">Date: {demandForecast[0].date}</div>
                <div className="text-sm">Demand Factor: {demandForecast[0].demand_factor}x</div>
                <div className="text-sm">Category: {demandForecast[0].demand_category}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-glow flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Depot Sensors (IoT)
            </CardTitle>
            <CardDescription>Real-time congestion monitoring</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              {getStatusBadge(sources.depot_sensors.status)}
            </div>
            {sources.depot_sensors.latency > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Latency:</span>
                <span className="text-sm font-mono">{sources.depot_sensors.latency}ms</span>
              </div>
            )}
            {congestionData && (
              <div className="pt-2 border-t border-border/50 space-y-1">
                <div className="text-xs text-muted-foreground">Current Status:</div>
                <div className="text-sm">Section: {congestionData.depot_section}</div>
                <div className="text-sm">Congestion: {congestionData.congestion_score}/10</div>
                <div className="text-sm">Traffic Flow: {congestionData.traffic_flow}</div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-glow flex items-center gap-2">
              <Database className="w-5 h-5" />
              IBM Maximo
            </CardTitle>
            <CardDescription>Job card & maintenance data (Manual entry)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status:</span>
              {getStatusBadge(sources.maximo.status)}
            </div>
            <div className="pt-2 border-t border-border/50">
              <p className="text-xs text-muted-foreground">
                API integration pending. Currently using manual data entry for job cards and maintenance schedules.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => toast.info('Maximo integration coming soon')}>
              Configure Integration
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow">Data Refresh</CardTitle>
        </CardHeader>
        <CardContent>
          <Button onClick={checkDataSources}>
            <Wifi className="w-4 h-4 mr-2" />
            Refresh All Sources
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSources;