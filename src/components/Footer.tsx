import React from 'react';
import { Heart, Shield, Activity, Database, Wifi, AlertCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

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
    <footer className="glass-card border-t border-primary/20 backdrop-blur-xl mt-auto">
      <div className="w-full px-3 sm:px-4 lg:px-6 py-4 sm:py-6">
        {/* Mobile: Simplified single-column layout */}
        <div className="block sm:hidden space-y-4">
          {/* System Status - Compact */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">System Status:</span>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
              <span className="text-xs text-success font-medium">Operational</span>
            </div>
          </div>
          
          {/* Copyright */}
          <div className="text-center text-[10px] text-muted-foreground">
            © 2025 Kochi Metro Rail Limited
          </div>
        </div>

        {/* Tablet/Desktop: Full layout */}
        <div className="hidden sm:block">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            
            {/* System Status */}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3 flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-primary" />
                System Status
              </h3>
              <div className="space-y-1.5 sm:space-y-2">
                {Object.entries(systemStatus).map(([system, status]) => {
                  const StatusIcon = getStatusIcon(status);
                  return (
                    <div key={system} className="flex items-center justify-between">
                      <span className="text-[10px] sm:text-xs text-muted-foreground capitalize">
                        {system.replace(/([A-Z])/g, ' $1').trim()}
                      </span>
                      <Badge variant={getStatusColor(status) as any} className="text-[10px] sm:text-xs h-5 px-1.5">
                        <StatusIcon className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-0.5 sm:mr-1" />
                        <span className="hidden sm:inline">{status}</span>
                      </Badge>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Platform Information */}
            <div>
              <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3">Platform Info</h3>
              <div className="space-y-1.5 sm:space-y-2 text-[10px] sm:text-xs text-muted-foreground">
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
              <h3 className="text-xs sm:text-sm font-semibold text-foreground mb-2 sm:mb-3">Support</h3>
              <div className="space-y-1.5 sm:space-y-2">
                <a href="/support" className="block text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors">
                  Help & Support Center
                </a>
                <a href="/audit-trail" className="block text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors">
                  System Audit Trail
                </a>
                <a href="/user-management" className="block text-[10px] sm:text-xs text-muted-foreground hover:text-primary transition-colors">
                  User Management
                </a>
                <div className="pt-1.5 sm:pt-2 border-t border-primary/10">
                  <p className="text-[10px] sm:text-xs text-muted-foreground">
                    Emergency: +91-484-2808080
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-primary/10 flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
            <div className="text-[10px] sm:text-xs text-muted-foreground text-center sm:text-left">
              © 2025 Kochi Metro Rail Limited. All Rights Reserved.
            </div>
            
            <div className="flex items-center gap-2 text-[10px] sm:text-xs">
              <span className="text-muted-foreground">Status:</span>
              <div className="flex items-center gap-1">
                <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-success rounded-full animate-pulse" />
                <span className="text-success font-medium">All Systems Operational</span>
              </div>
            </div>
            
            <div className="text-[10px] sm:text-xs text-muted-foreground hidden lg:block">
              v2.1.0 | Updated: {new Date().toLocaleDateString()}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
