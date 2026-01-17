import React, { useState, useEffect } from 'react';
import { Brain, Play, RotateCcw, TrendingUp, Clock, Users, Train, AlertTriangle, ArrowRightLeft, CheckCircle, XCircle, HelpCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface SwapAnalysis {
  originalTrain: {
    trainId: string;
    name: string;
    readinessScore: number;
    status: string;
  };
  proposedTrain: {
    trainId: string;
    name: string;
    readinessScore: number;
    status: string;
  };
  readinessDelta: number;
  shuntingMoves: number;
  fuelCostEstimate: number;
  recommendation: 'ACCEPTED' | 'FEASIBLE' | 'REVIEW_REQUIRED' | 'REJECTED';
  confidence: number;
  risks: {
    safety: string[];
    operational: string[];
    maintenance: string[];
  };
  aiReasoning: string;
}

interface TrainOption {
  id: string;
  trainId: string;
  name: string;
  status: string;
}

const Simulator: React.FC = () => {
  const [activeTab, setActiveTab] = useState('parameters');
  const [isRunning, setIsRunning] = useState(false);
  const [simulationParams, setSimulationParams] = useState({
    crewAvailability: 85,
    batteryLevels: 75,
    maintenanceLoad: 60,
    weatherConditions: 90,
    passengerDemand: 70
  });

  const [results, setResults] = useState({
    efficiency: 87,
    utilization: 92,
    risksIdentified: 3,
    estimatedSavings: "12.5%",
    timeReduction: "1.2 hrs"
  });

  // What-If Swap Analysis State
  const [scheduledTrains, setScheduledTrains] = useState<TrainOption[]>([]);
  const [standbyTrains, setStandbyTrains] = useState<TrainOption[]>([]);
  const [selectedScheduledTrain, setSelectedScheduledTrain] = useState<string>('');
  const [selectedStandbyTrain, setSelectedStandbyTrain] = useState<string>('');
  const [swapAnalysis, setSwapAnalysis] = useState<SwapAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [planDate, setPlanDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  const scenarios = [
    {
      name: "Peak Hour Operations",
      description: "Simulate rush hour with maximum passenger demand",
      impact: "High",
      timeframe: "07:00 - 09:00"
    },
    {
      name: "Emergency Maintenance",
      description: "Unplanned maintenance during operational hours",
      impact: "Critical", 
      timeframe: "Any time"
    },
    {
      name: "Weather Disruption", 
      description: "Heavy monsoon affecting train operations",
      impact: "Medium",
      timeframe: "All day"
    },
    {
      name: "Staff Shortage",
      description: "20% reduction in available crew members",
      impact: "High",
      timeframe: "Night shift"
    }
  ];

  // Fetch trains for swap analysis
  useEffect(() => {
    fetchTrains();
  }, []);

  const fetchTrains = async () => {
    try {
      const { data: trains, error } = await supabase
        .from('trainsets')
        .select('id, train_id, name, status')
        .order('train_id');

      if (error) throw error;

      const scheduled = trains?.filter(t => 
        t.status === 'operational' || t.status === 'in_service'
      ).map(t => ({
        id: t.id,
        trainId: t.train_id,
        name: t.name || t.train_id,
        status: t.status
      })) || [];

      const standby = trains?.filter(t => 
        t.status === 'standby' || t.status === 'available'
      ).map(t => ({
        id: t.id,
        trainId: t.train_id,
        name: t.name || t.train_id,
        status: t.status
      })) || [];

      setScheduledTrains(scheduled);
      setStandbyTrains(standby);
    } catch (error) {
      console.error('Error fetching trains:', error);
    }
  };

  const handleRunSimulation = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      setResults({
        efficiency: Math.floor(Math.random() * 15) + 80,
        utilization: Math.floor(Math.random() * 20) + 75,
        risksIdentified: Math.floor(Math.random() * 5) + 1,
        estimatedSavings: `${(Math.random() * 20 + 5).toFixed(1)}%`,
        timeReduction: `${(Math.random() * 3 + 0.5).toFixed(1)} hrs`
      });
    }, 3000);
  };

  const handleReset = () => {
    setSimulationParams({
      crewAvailability: 85,
      batteryLevels: 75,
      maintenanceLoad: 60,
      weatherConditions: 90,
      passengerDemand: 70
    });
  };

  const handleSwapAnalysis = async () => {
    if (!selectedScheduledTrain || !selectedStandbyTrain) {
      toast.error('Please select both trains for swap analysis');
      return;
    }

    setIsAnalyzing(true);
    setSwapAnalysis(null);

    try {
      const response = await supabase.functions.invoke('what-if-analyzer', {
        body: {
          scheduledTrainId: selectedScheduledTrain,
          standbyTrainId: selectedStandbyTrain,
          planDate
        }
      });

      if (response.error) throw response.error;

      setSwapAnalysis(response.data as SwapAnalysis);
      toast.success('Swap analysis complete');
    } catch (error) {
      console.error('Swap analysis error:', error);
      toast.error('Failed to analyze swap');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getRecommendationBadge = (recommendation: string) => {
    switch (recommendation) {
      case 'ACCEPTED':
        return <Badge className="bg-green-500/20 text-green-400"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>;
      case 'FEASIBLE':
        return <Badge className="bg-blue-500/20 text-blue-400"><CheckCircle className="w-3 h-3 mr-1" />Feasible</Badge>;
      case 'REVIEW_REQUIRED':
        return <Badge className="bg-yellow-500/20 text-yellow-400"><HelpCircle className="w-3 h-3 mr-1" />Review Required</Badge>;
      case 'REJECTED':
        return <Badge className="bg-red-500/20 text-red-400"><XCircle className="w-3 h-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge>{recommendation}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-glow mb-2">What-If Simulator</h1>
          <p className="text-muted-foreground">
            Test different scenarios and optimize operations with AI-powered predictions
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="glass-card border-primary text-primary">
            <Brain className="w-3 h-3 mr-1" />
            Neural Simulation Engine
          </Badge>
        </div>
      </div>

      {/* Tabs for different simulation modes */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="glass-card">
          <TabsTrigger value="parameters">Parameter Simulation</TabsTrigger>
          <TabsTrigger value="swap">Train Swap Analysis</TabsTrigger>
        </TabsList>

        {/* Parameter Simulation Tab */}
        <TabsContent value="parameters" className="space-y-6">
          <div className="flex justify-end">
            <Button variant="neural" onClick={handleRunSimulation} disabled={isRunning}>
              {isRunning ? (
                <>
                  <Brain className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Simulation
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Simulation Parameters */}
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-glow">Simulation Parameters</CardTitle>
                    <CardDescription>Adjust variables to test different scenarios</CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleReset}>
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {Object.entries(simulationParams).map(([key, value]) => (
                  <div key={key} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium text-foreground">
                        {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                      </Label>
                      <span className="text-sm font-bold text-primary">{value}%</span>
                    </div>
                    <Slider
                      value={[value]}
                      onValueChange={(newValue) => 
                        setSimulationParams(prev => ({ ...prev, [key]: newValue[0] }))
                      }
                      max={100}
                      step={5}
                      className="w-full"
                    />
                  </div>
                ))}
                
                <div className="pt-4 border-t border-primary/10">
                  <h4 className="font-semibold text-foreground mb-3">Quick Scenarios</h4>
                  <div className="space-y-2">
                    {scenarios.slice(0, 2).map((scenario, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="w-full justify-start"
                        onClick={() => {
                          if (scenario.name.includes("Peak Hour")) {
                            setSimulationParams(prev => ({ ...prev, passengerDemand: 95, crewAvailability: 70 }));
                          } else if (scenario.name.includes("Emergency")) {
                            setSimulationParams(prev => ({ ...prev, maintenanceLoad: 90, batteryLevels: 40 }));
                          }
                        }}
                      >
                        <Badge 
                          variant={scenario.impact === 'Critical' ? 'destructive' : 
                                   scenario.impact === 'High' ? 'warning' : 'secondary'}
                          className="mr-2"
                        >
                          {scenario.impact}
                        </Badge>
                        {scenario.name}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Simulation Results */}
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-glow">Simulation Results</CardTitle>
                <CardDescription>
                  {isRunning ? "AI analyzing scenarios..." : "Latest simulation outcomes"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isRunning ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center space-y-4">
                      <Brain className="w-12 h-12 text-primary mx-auto animate-pulse" />
                      <p className="text-muted-foreground">Processing 1,000+ scenarios...</p>
                      <div className="w-32 h-2 bg-muted rounded-full mx-auto">
                        <div className="h-full bg-gradient-primary rounded-full animate-pulse" style={{width: '60%'}}></div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-4">
                      {[
                        { label: "Operational Efficiency", value: `${results.efficiency}%`, icon: TrendingUp, color: "success" },
                        { label: "Fleet Utilization", value: `${results.utilization}%`, icon: Train, color: "primary" },
                        { label: "Time Savings", value: results.timeReduction, icon: Clock, color: "warning" },
                        { label: "Cost Reduction", value: results.estimatedSavings, icon: TrendingUp, color: "success" }
                      ].map((metric, index) => (
                        <div key={index} className="glass-card p-4 rounded-lg border border-primary/10">
                          <div className="flex items-center gap-3">
                            <metric.icon className={`w-5 h-5 ${
                              metric.color === 'success' ? 'text-success' :
                              metric.color === 'warning' ? 'text-warning' : 'text-primary'
                            }`} />
                            <div>
                              <p className="text-xs text-muted-foreground">{metric.label}</p>
                              <p className="text-lg font-bold text-glow">{metric.value}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="glass-card p-4 rounded-lg border border-warning/30">
                      <div className="flex items-center gap-3 mb-3">
                        <AlertTriangle className="w-5 h-5 text-warning" />
                        <h4 className="font-semibold text-warning">Risk Analysis</h4>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-foreground">Risks Identified</span>
                          <Badge variant="warning">{results.risksIdentified}</Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          • Battery depletion during peak hours<br/>
                          • Staff shortage during night shift<br/>
                          • Potential weather delays
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Train Swap Analysis Tab */}
        <TabsContent value="swap" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Swap Selection */}
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-glow">
                  <ArrowRightLeft className="w-5 h-5" />
                  Train Swap Analysis
                </CardTitle>
                <CardDescription>
                  Evaluate swapping a scheduled train with a standby train
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Date Selection */}
                <div className="space-y-2">
                  <Label>Plan Date</Label>
                  <input
                    type="date"
                    value={planDate}
                    onChange={(e) => setPlanDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-card border border-primary/20 text-foreground"
                  />
                </div>

                {/* Scheduled Train Selection */}
                <div className="space-y-2">
                  <Label>Scheduled Train (To Replace)</Label>
                  <Select value={selectedScheduledTrain} onValueChange={setSelectedScheduledTrain}>
                    <SelectTrigger className="glass-card border-primary/20">
                      <SelectValue placeholder="Select scheduled train" />
                    </SelectTrigger>
                    <SelectContent>
                      {scheduledTrains.map((train) => (
                        <SelectItem key={train.id} value={train.id}>
                          <div className="flex items-center gap-2">
                            <Train className="w-4 h-4" />
                            {train.trainId} - {train.name}
                            <Badge variant="secondary" className="ml-2 text-xs">
                              {train.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Swap Arrow */}
                <div className="flex items-center justify-center">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <ArrowRightLeft className="w-5 h-5 text-primary" />
                  </div>
                </div>

                {/* Standby Train Selection */}
                <div className="space-y-2">
                  <Label>Standby Train (Replacement)</Label>
                  <Select value={selectedStandbyTrain} onValueChange={setSelectedStandbyTrain}>
                    <SelectTrigger className="glass-card border-primary/20">
                      <SelectValue placeholder="Select standby train" />
                    </SelectTrigger>
                    <SelectContent>
                      {standbyTrains.map((train) => (
                        <SelectItem key={train.id} value={train.id}>
                          <div className="flex items-center gap-2">
                            <Train className="w-4 h-4" />
                            {train.trainId} - {train.name}
                            <Badge variant="outline" className="ml-2 text-xs">
                              {train.status}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  variant="neural" 
                  className="w-full" 
                  onClick={handleSwapAnalysis}
                  disabled={isAnalyzing || !selectedScheduledTrain || !selectedStandbyTrain}
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Analyzing Swap...
                    </>
                  ) : (
                    <>
                      <Brain className="w-4 h-4 mr-2" />
                      Analyze Swap
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Swap Analysis Results */}
            <Card className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-glow">Analysis Results</CardTitle>
                <CardDescription>
                  AI-powered swap recommendation and risk assessment
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isAnalyzing ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center space-y-4">
                      <Brain className="w-12 h-12 text-primary mx-auto animate-pulse" />
                      <p className="text-muted-foreground">Analyzing swap impact...</p>
                    </div>
                  </div>
                ) : swapAnalysis ? (
                  <div className="space-y-6">
                    {/* Recommendation Banner */}
                    <div className={`p-4 rounded-lg border ${
                      swapAnalysis.recommendation === 'ACCEPTED' ? 'bg-green-500/10 border-green-500/30' :
                      swapAnalysis.recommendation === 'FEASIBLE' ? 'bg-blue-500/10 border-blue-500/30' :
                      swapAnalysis.recommendation === 'REVIEW_REQUIRED' ? 'bg-yellow-500/10 border-yellow-500/30' :
                      'bg-red-500/10 border-red-500/30'
                    }`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold">Recommendation</span>
                        {getRecommendationBadge(swapAnalysis.recommendation)}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Confidence: {swapAnalysis.confidence.toFixed(0)}%
                      </p>
                    </div>

                    {/* Train Comparison */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="glass-card p-4 rounded-lg border border-primary/10">
                        <p className="text-xs text-muted-foreground mb-1">Original Train</p>
                        <p className="font-medium">{swapAnalysis.originalTrain.trainId}</p>
                        <p className="text-sm text-primary">
                          Readiness: {swapAnalysis.originalTrain.readinessScore}
                        </p>
                      </div>
                      <div className="glass-card p-4 rounded-lg border border-primary/10">
                        <p className="text-xs text-muted-foreground mb-1">Proposed Train</p>
                        <p className="font-medium">{swapAnalysis.proposedTrain.trainId}</p>
                        <p className="text-sm text-primary">
                          Readiness: {swapAnalysis.proposedTrain.readinessScore}
                        </p>
                      </div>
                    </div>

                    {/* Impact Metrics */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Readiness Delta</span>
                        <Badge variant={swapAnalysis.readinessDelta >= 0 ? 'success' : 'destructive'}>
                          {swapAnalysis.readinessDelta >= 0 ? '+' : ''}{swapAnalysis.readinessDelta.toFixed(1)}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Shunting Moves</span>
                        <Badge variant="secondary">{swapAnalysis.shuntingMoves}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Estimated Fuel Cost</span>
                        <Badge variant="outline">₹{swapAnalysis.fuelCostEstimate.toLocaleString()}</Badge>
                      </div>
                    </div>

                    {/* Risks */}
                    {(swapAnalysis.risks.safety.length > 0 || 
                      swapAnalysis.risks.operational.length > 0 || 
                      swapAnalysis.risks.maintenance.length > 0) && (
                      <div className="space-y-3">
                        {swapAnalysis.risks.safety.length > 0 && (
                          <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                            <p className="text-xs font-semibold text-red-400 mb-1">Safety Risks</p>
                            {swapAnalysis.risks.safety.map((risk, i) => (
                              <p key={i} className="text-xs text-muted-foreground">• {risk}</p>
                            ))}
                          </div>
                        )}
                        {swapAnalysis.risks.operational.length > 0 && (
                          <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                            <p className="text-xs font-semibold text-yellow-400 mb-1">Operational Risks</p>
                            {swapAnalysis.risks.operational.map((risk, i) => (
                              <p key={i} className="text-xs text-muted-foreground">• {risk}</p>
                            ))}
                          </div>
                        )}
                        {swapAnalysis.risks.maintenance.length > 0 && (
                          <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/20">
                            <p className="text-xs font-semibold text-orange-400 mb-1">Maintenance Risks</p>
                            {swapAnalysis.risks.maintenance.map((risk, i) => (
                              <p key={i} className="text-xs text-muted-foreground">• {risk}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* AI Reasoning */}
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-2 mb-2">
                        <Brain className="w-4 h-4 text-primary" />
                        <span className="text-sm font-semibold">AI Reasoning</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{swapAnalysis.aiReasoning}</p>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <Button 
                        variant="success" 
                        className="flex-1"
                        disabled={swapAnalysis.recommendation === 'REJECTED'}
                      >
                        Apply Swap
                      </Button>
                      <Button variant="outline" className="flex-1">
                        Save Analysis
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                    <ArrowRightLeft className="w-12 h-12 mb-4 opacity-50" />
                    <p>Select trains and click "Analyze Swap"</p>
                    <p className="text-sm">to see AI-powered recommendations</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* All Scenarios */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow">Predefined Scenarios</CardTitle>
          <CardDescription>Test common operational challenges and their impacts</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scenarios.map((scenario, index) => (
              <div key={index} className="glass-card p-4 rounded-lg border border-primary/10">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-semibold text-foreground">{scenario.name}</h4>
                    <p className="text-sm text-muted-foreground mt-1">{scenario.description}</p>
                  </div>
                  <Badge 
                    variant={scenario.impact === 'Critical' ? 'destructive' : 
                             scenario.impact === 'High' ? 'warning' : 'secondary'}
                  >
                    {scenario.impact}
                  </Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{scenario.timeframe}</span>
                  </div>
                  <Button variant="outline" size="sm">
                    Run Scenario
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Simulator;
