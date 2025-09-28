import React from 'react';
import { AlertTriangle, FileText, Clock, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Incidents: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-glow mb-2">Incident Reports</h1>
        <p className="text-muted-foreground">Track and manage operational incidents</p>
      </div>

      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Incident Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Incident reporting interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Incidents;