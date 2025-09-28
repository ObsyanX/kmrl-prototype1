import React from 'react';
import { Users, Calendar, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const StaffAvailability: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-glow mb-2">Staff Availability</h1>
        <p className="text-muted-foreground">Manage staff schedules and availability</p>
      </div>

      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow flex items-center gap-2">
            <Users className="w-5 h-5" />
            Staff Management
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Staff availability interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffAvailability;