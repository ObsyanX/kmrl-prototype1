import React from 'react';
import { Database, Wifi, Activity, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const DataSources: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-glow mb-2">Data Sources</h1>
        <p className="text-muted-foreground">Manage and monitor external data integrations</p>
      </div>

      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow flex items-center gap-2">
            <Database className="w-5 h-5" />
            Data Integration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Data source management interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataSources;