import React, { useState } from 'react';
import { Brain, Play, RotateCcw, TrendingUp, Clock, Users, Train, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

const Simulator: React.FC = () => {
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

  const handleRunSimulation = () => {
    setIsRunning(true);
    setTimeout(() => {
      setIsRunning(false);
      // Update results with simulated data
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
                      // Apply scenario-specific parameters
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
                
                {/* Key Metrics */}
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

                {/* Risk Analysis */}
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
                      • Battery depletion during peak hours
                      • Staff shortage during night shift
                      • Potential weather delays
                    </div>
                  </div>
                </div>

                {/* Recommendations */}
                <div className="glass-card p-4 rounded-lg border border-success/30">
                  <h4 className="font-semibold text-success mb-3">AI Recommendations</h4>
                  <ul className="space-y-2 text-sm text-foreground">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-success rounded-full mt-2" />
                      Increase battery charging frequency during low-demand periods
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-success rounded-full mt-2" />
                      Schedule preventive maintenance during optimal windows
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 bg-success rounded-full mt-2" />
                      Cross-train staff to reduce dependency risks
                    </li>
                  </ul>
                </div>

                <div className="flex gap-3">
                  <Button variant="success" className="flex-1">
                    Apply Recommendations
                  </Button>
                  <Button variant="outline" className="flex-1">
                    Export Report
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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