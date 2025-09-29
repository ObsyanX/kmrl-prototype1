import React, { useState } from 'react';
import { Train, Battery, Calendar, MapPin, AlertTriangle, Clock, CheckCircle, Settings } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const FleetStatus: React.FC = () => {
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);

  const fleetData = [
    {
      id: "KRISHNA",
      status: "operational",
      location: "Aluva Station",
      batteryLevel: 87,
      lastMaintenance: "2024-01-15",
      nextMaintenance: "2024-01-17",
      totalDistance: "12,450 km",
      operationalHours: "2,890 hrs",
      fitnessExpiry: "2024-06-15",
      currentRoute: "Aluva - Palarivattom",
      speed: "45 km/h",
      passengerLoad: 78,
      issues: []
    },
    {
      id: "TAPI", 
      status: "maintenance",
      location: "Main Depot",
      batteryLevel: 0,
      lastMaintenance: "2024-01-16",
      nextMaintenance: "In Progress",
      totalDistance: "11,230 km",
      operationalHours: "2,650 hrs",
      fitnessExpiry: "2024-08-22",
      currentRoute: "Depot Bay 3",
      speed: "0 km/h", 
      passengerLoad: 0,
      issues: ["Brake system calibration", "Battery replacement"]
    },
    {
      id: "NILA",
      status: "operational", 
      location: "Kalamassery Station",
      batteryLevel: 92,
      lastMaintenance: "2024-01-12",
      nextMaintenance: "2024-01-21",
      totalDistance: "13,890 km",
      operationalHours: "3,120 hrs",
      fitnessExpiry: "2024-09-10",
      currentRoute: "Kalamassery - Edapally",
      speed: "38 km/h",
      passengerLoad: 45,
      issues: []
    },
    {
      id: "SARAYU",
      status: "warning",
      location: "Edapally Station", 
      batteryLevel: 34,
      lastMaintenance: "2024-01-10",
      nextMaintenance: "2024-01-16",
      totalDistance: "14,560 km",
      operationalHours: "3,380 hrs",
      fitnessExpiry: "2024-05-28",
      currentRoute: "Edapally - MG Road",
      speed: "42 km/h",
      passengerLoad: 92,
      issues: ["Low battery warning", "Fitness certificate expiring soon"]
    },
    {
      id: "ARUTH",
      status: "operational",
      location: "MG Road Station",
      batteryLevel: 78,
      lastMaintenance: "2024-01-14", 
      nextMaintenance: "2024-01-19",
      totalDistance: "10,890 km",
      operationalHours: "2,540 hrs",
      fitnessExpiry: "2024-11-12",
      currentRoute: "MG Road - Maharaja College",
      speed: "35 km/h",
      passengerLoad: 67,
      issues: []
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'success';
      case 'maintenance': return 'secondary';
      case 'warning': return 'warning';
      case 'critical': return 'destructive';
      default: return 'secondary';
    }
  };

  const getBatteryColor = (level: number) => {
    if (level > 60) return 'text-success';
    if (level > 30) return 'text-warning';
    return 'text-destructive';
  };

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
            5 Trains Active
          </Badge>
          <Button variant="neural">
            <Settings className="w-4 h-4 mr-2" />
            Bulk Actions
          </Button>
        </div>
      </div>

      {/* Fleet Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Operational", count: 3, color: "success", icon: CheckCircle },
          { title: "In Maintenance", count: 1, color: "secondary", icon: Settings },
          { title: "Warnings", count: 1, color: "warning", icon: AlertTriangle },
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
          <div className="space-y-4">
            {fleetData.map((train) => (
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
                        <span className="text-sm text-foreground">{train.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{train.currentRoute}</span>
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
                          <span className={`text-sm font-medium ${getBatteryColor(train.batteryLevel)}`}>
                            {train.batteryLevel}%
                          </span>
                        </div>
                        <Progress value={train.batteryLevel} className="h-2" />
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Speed</span>
                        <span className="text-sm font-medium text-foreground">{train.speed}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Passenger Load</span>
                        <span className="text-sm font-medium text-foreground">{train.passengerLoad}%</span>
                      </div>
                    </div>
                  </div>

                  {/* Maintenance Info */}
                  <div>
                    <h4 className="font-semibold text-foreground mb-3">Maintenance</h4>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Last Service</span>
                        <span className="text-sm font-medium text-foreground">{train.lastMaintenance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Next Service</span>
                        <span className="text-sm font-medium text-primary">{train.nextMaintenance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Total Distance</span>
                        <span className="text-sm font-medium text-foreground">{train.totalDistance}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-muted-foreground">Fitness Expiry</span>
                        <span className="text-sm font-medium text-warning">{train.fitnessExpiry}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions & Issues */}
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
                    
                    {train.issues.length > 0 && (
                      <div className="mt-4">
                        <h5 className="text-sm font-medium text-warning mb-2">Active Issues</h5>
                        <div className="space-y-1">
                          {train.issues.map((issue, index) => (
                            <div key={index} className="flex items-center gap-2">
                              <AlertTriangle className="w-3 h-3 text-warning" />
                              <span className="text-xs text-warning">{issue}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-glow">Fleet Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Battery Level</span>
                <span className="text-lg font-bold text-success">78.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Fleet Availability</span>
                <span className="text-lg font-bold text-primary">80%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">On-Time Performance</span>
                <span className="text-lg font-bold text-success">94.8%</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-glow">Maintenance Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Overdue Maintenance</span>
                <span className="text-lg font-bold text-destructive">0</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Due This Week</span>
                <span className="text-lg font-bold text-warning">2</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Completed Today</span>
                <span className="text-lg font-bold text-success">1</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-glow">System Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Communication Status</span>
                <Badge variant="success">Online</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">GPS Tracking</span>
                <Badge variant="success">Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Emergency Systems</span>
                <Badge variant="success">Ready</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FleetStatus;
