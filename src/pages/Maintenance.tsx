import React, { useState } from 'react';
import { Wrench, Calendar, AlertTriangle, CheckCircle, Clock, TrendingUp, Users } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import MaintenanceScheduler from '@/components/maintenance/MaintenanceScheduler';

const Maintenance: React.FC = () => {
  const [maintenanceTasks] = useState([
    {
      id: 'MNT-001',
      trainId: 'KMX-101',
      type: 'routine' as const,
      title: 'Monthly Safety Inspection',
      description: 'Comprehensive safety check including brakes, doors, and communication systems',
      priority: 'medium' as const,
      status: 'scheduled' as const,
      scheduledDate: new Date('2024-10-15'),
      estimatedDuration: 4,
      assignedTechnician: 'Rajesh Kumar',
      progress: 0,
      requiredParts: ['Brake pads', 'Safety sensors'],
      lastMaintenance: new Date('2024-09-15')
    },
    {
      id: 'MNT-002',
      trainId: 'KMX-102',
      type: 'corrective' as const,
      title: 'Battery Replacement',
      description: 'Replace degraded battery pack affecting performance',
      priority: 'high' as const,
      status: 'in-progress' as const,
      scheduledDate: new Date('2024-10-12'),
      estimatedDuration: 6,
      assignedTechnician: 'Priya Nair',
      progress: 65,
      requiredParts: ['Battery pack', 'Cooling system'],
      lastMaintenance: new Date('2024-08-20')
    },
    {
      id: 'MNT-003',
      trainId: 'KMX-104',
      type: 'emergency' as const,
      title: 'Door Mechanism Repair',
      description: 'Emergency repair for malfunctioning passenger door',
      priority: 'critical' as const,
      status: 'overdue' as const,
      scheduledDate: new Date('2024-10-10'),
      estimatedDuration: 2,
      assignedTechnician: 'Sunil Thomas',
      progress: 0,
      requiredParts: ['Door actuator', 'Control circuit'],
      lastMaintenance: new Date('2024-09-05')
    },
    {
      id: 'MNT-004',
      trainId: 'KMX-103',
      type: 'preventive' as const,
      title: 'Air Conditioning Service',
      description: 'Preventive maintenance for HVAC system',
      priority: 'low' as const,
      status: 'completed' as const,
      scheduledDate: new Date('2024-10-08'),
      estimatedDuration: 3,
      assignedTechnician: 'Maya Krishnan',
      progress: 100,
      requiredParts: ['Air filters', 'Refrigerant'],
      lastMaintenance: new Date('2024-07-08')
    },
    {
      id: 'MNT-005',
      trainId: 'KMX-105',
      type: 'routine' as const,
      title: 'Wheel Set Inspection',
      description: 'Routine inspection and maintenance of wheel sets',
      priority: 'medium' as const,
      status: 'scheduled' as const,
      scheduledDate: new Date('2024-10-18'),
      estimatedDuration: 5,
      assignedTechnician: 'Arjun Menon',
      progress: 0,
      requiredParts: ['Wheel bearings', 'Lubricants'],
      lastMaintenance: new Date('2024-08-18')
    }
  ]);

  const handleTaskUpdate = (taskId: string, updates: any) => {
    console.log('Updating task:', taskId, updates);
    // In a real app, this would update the state and sync with backend
  };

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-glow mb-2">Maintenance Management</h1>
          <p className="text-muted-foreground">
            Comprehensive maintenance scheduling and tracking system
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="glass-card border-success text-success">
            <CheckCircle className="w-3 h-3 mr-1" />
            System Operational
          </Badge>
          <Button variant="neural">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule New Task
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6">
        <Card className="glass-card border-primary/20 hologram-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Tasks</p>
                <p className="text-2xl font-bold text-primary">{maintenanceTasks.length}</p>
              </div>
              <Wrench className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">In Progress</p>
                <p className="text-2xl font-bold text-warning">
                  {maintenanceTasks.filter(t => t.status === 'in-progress').length}
                </p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue</p>
                <p className="text-2xl font-bold text-destructive">
                  {maintenanceTasks.filter(t => t.status === 'overdue').length}
                </p>
              </div>
              <AlertTriangle className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-success">
                  {maintenanceTasks.filter(t => t.status === 'completed').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Efficiency</p>
                <p className="text-2xl font-bold text-success">94%</p>
              </div>
              <TrendingUp className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Maintenance Scheduler */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow">Maintenance Schedule</CardTitle>
          <CardDescription>
            Manage and track all maintenance activities across the KMRL fleet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MaintenanceScheduler 
            tasks={maintenanceTasks}
            onTaskUpdate={handleTaskUpdate}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default Maintenance;