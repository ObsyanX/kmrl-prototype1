import React, { useState } from 'react';
import { Brain, Calendar, Clock, Train, Users, CheckCircle, AlertTriangle, Zap } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const InductionPlan: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const aiRecommendations = [
    {
      trainId: "KMX-101",
      shift: "Night Shift (22:00-06:00)",
      priority: "High",
      confidence: 94,
      reasoning: "Optimal battery level, experienced crew available, low passenger demand window",
      estimatedDuration: "6 hours",
      crew: ["Operator A. Kumar", "Technician R. Nair"]
    },
    {
      trainId: "KMX-103", 
      shift: "Early Morning (06:00-10:00)",
      priority: "Medium",
      confidence: 87,
      reasoning: "Good battery level, regular maintenance window, moderate crew availability",
      estimatedDuration: "4 hours",
      crew: ["Operator S. Pillai", "Technician M. Jose"]
    },
    {
      trainId: "KMX-105",
      shift: "Late Night (02:00-06:00)", 
      priority: "Low",
      confidence: 78,
      reasoning: "Adequate battery, limited crew, low priority maintenance items",
      estimatedDuration: "3 hours",
      crew: ["Operator D. Menon", "Technician K. Shah"]
    }
  ];

  const handleGeneratePlan = () => {
    setIsGenerating(true);
    setTimeout(() => setIsGenerating(false), 3000);
  };

  const handleApproveRecommendation = (trainId: string) => {
    console.log(`Approved induction plan for ${trainId}`);
  };

  const handleOverride = (trainId: string) => {
    console.log(`Override requested for ${trainId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-glow mb-2">AI-Driven Induction Plan</h1>
          <p className="text-muted-foreground">
            Intelligent scheduling for tonight's train induction operations
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="glass-card border-primary text-primary">
            <Brain className="w-3 h-3 mr-1" />
            AI Model v2.1.0
          </Badge>
          <Button 
            variant="neural" 
            onClick={handleGeneratePlan}
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Zap className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="w-4 h-4 mr-2" />
                Regenerate Plan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Plan Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Total Trains Scheduled", value: "3", icon: Train, color: "primary" },
          { title: "Estimated Duration", value: "13 hrs", icon: Clock, color: "success" },
          { title: "Crew Members Assigned", value: "6", icon: Users, color: "warning" },
          { title: "Confidence Score", value: "86%", icon: CheckCircle, color: "success" }
        ].map((stat, index) => (
          <Card key={index} className="glass-card border-primary/20 hologram-glow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-glow">{stat.value}</p>
                </div>
                <stat.icon className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Recommendations */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-glow">AI-Generated Recommendations</CardTitle>
              <CardDescription>
                Optimized induction schedule based on 6 data sources and historical patterns
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-success border-success">
              Last Updated: {new Date().toLocaleTimeString()}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {aiRecommendations.map((rec, index) => (
              <div key={index} className="glass-card p-6 rounded-lg border border-primary/10">
                <div className="flex flex-col lg:flex-row gap-6">
                  
                  {/* Train Info */}
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="p-3 glass-card rounded-lg">
                        <Train className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-glow">{rec.trainId}</h3>
                        <p className="text-muted-foreground">{rec.shift}</p>
                      </div>
                      <Badge variant={rec.priority === 'High' ? 'destructive' : rec.priority === 'Medium' ? 'warning' : 'secondary'}>
                        {rec.priority} Priority
                      </Badge>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">AI Confidence</label>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={rec.confidence} className="flex-1" />
                          <span className="text-sm font-bold text-success">{rec.confidence}%</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-muted-foreground">Estimated Duration</label>
                        <p className="text-lg font-semibold text-foreground mt-1">{rec.estimatedDuration}</p>
                      </div>
                    </div>
                    
                    <div className="mb-4">
                      <label className="text-sm font-medium text-muted-foreground">AI Reasoning</label>
                      <p className="text-sm text-foreground mt-1">{rec.reasoning}</p>
                    </div>
                    
                    <div>
                      <label className="text-sm font-medium text-muted-foreground">Assigned Crew</label>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {rec.crew.map((member, i) => (
                          <Badge key={i} variant="outline" className="text-primary border-primary">
                            <Users className="w-3 h-3 mr-1" />
                            {member}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                  
                  {/* Actions */}
                  <div className="flex flex-col gap-3 lg:w-48">
                    <Button 
                      variant="success" 
                      className="flex-1"
                      onClick={() => handleApproveRecommendation(rec.trainId)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve Plan
                    </Button>
                    <Button 
                      variant="outline"
                      onClick={() => handleOverride(rec.trainId)}
                    >
                      <AlertTriangle className="w-4 h-4 mr-2" />
                      Manual Override
                    </Button>
                    <Button variant="ghost" size="sm">
                      View Details
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-glow">Data Source Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { name: "Fleet Management System", status: "Connected", latency: "12ms" },
                { name: "Maintenance Database", status: "Connected", latency: "8ms" },
                { name: "Staff Scheduling API", status: "Connected", latency: "15ms" },
                { name: "Fitness Certificate DB", status: "Connected", latency: "20ms" },
                { name: "Performance Metrics", status: "Connected", latency: "10ms" },
                { name: "Incident Management", status: "Connected", latency: "18ms" }
              ].map((source, index) => (
                <div key={index} className="flex items-center justify-between p-3 glass-card rounded border border-primary/10">
                  <span className="text-sm text-foreground">{source.name}</span>
                  <div className="flex items-center gap-2">
                    <Badge variant="success" className="text-xs">
                      {source.status}
                    </Badge>
                    <span className="text-xs text-muted-foreground">{source.latency}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-glow">Historical Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Plan Accuracy (Last 30 days)</span>
                <span className="text-lg font-bold text-success">94.2%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Average Completion Time</span>
                <span className="text-lg font-bold text-primary">4.2 hours</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Manual Overrides</span>
                <span className="text-lg font-bold text-warning">8.3%</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Zero Incidents</span>
                <span className="text-lg font-bold text-success">26 days</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default InductionPlan;