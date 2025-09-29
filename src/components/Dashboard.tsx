import React, { useState, useEffect } from 'react';
import { 
  Brain, 
  Train, 
  Clock, 
  AlertTriangle, 
  CheckCircle, 
  TrendingUp, 
  Users, 
  Zap,
  Activity,
  Calendar,
  Shield,
  Settings,
  MapPin,
  Battery
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import FleetGrid from '@/components/fleet/FleetGrid';
import MetricsGrid from '@/components/analytics/MetricsGrid';
import LiveStatusBoard from '@/components/realtime/LiveStatusBoard';

const Dashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const metricsData = [
    {
      id: 'fleet-availability',
      title: "Fleet Availability",
      value: 94.2,
      unit: "%",
      change: 2.1,
      changeLabel: "vs last hour",
      trend: "up" as const,
      icon: Train,
      category: "operations" as const,
      isPositiveTrend: true
    },
    {
      id: 'ai-accuracy',
      title: "AI Prediction Accuracy", 
      value: 97.8,
      unit: "%",
      change: 0.8,
      changeLabel: "vs last hour",
      trend: "up" as const,
      icon: Brain,
      category: "performance" as const,
      isPositiveTrend: true
    },
    {
      id: 'schedule-efficiency',
      title: "Schedule Efficiency",
      value: 91.5,
      unit: "%", 
      change: -1.2,
      changeLabel: "vs last hour",
      trend: "down" as const,
      icon: Clock,
      category: "efficiency" as const,
      isPositiveTrend: true
    },
    {
      id: 'staff-utilization',
      title: "Staff Utilization",
      value: 88.3,
      unit: "%",
      change: 3.4,
      changeLabel: "vs last hour", 
      trend: "up" as const,
      icon: Users,
      category: "operations" as const,
      isPositiveTrend: true
    },
    {
      id: 'energy-efficiency',
      title: "Energy Efficiency",
      value: 89.7,
      unit: "%",
      change: 1.8,
      changeLabel: "vs last hour",
      trend: "up" as const,
      icon: Battery,
      category: "efficiency" as const,
      isPositiveTrend: true
    },
    {
      id: 'incident-rate',
      title: "Incident Rate",
      value: 0.03,
      unit: "/hour",
      change: -15.2,
      changeLabel: "vs last week",
      trend: "down" as const,
      icon: AlertTriangle,
      category: "safety" as const,
      isPositiveTrend: false
    }
  ];

  const alertsData = [
    {
      type: "critical",
      message: "Train YAMUNA requires immediate maintenance check",
      time: "2 min ago",
      icon: AlertTriangle
    },
    {
      type: "warning", 
      message: "Fitness certificate for ARUTH expires in 3 days",
      time: "15 min ago",
      icon: Clock
    },
    {
      type: "info",
      message: "Night shift supervisor logged in successfully",
      time: "1 hour ago", 
      icon: CheckCircle
    }
  ];

  const fleetData = [
    { 
      id: "KMX-101", 
      status: "operational" as const, 
      location: "Aluva Station", 
      batteryLevel: 87, 
      nextMaintenance: "2 days",
      passengerLoad: 45,
      speed: 65,
      lastUpdate: "12:34:56",
      route: "Aluva - Kacheripady",
      fitnessExpiry: "2024-12-15"
    },
    { 
      id: "TAPTI", 
      status: "maintenance" as const, 
      location: "Depot", 
      batteryLevel: 0, 
      nextMaintenance: "In progress",
      passengerLoad: 0,
      speed: 0,
      lastUpdate: "11:22:34",
      route: "Maintenance Bay",
      fitnessExpiry: "2024-11-20",
      anomalies: ["Brake system check", "Battery replacement"]
    },
    { 
      id: "NILA", 
      status: "operational" as const, 
      location: "Kalamassery", 
      batteryLevel: 92, 
      nextMaintenance: "5 days",
      passengerLoad: 78,
      speed: 55,
      lastUpdate: "12:35:12",
      route: "Kalamassery - Edapally",
      fitnessExpiry: "2024-12-30"
    },
    { 
      id: "SARAYU", 
      status: "warning" as const, 
      location: "Edapally", 
      batteryLevel: 34, 
      nextMaintenance: "Today",
      passengerLoad: 23,
      speed: 40,
      lastUpdate: "12:33:45",
      route: "Edapally - MG Road",
      fitnessExpiry: "2024-10-15",
      anomalies: ["Low battery warning", "Fitness certificate expires soon"]
    },
    { 
      id: "ARUTH",
      status: "operational" as const, 
      location: "MG Road", 
      batteryLevel: 78, 
      nextMaintenance: "3 days",
      passengerLoad: 89,
      speed: 50,
      lastUpdate: "12:35:23",
      route: "MG Road - Kacheripady",
      fitnessExpiry: "2024-11-10"
    },
    {
      id: "VAIGAI",
      status: "charging" as const,
      location: "Muttom Depot",
      batteryLevel: 23,
      nextMaintenance: "7 days",
      passengerLoad: 0,
      speed: 0,
      lastUpdate: "12:30:15",
      route: "Charging Station",
      fitnessExpiry: "2024-12-05"
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

  const getAlertColor = (type: string) => {
    switch (type) {
      case 'critical': return 'destructive';
      case 'warning': return 'warning';
      case 'info': return 'secondary';
      default: return 'secondary';
    }
  };

  const handleTrainSelect = (trainId: string) => {
    console.log('Selected train:', trainId);
    // Navigate to detailed train view
  };

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-glow mb-2">Digital Control Tower</h1>
          <p className="text-muted-foreground">
            Real-time operations dashboard • {currentTime.toLocaleString()}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="glass-card border-success text-success">
            <Activity className="w-3 h-3 mr-1" />
            All Systems Operational
          </Badge>
          <Button variant="neural">
            <Brain className="w-4 h-4 mr-2" />
            View AI Insights
          </Button>
        </div>
      </div>

      {/* Enhanced Metrics Grid */}
      <MetricsGrid metrics={metricsData} />

      {/* Live Status Board */}
      <LiveStatusBoard />

      {/* Fleet Management Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-bold text-glow">Fleet Overview</h2>
          <Badge variant="outline" className="text-primary border-primary">
            {fleetData.length} Active Trains
          </Badge>
        </div>
        <FleetGrid trains={fleetData} onTrainSelect={handleTrainSelect} />
      </div>

      {/* Alerts & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-glow flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-warning" />
              Active Alerts
            </CardTitle>
            <CardDescription>Critical notifications requiring attention</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {alertsData.map((alert, index) => (
                <div key={index} className="glass-card p-3 rounded-lg border border-primary/10">
                  <div className="flex items-start gap-3">
                    <alert.icon className={`w-4 h-4 mt-0.5 ${
                      alert.type === 'critical' ? 'text-destructive' :
                      alert.type === 'warning' ? 'text-warning' : 'text-success'
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-foreground mb-1">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">{alert.time}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-4 pt-4 border-t border-primary/10">
              <Button variant="outline" size="sm" className="w-full">
                View All Alerts
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-glow">AI Recommendations</CardTitle>
            <CardDescription>Smart insights from the KMRL AI system</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="glass-card p-4 rounded-lg border border-primary/10">
                <div className="flex items-start gap-3">
                  <Brain className="w-5 h-5 text-primary mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Optimize Schedule</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Reduce peak hour wait times by 12% with schedule adjustment
                    </p>
                    <Button variant="neural" size="sm">Implement</Button>
                  </div>
                </div>
              </div>
              
              <div className="glass-card p-4 rounded-lg border border-primary/10">
                <div className="flex items-start gap-3">
                  <Zap className="w-5 h-5 text-success mt-0.5" />
                  <div>
                    <h4 className="font-medium text-foreground mb-1">Energy Savings</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      Potential 8% energy reduction through route optimization
                    </p>
                    <Button variant="hologram" size="sm">Review Plan</Button>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow">Quick Actions</CardTitle>
          <CardDescription>Frequently used operations and tools</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {[
              { name: "Generate Induction Plan", icon: Calendar, path: "/induction-plan", variant: "neural" },
              { name: "Run Simulation", icon: Brain, path: "/simulator", variant: "hologram" },
              { name: "Fleet Management", icon: Train, path: "/fleet-status", variant: "cockpit" },
              { name: "Staff Schedule", icon: Users, path: "/staff-availability", variant: "outline" },
              { name: "System Settings", icon: Settings, path: "/algorithm-rules", variant: "outline" },
              { name: "View Audit Trail", icon: Shield, path: "/audit-trail", variant: "outline" }
            ].map((action, index) => (
              <Button
                key={index}
                variant={action.variant as any}
                className="h-20 flex flex-col gap-2 text-xs"
                onClick={() => window.location.href = action.path}
              >
                <action.icon className="w-5 h-5" />
                {action.name}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
