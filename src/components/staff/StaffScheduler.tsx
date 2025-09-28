import React, { useState } from 'react';
import { User, Calendar, Clock, MapPin, Phone, Mail, Shield, CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface StaffMember {
  id: string;
  name: string;
  role: 'driver' | 'conductor' | 'maintenance' | 'supervisor' | 'security';
  shift: 'morning' | 'afternoon' | 'night';
  status: 'on-duty' | 'off-duty' | 'break' | 'sick' | 'vacation';
  location?: string;
  experience: number; // years
  certifications: string[];
  contact: {
    phone: string;
    email: string;
  };
  currentAssignment?: string;
  performanceRating: number; // 1-5
  hoursWorked: number;
  overtimeHours: number;
}

interface StaffSchedulerProps {
  staff: StaffMember[];
  onStaffUpdate?: (staffId: string, updates: Partial<StaffMember>) => void;
}

const StaffScheduler: React.FC<StaffSchedulerProps> = ({ staff, onStaffUpdate }) => {
  const [selectedFilter, setSelectedFilter] = useState<string>('all');

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'driver': return 'primary';
      case 'conductor': return 'success';
      case 'maintenance': return 'warning';
      case 'supervisor': return 'secondary';
      case 'security': return 'destructive';
      default: return 'outline';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'on-duty': return 'success';
      case 'break': return 'warning';
      case 'off-duty': return 'secondary';
      case 'sick': return 'destructive';
      case 'vacation': return 'outline';
      default: return 'outline';
    }
  };

  const getShiftIcon = (shift: string) => {
    // For now, just return Clock for all shifts
    return Clock;
  };

  const filteredStaff = staff.filter(member => {
    if (selectedFilter === 'all') return true;
    if (selectedFilter === 'on-duty') return member.status === 'on-duty';
    if (selectedFilter === 'available') return member.status === 'off-duty';
    return member.role === selectedFilter;
  });

  const getStaffByStatus = (status: string) => {
    return staff.filter(member => member.status === status).length;
  };

  const getAveragePerformance = () => {
    const total = staff.reduce((sum, member) => sum + member.performanceRating, 0);
    return (total / staff.length).toFixed(1);
  };

  const getTotalHours = () => {
    return staff.reduce((sum, member) => sum + member.hoursWorked, 0);
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">On Duty</p>
                <p className="text-2xl font-bold text-success">{getStaffByStatus('on-duty')}</p>
              </div>
              <User className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Available</p>
                <p className="text-2xl font-bold text-primary">{getStaffByStatus('off-duty')}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <p className="text-2xl font-bold text-success">{getAveragePerformance()}/5</p>
              </div>
              <Shield className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Hours</p>
                <p className="text-2xl font-bold text-foreground">{getTotalHours()}h</p>
              </div>
              <Clock className="w-8 h-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-wrap gap-2">
        {[
          { key: 'all', label: 'All Staff' },
          { key: 'on-duty', label: 'On Duty' },
          { key: 'available', label: 'Available' },
          { key: 'driver', label: 'Drivers' },
          { key: 'conductor', label: 'Conductors' },
          { key: 'maintenance', label: 'Maintenance' },
          { key: 'supervisor', label: 'Supervisors' }
        ].map(filter => (
          <Button
            key={filter.key}
            variant={selectedFilter === filter.key ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedFilter(filter.key)}
          >
            {filter.label}
          </Button>
        ))}
      </div>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStaff.map((member) => {
          const ShiftIcon = getShiftIcon(member.shift);
          
          return (
            <Card key={member.id} className="glass-card border-primary/20 hover:border-primary/40 transition-all">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-background" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <p className="text-sm text-muted-foreground">ID: {member.id}</p>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <Badge variant={getRoleColor(member.role) as any}>
                      {member.role}
                    </Badge>
                    <Badge variant={getStatusColor(member.status) as any}>
                      {member.status}
                    </Badge>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Shift & Location */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground flex items-center gap-1">
                      <ShiftIcon className="w-4 h-4" />
                      Shift
                    </label>
                    <p className="font-medium capitalize">{member.shift}</p>
                  </div>
                  {member.location && (
                    <div>
                      <label className="text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        Location
                      </label>
                      <p className="font-medium">{member.location}</p>
                    </div>
                  )}
                </div>

                {/* Performance Rating */}
                <div>
                  <div className="flex justify-between text-sm mb-2">
                    <span>Performance Rating</span>
                    <span>{member.performanceRating}/5</span>
                  </div>
                  <Progress value={member.performanceRating * 20} className="h-2" />
                </div>

                {/* Experience & Hours */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <label className="text-muted-foreground">Experience</label>
                    <p className="font-medium">{member.experience} years</p>
                  </div>
                  <div>
                    <label className="text-muted-foreground">Hours Worked</label>
                    <p className="font-medium">{member.hoursWorked}h</p>
                  </div>
                </div>

                {/* Current Assignment */}
                {member.currentAssignment && (
                  <div>
                    <label className="text-muted-foreground text-sm">Current Assignment</label>
                    <p className="font-medium text-primary">{member.currentAssignment}</p>
                  </div>
                )}

                {/* Certifications */}
                {member.certifications.length > 0 && (
                  <div>
                    <label className="text-muted-foreground text-sm">Certifications</label>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {member.certifications.slice(0, 3).map((cert, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {cert}
                        </Badge>
                      ))}
                      {member.certifications.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{member.certifications.length - 3} more
                        </Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="text-xs text-muted-foreground space-y-1">
                  <div className="flex items-center gap-1">
                    <Phone className="w-3 h-3" />
                    <span>{member.contact.phone}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Mail className="w-3 h-3" />
                    <span>{member.contact.email}</span>
                  </div>
                </div>

                {/* Overtime Warning */}
                {member.overtimeHours > 0 && (
                  <div className="flex items-center gap-2 p-2 bg-warning/10 rounded-lg">
                    <AlertTriangle className="w-4 h-4 text-warning" />
                    <span className="text-sm text-warning">
                      {member.overtimeHours}h overtime this week
                    </span>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-2 border-t border-primary/10">
                  {member.status === 'off-duty' && (
                    <Button 
                      variant="neural" 
                      size="sm"
                      onClick={() => onStaffUpdate?.(member.id, { status: 'on-duty' })}
                    >
                      Assign Duty
                    </Button>
                  )}
                  {member.status === 'on-duty' && (
                    <Button 
                      variant="hologram" 
                      size="sm"
                      onClick={() => onStaffUpdate?.(member.id, { status: 'off-duty' })}
                    >
                      End Shift
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    View Profile
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {filteredStaff.length === 0 && (
        <Card className="glass-card border-primary/20">
          <CardContent className="text-center py-8">
            <User className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No staff found</h3>
            <p className="text-muted-foreground">No staff members match the selected filter.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default StaffScheduler;