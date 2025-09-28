import React from 'react';
import { Train, Battery, Clock, MapPin, AlertTriangle, Zap, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface Train {
  id: string;
  status: 'operational' | 'maintenance' | 'warning' | 'critical' | 'charging';
  location: string;
  batteryLevel: number;
  nextMaintenance: string;
  passengerLoad: number;
  speed: number;
  lastUpdate: string;
  route: string;
  fitnessExpiry: string;
  anomalies?: string[];
}

interface FleetGridProps {
  trains: Train[];
  onTrainSelect?: (trainId: string) => void;
}

const FleetGrid: React.FC<FleetGridProps> = ({ trains, onTrainSelect }) => {
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'operational':
        return { color: 'success', icon: Train, label: 'Operational' };
      case 'maintenance':
        return { color: 'secondary', icon: Shield, label: 'Maintenance' };
      case 'warning':
        return { color: 'warning', icon: AlertTriangle, label: 'Warning' };
      case 'critical':
        return { color: 'destructive', icon: AlertTriangle, label: 'Critical' };
      case 'charging':
        return { color: 'primary', icon: Zap, label: 'Charging' };
      default:
        return { color: 'secondary', icon: Train, label: 'Unknown' };
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 70) return 'text-success';
    if (level > 30) return 'text-warning';
    return 'text-destructive';
  };

  const getPassengerLoadColor = (load: number) => {
    if (load > 80) return 'text-destructive';
    if (load > 60) return 'text-warning';
    return 'text-success';
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {trains.map((train) => {
        const statusConfig = getStatusConfig(train.status);
        const StatusIcon = statusConfig.icon;

        return (
          <Card 
            key={train.id} 
            className="glass-card border-primary/20 hover:border-primary/40 transition-all duration-300 cursor-pointer group"
            onClick={() => onTrainSelect?.(train.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-bold text-glow">{train.id}</CardTitle>
                <Badge variant={statusConfig.color as any} className="flex items-center gap-1">
                  <StatusIcon className="w-3 h-3" />
                  {statusConfig.label}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{train.location}</span>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Battery Level */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium flex items-center gap-1">
                    <Battery className="w-4 h-4" />
                    Battery
                  </span>
                  <span className={`text-sm font-bold ${getBatteryColor(train.batteryLevel)}`}>
                    {train.batteryLevel}%
                  </span>
                </div>
                <Progress value={train.batteryLevel} className="h-2" />
              </div>

              {/* Performance Metrics */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-muted-foreground">Speed</label>
                  <p className="text-lg font-bold text-primary">{train.speed} km/h</p>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Load</label>
                  <p className={`text-lg font-bold ${getPassengerLoadColor(train.passengerLoad)}`}>
                    {train.passengerLoad}%
                  </p>
                </div>
              </div>

              {/* Route Info */}
              <div>
                <label className="text-xs text-muted-foreground">Route</label>
                <p className="text-sm font-medium text-foreground">{train.route}</p>
              </div>

              {/* Next Maintenance */}
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <div>
                  <label className="text-xs text-muted-foreground">Next Maintenance</label>
                  <p className="text-sm font-medium">{train.nextMaintenance}</p>
                </div>
              </div>

              {/* Anomalies */}
              {train.anomalies && train.anomalies.length > 0 && (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground">Active Alerts</label>
                  <div className="space-y-1">
                    {train.anomalies.slice(0, 2).map((anomaly, index) => (
                      <Badge key={index} variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        {anomaly}
                      </Badge>
                    ))}
                    {train.anomalies.length > 2 && (
                      <Badge variant="outline" className="text-xs">
                        +{train.anomalies.length - 2} more
                      </Badge>
                    )}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 border-t border-primary/10">
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    Details
                  </Button>
                  <Button variant="hologram" size="sm" className="flex-1">
                    Control
                  </Button>
                </div>
              </div>

              {/* Last Update */}
              <div className="text-xs text-muted-foreground text-center">
                Last updated: {train.lastUpdate}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};

export default FleetGrid;