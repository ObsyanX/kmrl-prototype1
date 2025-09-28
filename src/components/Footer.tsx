import React from 'react';
import { Heart, Shield, Activity, Database, Wifi, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const Footer: React.FC = () => {
  const systemStatus = {
    dataIngestion: 'operational',
    aiModel: 'operational', 
    database: 'operational',
    network: 'operational',
    backupSystems: 'warning'
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'operational': return 'success';
      case 'warning': return 'warning';
      case 'error': return 'destructive';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'operational': return Activity;
      case 'warning': return AlertCircle;
      case 'error': return AlertCircle;
      default: return Shield;
    }
  };

  return (
    <footer className="glass-card border-t border-primary/20 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* System Status */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" />
              System Status
            </h3>
            <div className="space-y-2">
              {Object.entries(systemStatus).map(([system, status]) => {
                const StatusIcon = getStatusIcon(status);
                return (
                  <div key={system} className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground capitalize">
                      {system.replace(/([A-Z])/g, ' $1').trim()}
                    </span>
                    <Badge variant={getStatusColor(status) as any} className="text-xs">
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status}
                    </Badge>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Platform Information */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Platform Information</h3>
            <div className="space-y-2 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>Version:</span>
                <span className="text-primary font-mono">v2.1.0</span>
              </div>
              <div className="flex justify-between">
                <span>Last Update:</span>
                <span>{new Date().toLocaleDateString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Uptime:</span>
                <span className="text-success">99.8%</span>
              </div>
              <div className="flex justify-between">
                <span>Active Users:</span>
                <span>12</span>
              </div>
            </div>
          </div>

          {/* Quick Links & Support */}
          <div>
            <h3 className="text-sm font-semibold text-foreground mb-3">Support & Resources</h3>
            <div className="space-y-2">
              <a href="/support" className="block text-xs text-muted-foreground hover:text-primary transition-colors">
                Help & Support Center
              </a>
              <a href="/audit-trail" className="block text-xs text-muted-foreground hover:text-primary transition-colors">
                System Audit Trail
              </a>
              <a href="/user-management" className="block text-xs text-muted-foreground hover:text-primary transition-colors">
                User Management
              </a>
              <div className="pt-2 border-t border-primary/10">
                <p className="text-xs text-muted-foreground">
                  Emergency Contact: +91-484-2808080
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-6 pt-4 border-t border-primary/10 flex flex-col lg:flex-row items-center justify-between gap-4">
          {/* Left: Copyright */}
          <div className="text-xs text-muted-foreground">
            © 2025 Kochi Metro Rail Limited. All Rights Reserved.
          </div>
          
          {/* Center: System Status */}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">System Status:</span>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-success font-medium">All Systems Operational</span>
            </div>
          </div>
          
          {/* Right: Version Info */}
          <div className="text-xs text-muted-foreground">
            Version: 2.1.0 | Last Updated: 28-Sep-2025 16:30 IST
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;