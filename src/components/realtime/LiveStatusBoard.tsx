import React, { useState, useEffect } from 'react';
import { Activity, Wifi, WifiOff, Zap, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SystemStatus {
  name: string;
  status: 'online' | 'offline' | 'warning' | 'maintenance';
  latency: number;
  lastUpdate: Date;
  details?: string;
}

interface LiveStatusBoardProps {
  className?: string;
}

const LiveStatusBoard: React.FC<LiveStatusBoardProps> = ({ className = "" }) => {
  const [systems, setSystems] = useState<SystemStatus[]>([
    {
      name: 'Train Control System',
      status: 'online',
      latency: 12,
      lastUpdate: new Date(),
      details: 'All trains responding'
    },
    {
      name: 'Power Grid Monitor',
      status: 'online',
      latency: 8,
      lastUpdate: new Date(),
      details: 'Grid stable'
    },
    {
      name: 'Passenger Information',
      status: 'warning',
      latency: 45,
      lastUpdate: new Date(Date.now() - 30000),
      details: 'Delayed updates detected'
    },
    {
      name: 'Security Cameras',
      status: 'online',
      latency: 15,
      lastUpdate: new Date(),
      details: 'All cameras operational'
    },
    {
      name: 'Emergency Systems',
      status: 'online',
      latency: 5,
      lastUpdate: new Date(),
      details: 'Ready for deployment'
    },
    {
      name: 'Maintenance Scheduler',
      status: 'maintenance',
      latency: 0,
      lastUpdate: new Date(Date.now() - 600000),
      details: 'Scheduled downtime'
    }
  ]);

  const [isConnected, setIsConnected] = useState(true);
  const [lastHeartbeat, setLastHeartbeat] = useState(new Date());

  useEffect(() => {
    // Simulate real-time updates
    const interval = setInterval(() => {
      setLastHeartbeat(new Date());
      
      setSystems(prev => prev.map(system => ({
        ...system,
        latency: system.status === 'online' ? Math.floor(Math.random() * 30) + 5 : system.latency,
        lastUpdate: system.status === 'online' ? new Date() : system.lastUpdate
      })));
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online': return CheckCircle;
      case 'offline': return WifiOff;
      case 'warning': return AlertTriangle;
      case 'maintenance': return Clock;
      default: return Activity;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online': return 'success';
      case 'offline': return 'destructive';
      case 'warning': return 'warning';
      case 'maintenance': return 'secondary';
      default: return 'secondary';
    }
  };

  const getLatencyColor = (latency: number) => {
    if (latency < 20) return 'text-success';
    if (latency < 50) return 'text-warning';
    return 'text-destructive';
  };

  const overallStatus = systems.every(s => s.status === 'online') ? 'optimal' :
                       systems.some(s => s.status === 'offline') ? 'critical' : 'warning';

  return (
    <Card className={`glass-card border-primary/20 ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-glow flex items-center gap-2">
            <Activity className="w-5 h-5" />
            Live System Status
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge 
              variant={overallStatus === 'optimal' ? 'success' : overallStatus === 'critical' ? 'destructive' : 'warning'} 
              className="animate-pulse"
            >
              {isConnected ? <Wifi className="w-3 h-3 mr-1" /> : <WifiOff className="w-3 h-3 mr-1" />}
              {overallStatus.toUpperCase()}
            </Badge>
            <span className="text-xs text-muted-foreground">
              Last update: {lastHeartbeat.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* System Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {systems.map((system, index) => {
              const StatusIcon = getStatusIcon(system.status);
              const statusColor = getStatusColor(system.status);
              
              return (
                <div key={index} className="glass-card p-4 rounded-lg border border-primary/10">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-sm text-foreground">{system.name}</h4>
                    <Badge variant={statusColor as any} className="text-xs">
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {system.status}
                    </Badge>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Latency</span>
                      <span className={`text-xs font-medium ${getLatencyColor(system.latency)}`}>
                        {system.latency}ms
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Last Update</span>
                      <span className="text-xs">
                        {system.lastUpdate.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    {system.details && (
                      <p className="text-xs text-muted-foreground italic">
                        {system.details}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Quick Actions */}
          <div className="pt-4 border-t border-primary/10">
            <div className="flex flex-wrap gap-2">
              <Button variant="neural" size="sm">
                <Zap className="w-4 h-4 mr-2" />
                Run Diagnostics
              </Button>
              <Button variant="outline" size="sm">
                <Activity className="w-4 h-4 mr-2" />
                View Logs
              </Button>
              <Button variant="hologram" size="sm">
                <CheckCircle className="w-4 h-4 mr-2" />
                Health Check
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveStatusBoard;