import React, { useState } from 'react';
import { Users, Calendar, Clock, CheckCircle, TrendingUp, UserCheck, Shield, Phone } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import StaffScheduler from '@/components/staff/StaffScheduler';

const StaffAvailability: React.FC = () => {
  const [staffMembers] = useState([
    {
      id: 'STF-001',
      name: 'Rajesh Kumar',
      role: 'driver' as const,
      shift: 'morning' as const,
      status: 'on-duty' as const,
      location: 'Aluva Station',
      experience: 8,
      certifications: ['Safety Certificate', 'Emergency Response', 'Customer Service'],
      contact: {
        phone: '+91 9876543210',
        email: 'rajesh.kumar@kmrl.org'
      },
      currentAssignment: 'Train KMX-101',
      performanceRating: 4.8,
      hoursWorked: 42,
      overtimeHours: 2
    },
    {
      id: 'STF-002',
      name: 'Priya Nair',
      role: 'maintenance' as const,
      shift: 'afternoon' as const,
      status: 'on-duty' as const,
      location: 'Depot',
      experience: 6,
      certifications: ['Technical Certification', 'Safety Training', 'Equipment Handling'],
      contact: {
        phone: '+91 9876543211',
        email: 'priya.nair@kmrl.org'
      },
      currentAssignment: 'Battery Replacement',
      performanceRating: 4.6,
      hoursWorked: 38,
      overtimeHours: 0
    },
    {
      id: 'STF-003',
      name: 'Sunil Thomas',
      role: 'conductor' as const,
      shift: 'morning' as const,
      status: 'break' as const,
      location: 'Kalamassery',
      experience: 4,
      certifications: ['Customer Service', 'Emergency Procedures', 'First Aid'],
      contact: {
        phone: '+91 9876543212',
        email: 'sunil.thomas@kmrl.org'
      },
      currentAssignment: 'Train KMX-103',
      performanceRating: 4.2,
      hoursWorked: 35,
      overtimeHours: 0
    },
    {
      id: 'STF-004',
      name: 'Maya Krishnan',
      role: 'supervisor' as const,
      shift: 'night' as const,
      status: 'off-duty' as const,
      experience: 12,
      certifications: ['Leadership Training', 'Operations Management', 'Safety Oversight'],
      contact: {
        phone: '+91 9876543213',
        email: 'maya.krishnan@kmrl.org'
      },
      performanceRating: 4.9,
      hoursWorked: 40,
      overtimeHours: 0
    },
    {
      id: 'STF-005',
      name: 'Arjun Menon',
      role: 'security' as const,
      shift: 'night' as const,
      status: 'on-duty' as const,
      location: 'MG Road Station',
      experience: 3,
      certifications: ['Security Training', 'Emergency Response', 'CCTV Operations'],
      contact: {
        phone: '+91 9876543214',
        email: 'arjun.menon@kmrl.org'
      },
      currentAssignment: 'Night Security',
      performanceRating: 4.3,
      hoursWorked: 40,
      overtimeHours: 4
    },
    {
      id: 'STF-006',
      name: 'Lakshmi Devi',
      role: 'driver' as const,
      shift: 'afternoon' as const,
      status: 'sick' as const,
      experience: 7,
      certifications: ['Safety Certificate', 'Advanced Driving', 'Customer Relations'],
      contact: {
        phone: '+91 9876543215',
        email: 'lakshmi.devi@kmrl.org'
      },
      performanceRating: 4.5,
      hoursWorked: 0,
      overtimeHours: 0
    }
  ]);

  const handleStaffUpdate = (staffId: string, updates: any) => {
    console.log('Updating staff:', staffId, updates);
    // In a real app, this would update the state and sync with backend
  };

  const getStaffByRole = (role: string) => {
    return staffMembers.filter(member => member.role === role).length;
  };

  const getActiveStaff = () => {
    return staffMembers.filter(member => member.status === 'on-duty' || member.status === 'break').length;
  };

  const getTotalOvertime = () => {
    return staffMembers.reduce((total, member) => total + member.overtimeHours, 0);
  };

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-glow mb-2">Staff Management</h1>
          <p className="text-muted-foreground">
            Comprehensive staff scheduling and availability management
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Badge variant="outline" className="glass-card border-success text-success">
            <UserCheck className="w-3 h-3 mr-1" />
            {getActiveStaff()} Active Staff
          </Badge>
          <Button variant="neural">
            <Calendar className="w-4 h-4 mr-2" />
            Schedule Staff
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card className="glass-card border-primary/20 hologram-glow">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Drivers</p>
                <p className="text-2xl font-bold text-primary">{getStaffByRole('driver')}</p>
              </div>
              <Users className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Conductors</p>
                <p className="text-2xl font-bold text-success">{getStaffByRole('conductor')}</p>
              </div>
              <UserCheck className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Maintenance</p>
                <p className="text-2xl font-bold text-warning">{getStaffByRole('maintenance')}</p>
              </div>
              <Shield className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Security</p>
                <p className="text-2xl font-bold text-destructive">{getStaffByRole('security')}</p>
              </div>
              <Shield className="w-8 h-8 text-destructive" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Now</p>
                <p className="text-2xl font-bold text-success">{getActiveStaff()}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overtime</p>
                <p className="text-2xl font-bold text-warning">{getTotalOvertime()}h</p>
              </div>
              <Clock className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Staff Scheduler */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow">Staff Schedule & Availability</CardTitle>
          <CardDescription>
            Monitor and manage staff schedules, assignments, and performance across all shifts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StaffScheduler 
            staff={staffMembers}
            onStaffUpdate={handleStaffUpdate}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default StaffAvailability;