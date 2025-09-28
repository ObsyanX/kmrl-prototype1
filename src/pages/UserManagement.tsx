import React from 'react';
import { Users, Shield, Settings, UserPlus } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const UserManagement: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-glow mb-2">User Management</h1>
        <p className="text-muted-foreground">Manage user accounts and permissions</p>
      </div>

      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow flex items-center gap-2">
            <Users className="w-5 h-5" />
            User Administration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">User management interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;