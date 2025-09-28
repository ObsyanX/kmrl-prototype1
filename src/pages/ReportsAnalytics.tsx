import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, Download, CalendarDays, BarChart3, FileText, Activity } from 'lucide-react';

const ReportsAnalytics: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState('performance');
  
  const performanceData = [
    { month: 'Jan', accuracy: 94, onTime: 97, efficiency: 89 },
    { month: 'Feb', accuracy: 96, onTime: 95, efficiency: 92 },
    { month: 'Mar', accuracy: 93, onTime: 98, efficiency: 91 },
    { month: 'Apr', accuracy: 98, onTime: 96, efficiency: 94 },
    { month: 'May', accuracy: 97, onTime: 99, efficiency: 96 },
    { month: 'Jun', accuracy: 95, onTime: 97, efficiency: 93 },
  ];

  const utilizationData = [
    { name: 'Optimally Used', value: 60, color: '#22c55e' },
    { name: 'Over Utilized', value: 25, color: '#ef4444' },
    { name: 'Under Utilized', value: 15, color: '#f59e0b' },
  ];

  const aiDecisionData = [
    { week: 'Week 1', aiRecommended: 45, manualOverrides: 5, accuracy: 90 },
    { week: 'Week 2', aiRecommended: 48, manualOverrides: 2, accuracy: 96 },
    { week: 'Week 3', aiRecommended: 42, manualOverrides: 8, accuracy: 84 },
    { week: 'Week 4', aiRecommended: 50, manualOverrides: 0, accuracy: 100 },
  ];

  const generateReport = () => {
    setIsGenerating(true);
    // Simulate report generation with 3D route animation
    setTimeout(() => {
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-glow">Reports & Analytics</h1>
          <p className="text-muted-foreground">Historical performance reports and trend analysis</p>
        </div>
        <Button onClick={generateReport} disabled={isGenerating} className="gap-2">
          {isGenerating ? (
            <>
              <Activity className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Generate Report
            </>
          )}
        </Button>
      </div>

      {/* Report Configuration */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle>Report Configuration</CardTitle>
          <CardDescription>Select report type and date range for analysis</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={selectedReport} onValueChange={setSelectedReport}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="performance">AI Performance Analysis</SelectItem>
                  <SelectItem value="utilization">Fleet Utilization Report</SelectItem>
                  <SelectItem value="maintenance">Maintenance Efficiency</SelectItem>
                  <SelectItem value="incidents">Incident Analysis</SelectItem>
                  <SelectItem value="trends">Long-term Trends</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Date Range</label>
              <Select defaultValue="last30">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7">Last 7 days</SelectItem>
                  <SelectItem value="last30">Last 30 days</SelectItem>
                  <SelectItem value="last90">Last 90 days</SelectItem>
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label className="text-sm font-medium">Format</label>
              <Select defaultValue="pdf">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pdf">PDF Report</SelectItem>
                  <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                  <SelectItem value="csv">CSV Data</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Generation Animation */}
      {isGenerating && (
        <Card className="glass-card">
          <CardContent className="py-8">
            <div className="h-32 bg-gradient-to-br from-primary/5 to-kmrl-green/5 rounded-lg border border-primary/20 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Generating Report...</div>
                  <div className="text-xs text-muted-foreground">Collecting data across Kochi Metro routes</div>
                  <div className="flex justify-center space-x-1">
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-kmrl-green rounded-full animate-pulse delay-75"></div>
                    <div className="w-2 h-2 bg-primary rounded-full animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Key Performance Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">AI Accuracy</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">95.7%</div>
            <div className="flex items-center gap-1 text-xs text-success">
              <TrendingUp className="w-3 h-3" />
              +2.3% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">On-Time Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">97.1%</div>
            <div className="flex items-center gap-1 text-xs text-success">
              <TrendingUp className="w-3 h-3" />
              +0.8% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Fleet Efficiency</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-kmrl-green">93.2%</div>
            <div className="flex items-center gap-1 text-xs text-success">
              <TrendingUp className="w-3 h-3" />
              +1.5% from last month
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">₹2.4L</div>
            <div className="text-xs text-muted-foreground">Monthly optimization savings</div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Trends */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5" />
            AI Performance Trends
          </CardTitle>
          <CardDescription>Monthly accuracy, on-time performance, and efficiency metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.1)" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.9)',
                    border: '1px solid rgba(59, 130, 246, 0.2)',
                    borderRadius: '8px',
                    backdropFilter: 'blur(8px)',
                  }}
                />
                <Line type="monotone" dataKey="accuracy" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="onTime" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981', strokeWidth: 2 }} />
                <Line type="monotone" dataKey="efficiency" stroke="#f59e0b" strokeWidth={2} dot={{ fill: '#f59e0b', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Fleet Utilization & AI Decisions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Fleet Utilization Distribution</CardTitle>
            <CardDescription>Current utilization patterns across the fleet</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={utilizationData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    dataKey="value"
                    startAngle={90}
                    endAngle={450}
                  >
                    {utilizationData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-4">
              {utilizationData.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                    <span className="text-sm">{item.name}</span>
                  </div>
                  <span className="text-sm font-medium">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>AI Decision Analysis</CardTitle>
            <CardDescription>Weekly AI recommendations vs manual overrides</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={aiDecisionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 116, 139, 0.1)" />
                  <XAxis dataKey="week" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(59, 130, 246, 0.2)',
                      borderRadius: '8px',
                      backdropFilter: 'blur(8px)',
                    }}
                  />
                  <Bar dataKey="aiRecommended" fill="#3b82f6" name="AI Recommended" />
                  <Bar dataKey="manualOverrides" fill="#ef4444" name="Manual Overrides" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Reports */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Quick Report Templates
          </CardTitle>
          <CardDescription>Pre-configured reports for common analysis needs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-4 cursor-pointer hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <CalendarDays className="w-5 h-5 text-primary" />
                <div className="font-semibold">Weekly Summary</div>
              </div>
              <div className="text-sm text-muted-foreground">
                AI performance, overrides, and key metrics for the past week
              </div>
              <Badge variant="outline" className="mt-2">PDF Ready</Badge>
            </div>
            
            <div className="glass-card p-4 cursor-pointer hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-5 h-5 text-success" />
                <div className="font-semibold">Monthly Trends</div>
              </div>
              <div className="text-sm text-muted-foreground">
                Long-term performance analysis with predictive insights
              </div>
              <Badge variant="outline" className="mt-2">Excel Format</Badge>
            </div>
            
            <div className="glass-card p-4 cursor-pointer hover:border-primary/40 transition-colors">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="w-5 h-5 text-kmrl-green" />
                <div className="font-semibold">Fleet Analysis</div>
              </div>
              <div className="text-sm text-muted-foreground">
                Utilization patterns, maintenance efficiency, and optimization opportunities
              </div>
              <Badge variant="outline" className="mt-2">Interactive</Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReportsAnalytics;