import React, { useState, useEffect } from 'react';
import { Train, Battery, Calendar, MapPin, AlertTriangle, Clock, CheckCircle, Settings, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTrainsets } from '@/hooks/useTrainsets';
import { toast } from 'sonner';

const FleetStatus: React.FC = () => {
  const { trainsets, loading, fetchTrainsets } = useTrainsets();

  useEffect(() => {
    fetchTrainsets();
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'success';
      case 'maintenance': return 'secondary';
      case 'out_of_service': return 'warning';
      default: return 'secondary';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-success';
    if (level > 30) return 'text-warning';
    return 'text-destructive';
  };

  const operationalCount = trainsets.filter(t => t.status === 'operational').length;
  const maintenanceCount = trainsets.filter(t => t.status === 'maintenance').length;
  const warningCount = trainsets.filter(t => (t.battery_level || 0) < 40).length;

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-glow mb-2">Fleet Status Monitor</h1>
          <p className="text-muted-foreground">
            Real-time tracking and management of all KMRL trains
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="glass-card border-success text-success">
            {operationalCount} Trains Active
          </Badge>
          <Button variant="neural" onClick={() => fetchTrainsets()} disabled={loading}>
            <Settings className="w-4 h-4 mr-2" />
            Bulk Actions
          </Button>
        </div>
      </div>

      {/* Fleet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Operational", count: operationalCount, color: "success", icon: CheckCircle },
          { title: "In Maintenance", count: maintenanceCount, color: "secondary", icon: Settings },
          { title: "Warnings", count: warningCount, color: "warning", icon: AlertTriangle },
          { title: "Critical Issues", count: 0, color: "destructive", icon: AlertTriangle }
        ].map((stat, index) => (
          <Card key={index} className="glass-card border-primary/20 hologram-glow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-glow">{stat.count}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${
                  stat.color === 'success' ? 'text-success' :
                  stat.color === 'warning' ? 'text-warning' :
                  stat.color === 'destructive' ? 'text-destructive' : 'text-muted-foreground'
                }`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Fleet Details */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow">Fleet Details</CardTitle>
          <CardDescription>Comprehensive view of all trains and their current status</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading fleet data...</span>
            </div>
          ) : trainsets.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No trainsets found
            </div>
          ) : (
            <div className="space-y-4">
              {trainsets.map((train: any) => (
                <div key={train.id} className="glass-card p-6 rounded-lg border border-primary/10">
                  <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                    
                    {/* Train Identity */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-3 glass-card rounded-lg">
                          <Train className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-xl font-bold text-glow">{train.id}</h3>
                          <Badge variant={getStatusColor(train.status) as any}>
                            {train.status}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{train.current_location || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm text-foreground">{train.current_stabling_position || 'In Service'}</span>
                        </div>
                      </div>
                    </div>

                    {/* Operational Metrics */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Operational Status</h4>
                      <div className="space-y-3">
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm text-muted-foreground">Battery Level</span>
                            <span className={`text-sm font-medium ${getBatteryColor(train.battery_level || 0)}`}>
                              {train.battery_level || 0}%
                            </span>
                          </div>
                          <Progress value={train.battery_level || 0} className="h-2" />
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Mileage</span>
                          <span className="text-sm font-medium text-foreground">{train.total_mileage || 0} km</span>
                        </div>
                        
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Op. Hours</span>
                          <span className="text-sm font-medium text-foreground">{train.operational_hours || 0} hrs</span>
                        </div>
                      </div>
                    </div>

                    {/* Maintenance Info */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Maintenance</h4>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Last Service</span>
                          <span className="text-sm font-medium text-foreground">
                            {train.last_maintenance_date ? new Date(train.last_maintenance_date).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Next Service</span>
                          <span className="text-sm font-medium text-primary">
                            {train.next_maintenance_date ? new Date(train.next_maintenance_date).toLocaleDateString() : 'TBD'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Fitness Expiry</span>
                          <span className="text-sm font-medium text-warning">
                            {train.fitness_certificate_expiry ? new Date(train.fitness_certificate_expiry).toLocaleDateString() : 'N/A'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div>
                      <h4 className="font-semibold text-foreground mb-3">Actions</h4>
                      <div className="space-y-2">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                        <Button variant="cockpit" size="sm" className="w-full">
                          Schedule Maintenance
                        </Button>
                        <Button variant="ghost" size="sm" className="w-full">
                          Update Location
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default FleetStatus;
