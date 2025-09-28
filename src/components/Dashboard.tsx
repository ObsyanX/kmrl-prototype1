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
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

const Dashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const kpiData = [
    {
      title: "Fleet Availability",
      value: "94.2%",
      change: "+2.1%",
      trend: "up",
      icon: Train,
      color: "success"
    },
    {
      title: "AI Prediction Accuracy",
      value: "97.8%",
      change: "+0.8%", 
      trend: "up",
      icon: Brain,
      color: "primary"
    },
    {
      title: "Schedule Efficiency",
      value: "91.5%",
      change: "-1.2%",
      trend: "down", 
      icon: Clock,
      color: "warning"
    },
    {
      title: "Staff Utilization",
      value: "88.3%",
      change: "+3.4%",
      trend: "up",
      icon: Users,
      color: "success"
    }
  ];

  const alertsData = [
    {
      type: "critical",
      message: "Train KMX-203 requires immediate maintenance check",
      time: "2 min ago",
      icon: AlertTriangle
    },
    {
      type: "warning", 
      message: "Fitness certificate for KMX-105 expires in 3 days",
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

  const fleetStatusData = [
    { id: "KMX-101", status: "operational", location: "Aluva Station", batteryLevel: 87, nextMaintenance: "2 days" },
    { id: "KMX-102", status: "maintenance", location: "Depot", batteryLevel: 0, nextMaintenance: "In progress" },
    { id: "KMX-103", status: "operational", location: "Kalamassery", batteryLevel: 92, nextMaintenance: "5 days" },
    { id: "KMX-104", status: "warning", location: "Edapally", batteryLevel: 34, nextMaintenance: "Today" },
    { id: "KMX-105", status: "operational", location: "MG Road", batteryLevel: 78, nextMaintenance: "3 days" }
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

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => (
          <Card key={index} className="glass-card border-primary/20 hologram-glow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {kpi.title}
              </CardTitle>
              <kpi.icon className="w-4 h-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-glow mb-1">{kpi.value}</div>
              <div className="flex items-center gap-2">
                <Badge 
                  variant={kpi.trend === 'up' ? 'default' : 'secondary'} 
                  className={`text-xs ${kpi.trend === 'up' ? 'text-success' : 'text-warning'}`}
                >
                  <TrendingUp className="w-3 h-3 mr-1" />
                  {kpi.change}
                </Badge>
                <span className="text-xs text-muted-foreground">vs last hour</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Fleet Status Overview */}
        <div className="lg:col-span-2">
          <Card className="glass-card border-primary/20 h-full">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-glow">Real-time Fleet Status</CardTitle>
                  <CardDescription>Live monitoring of all KMRL trains</CardDescription>
                </div>
                <Badge variant="outline" className="text-primary border-primary">
                  5 Active Trains
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {fleetStatusData.map((train) => (
                  <div key={train.id} className="glass-card p-4 rounded-lg border border-primary/10">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Train className="w-5 h-5 text-primary" />
                        <div>
                          <h4 className="font-semibold text-foreground">{train.id}</h4>
                          <p className="text-sm text-muted-foreground">{train.location}</p>
                        </div>
                      </div>
                      <Badge variant={getStatusColor(train.status) as any}>
                        {train.status}
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-muted-foreground">Battery Level</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={train.batteryLevel} className="flex-1" />
                          <span className="text-sm font-medium">{train.batteryLevel}%</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground">Next Maintenance</label>
                        <p className="text-sm font-medium mt-1">{train.nextMaintenance}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 pt-4 border-t border-primary/10">
                <Button variant="outline" className="w-full">
                  <Train className="w-4 h-4 mr-2" />
                  View Detailed Fleet Status
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Alerts & Notifications */}
        <div>
          <Card className="glass-card border-primary/20 h-full">
            <CardHeader>
              <CardTitle className="text-glow flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-warning" />
                System Alerts
              </CardTitle>
              <CardDescription>Critical notifications and warnings</CardDescription>
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
        </div>
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