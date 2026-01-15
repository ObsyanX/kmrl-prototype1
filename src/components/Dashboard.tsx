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
import { cn } from '@/lib/utils';

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
      title: "Operational", 
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
      changeLabel: "attention needed", 
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

  // Navigation button component for consistency
  const NavButton = ({ 
    icon: Icon, 
    label, 
    path, 
    variant = "outline" 
  }: { 
    icon: any; 
    label: string; 
    path: string; 
    variant?: "outline" | "neural" | "hologram" | "cockpit";
  }) => (
    <Button 
      variant={variant} 
      className={cn(
        "h-auto min-h-[72px] sm:min-h-[80px] lg:min-h-[88px] flex flex-col gap-1.5 sm:gap-2 p-2 sm:p-3",
        "touch-manipulation active:scale-95 transition-transform"
      )}
      onClick={() => navigate(path)}
    >
      <Icon className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
      <span className="text-[10px] sm:text-xs text-center leading-tight line-clamp-2">{label}</span>
    </Button>
  );

  return (
    <div className="min-h-screen bg-gradient-cockpit p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
      {/* Header Section - Mobile responsive */}
      <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-glow mb-1">
            AGAMI Control Center
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground truncate">
            AI-Powered Optimization • {currentTime.toLocaleTimeString()}
          </p>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <Badge variant="outline" className="glass-card border-success text-success text-xs shrink-0">
            <Activity className="w-3 h-3 mr-1" />
            {operationalCount}/{trainsets.length}
          </Badge>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleGetAIInsights}
            className="text-xs h-8 sm:h-9"
          >
            <Brain className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1.5" />
            <span className="hidden sm:inline">AI Insights</span>
          </Button>
          <Button 
            variant="neural"
            size="sm"
            onClick={handleRunOptimization}
            disabled={isOptimizing}
            className="text-xs h-8 sm:h-9"
          >
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 sm:mr-1.5" />
            <span className="hidden xs:inline">{isOptimizing ? 'Running...' : 'Optimize'}</span>
          </Button>
        </div>
      </div>

      {/* Metrics Grid */}
      <MetricsGrid metrics={metricsData} />

      {/* AI Insights Panel */}
      {aiInsights && (
        <Card className="glass-card border-accent/50">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Brain className="h-4 w-4 sm:h-5 sm:w-5 text-accent" />
              AI Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 sm:space-y-3">
            <p className="text-xs sm:text-sm text-muted-foreground">{aiInsights.recommendation}</p>
            {aiInsights.reasoning && (
              <div className="text-xs text-muted-foreground bg-background/50 p-2 sm:p-3 rounded-lg">
                <strong>Reasoning:</strong> {aiInsights.reasoning}
              </div>
            )}
            <Badge variant="secondary" className="text-xs">
              Confidence: {Math.round((aiInsights.confidence_score || 0) * 100)}%
            </Badge>
          </CardContent>
        </Card>
      )}

      {/* Optimization Results */}
      {optimizationResult && (
        <Card className="glass-card border-primary/30">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <Zap className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Optimization Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 lg:gap-4">
              <div className="glass-card p-2 sm:p-3 lg:p-4 rounded-lg">
                <div className="text-[10px] sm:text-xs text-muted-foreground">Execution</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{optimizationResult.execution_time_ms}ms</div>
              </div>
              <div className="glass-card p-2 sm:p-3 lg:p-4 rounded-lg">
                <div className="text-[10px] sm:text-xs text-muted-foreground">Analyzed</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold">{optimizationResult.summary.total_trainsets}</div>
              </div>
              <div className="glass-card p-2 sm:p-3 lg:p-4 rounded-lg">
                <div className="text-[10px] sm:text-xs text-muted-foreground">High Priority</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-warning">{optimizationResult.summary.high_priority}</div>
              </div>
              <div className="glass-card p-2 sm:p-3 lg:p-4 rounded-lg">
                <div className="text-[10px] sm:text-xs text-muted-foreground">Critical</div>
                <div className="text-lg sm:text-xl lg:text-2xl font-bold text-destructive">{optimizationResult.summary.critical_issues}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs - Scrollable on mobile */}
      <Tabs defaultValue="fleet" className="w-full">
        <TabsList className="w-full overflow-x-auto flex justify-start sm:justify-center gap-1 p-1 h-auto">
          <TabsTrigger value="fleet" className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 shrink-0">
            <Train className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Fleet</span>
          </TabsTrigger>
          <TabsTrigger value="live" className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 shrink-0">
            <MapPin className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Live</span>
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 shrink-0">
            <Shield className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Maintenance</span>
          </TabsTrigger>
          <TabsTrigger value="staff" className="flex items-center gap-1.5 text-xs sm:text-sm px-3 py-2 shrink-0">
            <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            <span>Staff</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fleet" className="mt-4 sm:mt-6">
          <FleetGrid trains={transformedTrainsets} />
        </TabsContent>

        <TabsContent value="live" className="mt-4 sm:mt-6">
          <LiveStatusBoard />
        </TabsContent>

        <TabsContent value="maintenance" className="mt-4 sm:mt-6">
          <MaintenanceScheduler tasks={[]} />
        </TabsContent>

        <TabsContent value="staff" className="mt-4 sm:mt-6">
          <StaffScheduler staff={[]} />
        </TabsContent>
      </Tabs>

      {/* Navigation Grid - All Pages */}
      <div className="space-y-4 sm:space-y-6">
        {/* Operations & Planning */}
        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base lg:text-lg text-glow">Operations & Planning</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
              <NavButton icon={CalendarDays} label="Induction Plan" path="/induction-plan" variant="neural" />
              <NavButton icon={Train} label="Fleet Status" path="/fleet-status" variant="hologram" />
              <NavButton icon={TestTube} label="Simulator" path="/simulator" variant="cockpit" />
              <NavButton icon={Users} label="Staff" path="/staff-availability" />
              <NavButton icon={Warehouse} label="Stabling" path="/stabling-geometry" />
              <NavButton icon={Target} label="Outcomes" path="/outcome-tracker" />
            </div>
          </CardContent>
        </Card>

        {/* Maintenance & Compliance */}
        <Card className="glass-card border-accent/20">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base lg:text-lg text-glow">Maintenance & Compliance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
              <NavButton icon={Wrench} label="Maintenance" path="/maintenance" variant="neural" />
              <NavButton icon={FileText} label="Fitness Certs" path="/fitness-certificates" variant="hologram" />
              <NavButton icon={ClipboardList} label="Job Cards" path="/job-card-status" variant="cockpit" />
              <NavButton icon={Sparkle} label="Cleaning" path="/cleaning-detailing" />
              <NavButton icon={Scale} label="Mileage" path="/mileage-balancing" />
              <NavButton icon={FileText} label="Branding" path="/branding-sla" />
            </div>
          </CardContent>
        </Card>

        {/* Analytics & Performance */}
        <Card className="glass-card border-success/20">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base lg:text-lg text-glow">Analytics & Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
              <NavButton icon={BarChart3} label="Reports" path="/reports-analytics" variant="neural" />
              <NavButton icon={TrendingUp} label="Accuracy" path="/accuracy-dashboard" variant="hologram" />
              <NavButton icon={Activity} label="Performance" path="/performance" variant="cockpit" />
              <NavButton icon={AlertTriangle} label="Incidents" path="/incidents" />
              <NavButton icon={Shield} label="Audit Trail" path="/audit-trail" />
            </div>
          </CardContent>
        </Card>

        {/* Data & Configuration */}
        <Card className="glass-card border-warning/20">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base lg:text-lg text-glow">Data & Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
              <NavButton icon={Database} label="Data Sources" path="/data-sources" variant="neural" />
              <NavButton icon={ClipboardList} label="Data Entry" path="/data-entry" variant="hologram" />
              <NavButton icon={Code} label="Algorithm" path="/algorithm-rules" variant="cockpit" />
              <NavButton icon={Users} label="Users" path="/user-management" />
            </div>
          </CardContent>
        </Card>

        {/* Support & Feedback */}
        <Card className="glass-card border-muted/20">
          <CardHeader className="pb-2 sm:pb-3">
            <CardTitle className="text-sm sm:text-base lg:text-lg text-glow">Support & Feedback</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-2 sm:gap-3">
              <NavButton icon={MessageSquare} label="Feedback" path="/feedback" variant="neural" />
              <NavButton icon={Brain} label="Support" path="/support" variant="hologram" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
