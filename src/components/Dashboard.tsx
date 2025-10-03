import { useEffect, useState } from 'react';
import { useTrainsets } from '@/hooks/useTrainsets';
import { useOptimization } from '@/hooks/useOptimization';
import { 
  Brain, 
  Train, 
  AlertTriangle, 
  CheckCircle, 
  Users, 
  Zap,
  Activity,
  Shield,
  MapPin,
  Sparkles,
  FileText,
  BarChart3,
  Wrench,
  CalendarDays,
  Database,
  ClipboardList,
  MessageSquare,
  TrendingUp,
  Code,
  Settings,
  HelpCircle,
  Warehouse,
  Sparkle,
  Target,
  TestTube,
  Scale
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import FleetGrid from '@/components/fleet/FleetGrid';
import MetricsGrid from '@/components/analytics/MetricsGrid';
import LiveStatusBoard from '@/components/realtime/LiveStatusBoard';
import MaintenanceScheduler from '@/components/maintenance/MaintenanceScheduler';
import StaffScheduler from '@/components/staff/StaffScheduler';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const { trainsets, loading, fetchTrainsets } = useTrainsets();
  const { runOptimization, isOptimizing, optimizationResult, getAIRecommendation } = useOptimization();
  const [aiInsights, setAiInsights] = useState<any>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    fetchTrainsets();
    return () => clearInterval(timer);
  }, []);

  const handleRunOptimization = async () => {
    try {
      await runOptimization({
        weights: {
          fitness: 0.30,
          maintenance: 0.25,
          branding: 0.15,
          mileage: 0.15,
          staff: 0.10,
          stabling: 0.05,
        }
      });
    } catch (error) {
      console.error('Optimization failed:', error);
    }
  };

  const handleGetAIInsights = async () => {
    try {
      const insights = await getAIRecommendation(
        undefined,
        'resource_allocation',
        { 
          fleet_status: trainsets,
          current_time: new Date().toISOString() 
        }
      );
      setAiInsights(insights);
    } catch (error) {
      console.error('AI insights failed:', error);
    }
  };

  // Calculate fleet metrics
  const operationalCount = trainsets.filter(t => t.status === 'operational').length;
  const maintenanceCount = trainsets.filter(t => t.status === 'maintenance').length;
  const fleetAvailability = trainsets.length > 0 ? (operationalCount / trainsets.length) * 100 : 0;
  const criticalIssues = optimizationResult?.summary.critical_issues || 0;
  const conflictsDetected = optimizationResult?.summary.conflicts_detected || 0;

  const metricsData = [
    {
      id: 'fleet-availability',
      title: "Fleet Availability",
      value: fleetAvailability.toFixed(1),
      unit: "%",
      change: 2.1,
      changeLabel: "vs last hour",
      trend: "up" as const,
      icon: Train,
      category: "operations" as const,
      isPositiveTrend: true
    },
    {
      id: 'operational-trains',
      title: "Operational Trains", 
      value: operationalCount,
      unit: `/${trainsets.length}`,
      change: 0,
      changeLabel: "total fleet",
      trend: "stable" as const,
      icon: CheckCircle,
      category: "performance" as const,
      isPositiveTrend: true
    },
    {
      id: 'maintenance-queue',
      title: "In Maintenance",
      value: maintenanceCount,
      unit: "trains", 
      change: -1,
      changeLabel: "vs yesterday",
      trend: "down" as const,
      icon: Shield,
      category: "operations" as const,
      isPositiveTrend: false
    },
    {
      id: 'critical-issues',
      title: "Critical Issues",
      value: criticalIssues,
      unit: "",
      change: criticalIssues > 0 ? -15 : 0,
      changeLabel: "requires attention", 
      trend: criticalIssues > 0 ? "up" as const : "stable" as const,
      icon: AlertTriangle,
      category: "safety" as const,
      isPositiveTrend: false
    }
  ];

  // Transform trainsets for FleetGrid
  const transformedTrainsets = trainsets.map(t => ({
    id: t.id || t.name,
    status: (t.status === 'operational' ? 'operational' :
             t.status === 'maintenance' ? 'maintenance' :
             t.status === 'cleaning' ? 'charging' : 'warning') as 'operational' | 'maintenance' | 'warning' | 'critical' | 'charging',
    location: t.current_location || 'Unknown',
    batteryLevel: t.battery_level || 0,
    nextMaintenance: t.next_maintenance_date ? new Date(t.next_maintenance_date).toLocaleDateString() : 'N/A',
    passengerLoad: 0,
    speed: 0,
    lastUpdate: new Date().toLocaleTimeString(),
    route: t.current_location || 'Unknown Route',
    fitnessExpiry: t.fitness_certificate_expiry ? new Date(t.fitness_certificate_expiry).toLocaleDateString() : 'N/A',
  }));

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-glow mb-2">AGAMI - Train Induction Control</h1>
          <p className="text-muted-foreground">
            AI-Powered Multi-Objective Optimization • {currentTime.toLocaleString()}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="glass-card border-success text-success">
            <Activity className="w-3 h-3 mr-1" />
            {operationalCount} / {trainsets.length} Operational
          </Badge>
          <Button variant="outline" onClick={handleGetAIInsights}>
            <Brain className="w-4 h-4 mr-2" />
            AI Insights
          </Button>
          <Button 
            variant="neural"
            onClick={handleRunOptimization}
            disabled={isOptimizing}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            {isOptimizing ? 'Optimizing...' : 'Run Optimization'}
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <MetricsGrid metrics={metricsData} />

      {/* AI Insights Panel */}
      {aiInsights && (
        <Card className="glass-card border-accent/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-accent" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-3">{aiInsights.recommendation}</p>
            {aiInsights.reasoning && (
              <div className="text-sm text-muted-foreground bg-background/50 p-3 rounded-lg">
                <strong>Reasoning:</strong> {aiInsights.reasoning}
              </div>
            )}
            <div className="flex items-center gap-2 mt-3">
              <Badge variant="secondary">
                Confidence: {Math.round((aiInsights.confidence_score || 0) * 100)}%
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Optimization Results */}
      {optimizationResult && (
        <Card className="glass-card border-primary/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Zap className="h-5 w-5 text-primary" />
              Optimization Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="glass-card p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Execution Time</div>
                <div className="text-2xl font-bold">{optimizationResult.execution_time_ms}ms</div>
              </div>
              <div className="glass-card p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Trainsets Analyzed</div>
                <div className="text-2xl font-bold">{optimizationResult.summary.total_trainsets}</div>
              </div>
              <div className="glass-card p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">High Priority</div>
                <div className="text-2xl font-bold text-warning">{optimizationResult.summary.high_priority}</div>
              </div>
              <div className="glass-card p-4 rounded-lg">
                <div className="text-sm text-muted-foreground">Critical Issues</div>
                <div className="text-2xl font-bold text-destructive">{optimizationResult.summary.critical_issues}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs defaultValue="fleet" className="w-full">
        <TabsList className="grid grid-cols-4 w-full max-w-2xl">
          <TabsTrigger value="fleet" className="flex items-center gap-2">
            <Train className="h-4 w-4" />
            Fleet
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-2">
            <MapPin className="h-4 w-4" />
            Live Status
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Staff
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fleet" className="mt-6">
          <FleetGrid trains={transformedTrainsets} />
        </TabsContent>

        <TabsContent value="live" className="mt-6">
          <LiveStatusBoard />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-6">
          <MaintenanceScheduler tasks={[]} />
        </TabsContent>

        <TabsContent value="staff" className="mt-6">
          <StaffScheduler staff={[]} />
        </TabsContent>
      </Tabs>

      {/* Navigation Grid - All Pages */}
      <div className="space-y-6">
        {/* Operations & Planning */}
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-glow">Operations & Planning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Button variant="neural" className="h-24 flex flex-col gap-2" onClick={() => navigate('/induction-plan')}>
                <CalendarDays className="w-5 h-5" />
                <span className="text-xs text-center">Induction Plan</span>
              </Button>
              <Button variant="hologram" className="h-24 flex flex-col gap-2" onClick={() => navigate('/fleet-status')}>
                <Train className="w-5 h-5" />
                <span className="text-xs text-center">Fleet Status</span>
              </Button>
              <Button variant="cockpit" className="h-24 flex flex-col gap-2" onClick={() => navigate('/simulator')}>
                <TestTube className="w-5 h-5" />
                <span className="text-xs text-center">Simulator</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => navigate('/staff-availability')}>
                <Users className="w-5 h-5" />
                <span className="text-xs text-center">Staff Availability</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => navigate('/stabling-geometry')}>
                <Warehouse className="w-5 h-5" />
                <span className="text-xs text-center">Stabling Geometry</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => navigate('/outcome-tracker')}>
                <Target className="w-5 h-5" />
                <span className="text-xs text-center">Outcome Tracker</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Maintenance & Compliance */}
        <Card className="glass-card border-accent/20">
          <CardHeader>
            <CardTitle className="text-glow">Maintenance & Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Button variant="neural" className="h-24 flex flex-col gap-2" onClick={() => navigate('/maintenance')}>
                <Wrench className="w-5 h-5" />
                <span className="text-xs text-center">Maintenance</span>
              </Button>
              <Button variant="hologram" className="h-24 flex flex-col gap-2" onClick={() => navigate('/fitness-certificates')}>
                <FileText className="w-5 h-5" />
                <span className="text-xs text-center">Fitness Certificates</span>
              </Button>
              <Button variant="cockpit" className="h-24 flex flex-col gap-2" onClick={() => navigate('/job-card-status')}>
                <ClipboardList className="w-5 h-5" />
                <span className="text-xs text-center">Job Card Status</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => navigate('/cleaning-detailing')}>
                <Sparkle className="w-5 h-5" />
                <span className="text-xs text-center">Cleaning & Detailing</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => navigate('/mileage-balancing')}>
                <Scale className="w-5 h-5" />
                <span className="text-xs text-center">Mileage Balancing</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => navigate('/branding-sla')}>
                <FileText className="w-5 h-5" />
                <span className="text-xs text-center">Branding SLA</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Analytics & Performance */}
        <Card className="glass-card border-success/20">
          <CardHeader>
            <CardTitle className="text-glow">Analytics & Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Button variant="neural" className="h-24 flex flex-col gap-2" onClick={() => navigate('/reports-analytics')}>
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs text-center">Reports & Analytics</span>
              </Button>
              <Button variant="hologram" className="h-24 flex flex-col gap-2" onClick={() => navigate('/accuracy-dashboard')}>
                <TrendingUp className="w-5 h-5" />
                <span className="text-xs text-center">Accuracy Dashboard</span>
              </Button>
              <Button variant="cockpit" className="h-24 flex flex-col gap-2" onClick={() => navigate('/performance')}>
                <Activity className="w-5 h-5" />
                <span className="text-xs text-center">Performance</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => navigate('/incidents')}>
                <AlertTriangle className="w-5 h-5" />
                <span className="text-xs text-center">Incidents</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => navigate('/audit-trail')}>
                <Shield className="w-5 h-5" />
                <span className="text-xs text-center">Audit Trail</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Data & Configuration */}
        <Card className="glass-card border-warning/20">
          <CardHeader>
            <CardTitle className="text-glow">Data & Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Button variant="neural" className="h-24 flex flex-col gap-2" onClick={() => navigate('/data-sources')}>
                <Database className="w-5 h-5" />
                <span className="text-xs text-center">Data Sources</span>
              </Button>
              <Button variant="hologram" className="h-24 flex flex-col gap-2" onClick={() => navigate('/data-entry')}>
                <ClipboardList className="w-5 h-5" />
                <span className="text-xs text-center">Data Entry</span>
              </Button>
              <Button variant="cockpit" className="h-24 flex flex-col gap-2" onClick={() => navigate('/algorithm-rules')}>
                <Code className="w-5 h-5" />
                <span className="text-xs text-center">Algorithm & Rules</span>
              </Button>
              <Button variant="outline" className="h-24 flex flex-col gap-2" onClick={() => navigate('/user-management')}>
                <Users className="w-5 h-5" />
                <span className="text-xs text-center">User Management</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Support & Feedback */}
        <Card className="glass-card border-muted/20">
          <CardHeader>
            <CardTitle className="text-glow">Support & Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              <Button variant="neural" className="h-24 flex flex-col gap-2" onClick={() => navigate('/support')}>
                <HelpCircle className="w-5 h-5" />
                <span className="text-xs text-center">Support</span>
              </Button>
              <Button variant="hologram" className="h-24 flex flex-col gap-2" onClick={() => navigate('/feedback')}>
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs text-center">Feedback</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
