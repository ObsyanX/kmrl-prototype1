import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Calendar, Clock, Users, Wrench, Plus, CheckCircle, PlayCircle } from 'lucide-react';

const CleaningDetailing: React.FC = () => {
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  
  const cleaningBays = [
    { id: 'Bay-1', capacity: 1, status: 'occupied', currentTrain: 'T03', jobType: 'Deep Cleaning', progress: 75, estimatedCompletion: '14:30' },
    { id: 'Bay-2', capacity: 1, status: 'available', currentTrain: null, jobType: null, progress: 0, estimatedCompletion: null },
    { id: 'Bay-3', capacity: 1, status: 'scheduled', currentTrain: 'T07', jobType: 'Standard Interior', progress: 0, estimatedCompletion: '16:00' },
    { id: 'Bay-4', capacity: 1, status: 'maintenance', currentTrain: null, jobType: null, progress: 0, estimatedCompletion: null },
  ];

  const availableTrains = ['T01', 'T05', 'T09', 'T12', 'T15', 'T18'];
  const availableStaff = ['Crew A (4 members)', 'Crew B (3 members)', 'Crew C (5 members)'];
  const cleaningTypes = ['Standard Interior', 'Deep Cleaning', 'Exterior Wash', 'Wrap Detailing'];

  const scheduledJobs = [
    { id: 1, train: 'T03', bay: 'Bay-1', type: 'Deep Cleaning', crew: 'Crew A', startTime: '12:00', duration: '3h', status: 'in-progress' },
    { id: 2, train: 'T07', bay: 'Bay-3', type: 'Standard Interior', crew: 'Crew B', startTime: '15:00', duration: '2h', status: 'scheduled' },
    { id: 3, train: 'T12', bay: 'Bay-2', type: 'Exterior Wash', crew: 'Crew C', startTime: '17:00', duration: '1h', status: 'scheduled' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'occupied': return 'destructive';
      case 'scheduled': return 'warning';
      case 'available': return 'success';
      case 'maintenance': return 'secondary';
      default: return 'secondary';
    }
  };

  const getJobStatusColor = (status: string) => {
    switch (status) {
      case 'in-progress': return 'warning';
      case 'scheduled': return 'default';
      case 'completed': return 'success';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-glow">Depot Bay & Cleaning Schedule</h1>
          <p className="text-muted-foreground">Manage physical and human resources for interior cleaning</p>
        </div>
        <Dialog open={isScheduleModalOpen} onOpenChange={setIsScheduleModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Schedule Cleaning
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Schedule New Cleaning Job</DialogTitle>
              <DialogDescription>
                Select train, cleaning type, and assign crew for the cleaning job.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Select Train</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose available train" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTrains.map((train) => (
                      <SelectItem key={train} value={train}>{train}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Cleaning Type</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select service type" />
                  </SelectTrigger>
                  <SelectContent>
                    {cleaningTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label>Assign Crew</Label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Select available crew" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableStaff.map((crew) => (
                      <SelectItem key={crew} value={crew}>{crew}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setIsScheduleModalOpen(false)} className="flex-1">
                  Schedule Job
                </Button>
                <Button variant="outline" onClick={() => setIsScheduleModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bay Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {cleaningBays.map((bay) => (
          <Card key={bay.id} className="glass-card">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{bay.id}</CardTitle>
                <Badge variant={getStatusColor(bay.status)}>
                  {bay.status.replace('-', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {bay.currentTrain && (
                <div>
                  <div className="text-sm text-muted-foreground">Current Train</div>
                  <div className="font-semibold text-lg">{bay.currentTrain}</div>
                </div>
              )}
              
              {bay.jobType && (
                <div>
                  <div className="text-sm text-muted-foreground">Job Type</div>
                  <div className="font-medium">{bay.jobType}</div>
                </div>
              )}
              
              {bay.status === 'occupied' && bay.progress > 0 && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Progress</span>
                    <span className="font-medium">{bay.progress}%</span>
                  </div>
                  <div className="w-full bg-secondary rounded-full h-2">
                    <div 
                      className="bg-primary h-2 rounded-full transition-all duration-500 shimmer-animation"
                      style={{ width: `${bay.progress}%` }}
                    />
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3 h-3" />
                    Est. completion: {bay.estimatedCompletion}
                  </div>
                </div>
              )}
              
              {bay.status === 'available' && (
                <div className="text-center py-4">
                  <CheckCircle className="w-8 h-8 text-success mx-auto mb-2" />
                  <div className="text-sm text-success">Ready for next job</div>
                </div>
              )}
              
              {bay.status === 'maintenance' && (
                <div className="text-center py-4">
                  <Wrench className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">Under maintenance</div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Real-time Gantt Chart */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Live Cleaning Schedule
          </CardTitle>
          <CardDescription>Real-time Gantt chart with progress animation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Timeline Header */}
            <div className="grid grid-cols-12 gap-2 text-xs text-muted-foreground border-b border-primary/20 pb-2">
              <div className="col-span-2">Train/Bay</div>
              <div className="col-span-2">Service Type</div>
              <div className="col-span-8 flex justify-between">
                <span>12:00</span><span>14:00</span><span>16:00</span><span>18:00</span><span>20:00</span>
              </div>
            </div>
            
            {/* Schedule Rows */}
            {scheduledJobs.map((job) => (
              <div key={job.id} className="grid grid-cols-12 gap-2 items-center py-3 border-b border-primary/10">
                <div className="col-span-2">
                  <div className="font-medium">{job.train}</div>
                  <div className="text-xs text-muted-foreground">{job.bay}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-sm">{job.type}</div>
                  <div className="text-xs text-muted-foreground">{job.crew}</div>
                </div>
                <div className="col-span-8 relative">
                  <div className="h-8 bg-secondary/20 rounded-md relative overflow-hidden">
                    <div 
                      className={`h-full rounded-md flex items-center px-2 text-xs font-medium transition-all duration-500 ${
                        job.status === 'in-progress' 
                          ? 'bg-warning shimmer-animation' 
                          : 'bg-primary/20'
                      }`}
                      style={{ width: '33%', marginLeft: '25%' }}
                    >
                      <Badge variant={getJobStatusColor(job.status)} className="text-xs">
                        {job.status === 'in-progress' ? (
                          <PlayCircle className="w-3 h-3 mr-1" />
                        ) : (
                          <Clock className="w-3 h-3 mr-1" />
                        )}
                        {job.status.replace('-', ' ')}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {job.startTime} - {job.duration}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Staff Allocation */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            Crew Availability
          </CardTitle>
          <CardDescription>Current shift manpower allocation</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-card p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Crew A</h3>
                <Badge variant="destructive">Busy</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <div>4 members • Deep Cleaning Specialists</div>
                <div>Currently: Bay-1 (T03)</div>
                <div>Available: 15:30</div>
              </div>
            </div>
            
            <div className="glass-card p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Crew B</h3>
                <Badge variant="warning">Scheduled</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <div>3 members • Standard Cleaning</div>
                <div>Next: Bay-3 (T07) at 15:00</div>
                <div>Available: Now</div>
              </div>
            </div>
            
            <div className="glass-card p-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="font-semibold">Crew C</h3>
                <Badge variant="success">Available</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                <div>5 members • Exterior & Detailing</div>
                <div>Next: Bay-2 (T12) at 17:00</div>
                <div>Available: Now</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default CleaningDetailing;