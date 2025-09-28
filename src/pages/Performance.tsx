import React from 'react';
import { Activity, BarChart3, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Performance: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-glow mb-2">Performance Metrics</h1>
        <p className="text-muted-foreground">Monitor and analyze system performance indicators</p>
      </div>

      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Performance Dashboard
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Performance metrics interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Performance;