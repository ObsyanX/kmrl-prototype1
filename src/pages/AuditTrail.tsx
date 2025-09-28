import React from 'react';
import { Shield, Clock, User, Activity } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const AuditTrail: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-glow mb-2">Audit Trail</h1>
        <p className="text-muted-foreground">Track all system activities and user actions</p>
      </div>

      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow flex items-center gap-2">
            <Shield className="w-5 h-5" />
            System Audit Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Audit trail interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditTrail;