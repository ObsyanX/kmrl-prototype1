import React from 'react';
import { HelpCircle, Phone, Mail, MessageCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Support: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-glow mb-2">Help & Support Center</h1>
        <p className="text-muted-foreground">Get assistance and technical support</p>
      </div>

      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow flex items-center gap-2">
            <HelpCircle className="w-5 h-5" />
            Support Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">Support center interface coming soon...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default Support;