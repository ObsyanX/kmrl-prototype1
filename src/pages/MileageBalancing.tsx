import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { BarChart3, AlertTriangle, TrendingUp, Settings } from 'lucide-react';

const MileageBalancing: React.FC = () => {
  const [alertThreshold, setAlertThreshold] = useState([15]);
  
  const fleetData = [
    { id: 'T01', mileage: 45200, variance: 8.2, status: 'normal', components: { bogies: 42000, brakes: 38500, hvac: 44800 } },
    { id: 'T02', mileage: 52800, variance: 22.1, status: 'over', components: { bogies: 51200, brakes: 47300, hvac: 52100 } },
    { id: 'T03', mileage: 38900, variance: -18.5, status: 'under', components: { bogies: 37800, brakes: 35200, hvac: 38400 } },
    { id: 'T04', mileage: 47600, variance: 4.5, status: 'normal', components: { bogies: 46800, brakes: 44200, hvac: 47200 } },
    { id: 'T05', mileage: 41300, variance: -12.3, status: 'under', components: { bogies: 40500, brakes: 38900, hvac: 40800 } },
  ];
  
  const fleetAverage = 45160;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'over': return 'destructive';
      case 'under': return 'warning';
      default: return 'success';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'over': return 'Over Utilized';
      case 'under': return 'Under Utilized';
      default: return 'Balanced';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-glow">Fleet Mileage & Component Wear</h1>
          <p className="text-muted-foreground">Monitor and manage equalization of wear across the fleet</p>
        </div>
        <Button variant="outline" className="gap-2">
          <Settings className="w-4 h-4" />
          Configure Alerts
        </Button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fleet Average</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{fleetAverage.toLocaleString()} km</div>
            <p className="text-xs text-muted-foreground">Across all trainsets</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Over Utilized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {fleetData.filter(t => t.status === 'over').length}
            </div>
            <p className="text-xs text-muted-foreground">Trains above threshold</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Under Utilized</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">
              {fleetData.filter(t => t.status === 'under').length}
            </div>
            <p className="text-xs text-muted-foreground">Trains below threshold</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Alert Threshold</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{alertThreshold[0]}%</div>
            <p className="text-xs text-muted-foreground">Deviation from average</p>
          </CardContent>
        </Card>
      </div>

      {/* Alert Threshold Configuration */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Mileage Alert Configuration</CardTitle>
          <CardDescription>
            Set the percentage deviation from average mileage at which trains are flagged
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Alert Deviation from Fleet Average (%)</Label>
            <div className="px-3">
              <Slider
                value={alertThreshold}
                onValueChange={setAlertThreshold}
                max={25}
                min={5}
                step={1}
                className="w-full"
              />
            </div>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>5%</span>
              <span className="font-medium">{alertThreshold[0]}%</span>
              <span>25%</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Current setting: Trains with mileage ±{alertThreshold[0]}% from average ({fleetAverage.toLocaleString()} km) will be flagged
          </p>
        </CardContent>
      </Card>

      {/* 3D Mileage Visualization - Placeholder for actual 3D chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            Fleet Mileage Distribution
          </CardTitle>
          <CardDescription>Interactive 3D visualization of train utilization</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-64 bg-gradient-to-br from-primary/5 to-kmrl-green/5 rounded-lg border border-primary/20 flex items-center justify-center">
            <div className="text-center">
              <BarChart3 className="w-12 h-12 text-primary mx-auto mb-2" />
              <p className="text-sm text-muted-foreground">3D Interactive Chart</p>
              <p className="text-xs text-muted-foreground">Click and drag to rotate • Scroll to zoom</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Fleet Table */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Detailed Fleet Analysis</CardTitle>
          <CardDescription>Complete mileage breakdown by train and component</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {fleetData.map((train) => (
              <div key={train.id} className="glass-card p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h3 className="font-semibold text-lg">{train.id}</h3>
                    <Badge variant={getStatusColor(train.status)}>
                      {getStatusLabel(train.status)}
                    </Badge>
                    {Math.abs(train.variance) > alertThreshold[0] && (
                      <AlertTriangle className="w-4 h-4 text-warning" />
                    )}
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold">{train.mileage.toLocaleString()} km</div>
                    <div className={`text-sm ${train.variance > 0 ? 'text-destructive' : 'text-warning'}`}>
                      {train.variance > 0 ? '+' : ''}{train.variance.toFixed(1)}% from average
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Bogies</div>
                    <div className="font-medium">{train.components.bogies.toLocaleString()} km</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Brake Systems</div>
                    <div className="font-medium">{train.components.brakes.toLocaleString()} km</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">HVAC Units</div>
                    <div className="font-medium">{train.components.hvac.toLocaleString()} km</div>
                  </div>
                </div>
                
                {/* Progress bar showing mileage relative to fleet average */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Utilization vs Fleet Average</span>
                    <span>{((train.mileage / fleetAverage) * 100).toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full transition-all duration-500 ${
                        train.variance > alertThreshold[0] ? 'bg-destructive' :
                        train.variance < -alertThreshold[0] ? 'bg-warning' : 'bg-success'
                      }`}
                      style={{ width: `${Math.min(100, (train.mileage / fleetAverage) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MileageBalancing;