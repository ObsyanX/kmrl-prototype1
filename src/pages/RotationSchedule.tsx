import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Train, 
  Clock, 
  AlertTriangle, 
  TrendingDown, 
  MapPin,
  RefreshCw,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/hooks/useI18n';
import { format } from 'date-fns';

interface StationEvent {
  stationId: string;
  stationName: string;
  scheduledArrival: string;
  expectedArrival: string;
  delayMinutes: number;
  isCascading: boolean;
}

interface TrainSchedule {
  trainId: string;
  trainName: string;
  departureSlot: number;
  departureTime: string;
  events: StationEvent[];
  totalDelay: number;
  delayReason: string;
  mitigationStrategy: string;
}

// Metro stations for Kochi Metro
const STATIONS = [
  'Aluva', 'Pulinchodu', 'Companypady', 'Ambattukavu', 'Muttom',
  'Kalamassery', 'CUSAT', 'Pathadipalam', 'Edapally', 'Changampuzha Park',
  'Palarivattom', 'JLN Stadium', 'Kaloor', 'Town Hall', 'MG Road',
  'Maharajas College', 'Ernakulam South', 'Kadavanthra', 'Elamkulam',
  'Vyttila', 'Thaikoodam', 'Petta', 'Vadakkekotta', 'SN Junction'
];

const RotationSchedule: React.FC = () => {
  const { t } = useI18n();
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [schedules, setSchedules] = useState<TrainSchedule[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTrain, setSelectedTrain] = useState<string | null>(null);
  const [delaySummary, setDelaySummary] = useState({
    totalTrains: 0,
    onTime: 0,
    minorDelay: 0,
    majorDelay: 0,
    cascadingDelays: 0,
  });

  useEffect(() => {
    fetchScheduleData();
  }, [selectedDate]);

  const fetchScheduleData = async () => {
    setLoading(true);
    try {
      // Fetch daily schedule
      const { data: planData } = await supabase
        .from('daily_induction_plans')
        .select('*')
        .eq('plan_date', selectedDate)
        .maybeSingle();

      // Fetch train data
      const { data: trains } = await supabase
        .from('trainsets')
        .select('*')
        .in('status', ['operational', 'in_service', 'available'])
        .limit(15);

      // Generate simulated schedules with delay predictions
      const simulatedSchedules = generateSchedulesWithDelays(
        trains || [],
        planData?.service_schedule as any[] || []
      );

      setSchedules(simulatedSchedules);
      calculateDelaySummary(simulatedSchedules);
    } catch (error) {
      console.error('Error fetching schedule:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateSchedulesWithDelays = (trains: any[], serviceSchedule: any[]): TrainSchedule[] => {
    const baseTime = new Date(`${selectedDate}T05:30:00`);
    
    return trains.slice(0, 10).map((train, index) => {
      const slot = index + 1;
      const departureTime = new Date(baseTime.getTime() + index * 90 * 60000); // 90 min intervals
      
      // Generate station events with realistic delay patterns
      const events = generateStationEvents(departureTime, train);
      
      // Calculate total delay
      const totalDelay = events[events.length - 1]?.delayMinutes || 0;
      
      // Generate delay reason based on patterns
      const { reason, mitigation } = generateDelayAnalysis(events, train);

      return {
        trainId: train.train_id,
        trainName: train.name || train.train_id,
        departureSlot: slot,
        departureTime: format(departureTime, 'HH:mm'),
        events,
        totalDelay,
        delayReason: reason,
        mitigationStrategy: mitigation,
      };
    });
  };

  const generateStationEvents = (departureTime: Date, train: any): StationEvent[] => {
    const events: StationEvent[] = [];
    let cumulativeDelay = 0;
    let currentTime = new Date(departureTime);
    
    // Simulate delay probability based on train readiness
    const baseDelayProbability = train.operational_hours > 4000 ? 0.3 : 0.15;
    
    STATIONS.forEach((station, idx) => {
      const travelTime = 2.5; // Average 2.5 minutes between stations
      currentTime = new Date(currentTime.getTime() + travelTime * 60000);
      
      // Random delay with cascading effect
      let stationDelay = 0;
      if (Math.random() < baseDelayProbability) {
        stationDelay = Math.floor(Math.random() * 4) + 1; // 1-4 minutes
      }
      
      // Cascading delays increase probability
      if (cumulativeDelay > 5) {
        stationDelay += Math.random() < 0.4 ? 2 : 0;
      }
      
      cumulativeDelay += stationDelay;
      
      const scheduledArrival = new Date(departureTime.getTime() + (idx + 1) * travelTime * 60000);
      const expectedArrival = new Date(scheduledArrival.getTime() + cumulativeDelay * 60000);
      
      events.push({
        stationId: `ST${idx + 1}`,
        stationName: station,
        scheduledArrival: format(scheduledArrival, 'HH:mm'),
        expectedArrival: format(expectedArrival, 'HH:mm'),
        delayMinutes: cumulativeDelay,
        isCascading: cumulativeDelay > 5 && stationDelay > 0,
      });
    });
    
    return events;
  };

  const generateDelayAnalysis = (events: StationEvent[], train: any): { reason: string; mitigation: string } => {
    const maxDelay = Math.max(...events.map(e => e.delayMinutes));
    const cascadingCount = events.filter(e => e.isCascading).length;
    
    if (maxDelay === 0) {
      return { reason: 'On time', mitigation: 'No action required' };
    }
    
    if (cascadingCount > 3) {
      return {
        reason: 'Cascading delay pattern detected - initial delay propagating through stations',
        mitigation: 'Consider express skip pattern or reduced dwell time at intermediate stations',
      };
    }
    
    if (train.operational_hours > 4000) {
      return {
        reason: 'High operational hours contributing to performance degradation',
        mitigation: 'Schedule maintenance check and consider rotation with fresher trainset',
      };
    }
    
    if (maxDelay > 10) {
      return {
        reason: 'Significant delay - possible platform congestion or passenger boarding issues',
        mitigation: 'Dispatch additional platform staff and activate delay announcements',
      };
    }
    
    return {
      reason: 'Minor operational variance',
      mitigation: 'Monitor and adjust headway if needed',
    };
  };

  const calculateDelaySummary = (schedules: TrainSchedule[]) => {
    const summary = {
      totalTrains: schedules.length,
      onTime: schedules.filter(s => s.totalDelay === 0).length,
      minorDelay: schedules.filter(s => s.totalDelay > 0 && s.totalDelay <= 5).length,
      majorDelay: schedules.filter(s => s.totalDelay > 5).length,
      cascadingDelays: schedules.filter(s => s.events.some(e => e.isCascading)).length,
    };
    setDelaySummary(summary);
  };

  const getDelayBadge = (delay: number) => {
    if (delay === 0) return <Badge className="bg-green-500/20 text-green-400">On Time</Badge>;
    if (delay <= 3) return <Badge className="bg-yellow-500/20 text-yellow-400">+{delay}m</Badge>;
    if (delay <= 7) return <Badge className="bg-orange-500/20 text-orange-400">+{delay}m</Badge>;
    return <Badge className="bg-red-500/20 text-red-400">+{delay}m</Badge>;
  };

  return (
    <ResponsiveContainer>
      <PageHeader
        title={t('nav.rotationSchedule') || "Rotation Schedule"}
        description="Per-station delay predictions and cascading delay visualization"
      />

      {/* Date Selector and Refresh */}
      <div className="flex flex-wrap gap-4 mb-6">
        <div className="flex items-center gap-2">
          <label className="text-sm text-muted-foreground">Date:</label>
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 rounded-lg bg-card border border-primary/20 text-foreground"
          />
        </div>
        <Button onClick={fetchScheduleData} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh Predictions
        </Button>
      </div>

      {/* Delay Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Train className="w-5 h-5 text-primary" />
              <div>
                <p className="text-2xl font-bold">{delaySummary.totalTrains}</p>
                <p className="text-xs text-muted-foreground">Total Trains</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-green-400" />
              <div>
                <p className="text-2xl font-bold text-green-400">{delaySummary.onTime}</p>
                <p className="text-xs text-muted-foreground">On Time</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-yellow-400" />
              <div>
                <p className="text-2xl font-bold text-yellow-400">{delaySummary.minorDelay}</p>
                <p className="text-xs text-muted-foreground">Minor Delay</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <div>
                <p className="text-2xl font-bold text-orange-400">{delaySummary.majorDelay}</p>
                <p className="text-xs text-muted-foreground">Major Delay</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="glass-card">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ArrowRight className="w-5 h-5 text-red-400" />
              <div>
                <p className="text-2xl font-bold text-red-400">{delaySummary.cascadingDelays}</p>
                <p className="text-xs text-muted-foreground">Cascading</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Train Schedule List */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Train List */}
        <div className="lg:col-span-1 space-y-3">
          <h3 className="text-lg font-semibold mb-3">Service Schedule</h3>
          {schedules.map((schedule) => (
            <Card 
              key={schedule.trainId}
              className={`glass-card cursor-pointer transition-all hover:border-primary/40 ${
                selectedTrain === schedule.trainId ? 'border-primary ring-1 ring-primary/30' : ''
              }`}
              onClick={() => setSelectedTrain(schedule.trainId)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Train className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium">{schedule.trainName}</p>
                      <p className="text-sm text-muted-foreground">
                        Slot {schedule.departureSlot} • {schedule.departureTime}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getDelayBadge(schedule.totalDelay)}
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Station Timeline */}
        <div className="lg:col-span-2">
          <Card className="glass-card h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                {selectedTrain 
                  ? `Station Timeline - ${schedules.find(s => s.trainId === selectedTrain)?.trainName}`
                  : 'Select a train to view timeline'
                }
              </CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTrain ? (
                <div className="space-y-4">
                  {/* Delay Analysis */}
                  {(() => {
                    const schedule = schedules.find(s => s.trainId === selectedTrain);
                    if (!schedule) return null;
                    
                    return (
                      <div className="p-4 rounded-lg bg-card border border-primary/20 mb-4">
                        <div className="flex items-start gap-3">
                          <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                          <div>
                            <p className="font-medium text-sm">{schedule.delayReason}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                              <strong>Mitigation:</strong> {schedule.mitigationStrategy}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Station Events */}
                  <div className="max-h-[500px] overflow-y-auto pr-2 space-y-2">
                    {schedules
                      .find(s => s.trainId === selectedTrain)
                      ?.events.map((event, idx) => (
                        <div 
                          key={event.stationId}
                          className={`flex items-center gap-4 p-3 rounded-lg transition-colors ${
                            event.isCascading 
                              ? 'bg-red-500/10 border border-red-500/30' 
                              : event.delayMinutes > 5 
                                ? 'bg-orange-500/10 border border-orange-500/20'
                                : event.delayMinutes > 0
                                  ? 'bg-yellow-500/10 border border-yellow-500/20'
                                  : 'bg-card border border-primary/10'
                          }`}
                        >
                          {/* Station Index */}
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-medium">
                            {idx + 1}
                          </div>
                          
                          {/* Station Info */}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{event.stationName}</p>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <span>Scheduled: {event.scheduledArrival}</span>
                              {event.delayMinutes > 0 && (
                                <>
                                  <ArrowRight className="w-3 h-3" />
                                  <span className={event.delayMinutes > 5 ? 'text-orange-400' : 'text-yellow-400'}>
                                    Expected: {event.expectedArrival}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                          
                          {/* Delay Badge */}
                          <div className="flex items-center gap-2">
                            {event.isCascading && (
                              <Badge variant="destructive" className="text-xs">
                                Cascading
                              </Badge>
                            )}
                            {getDelayBadge(event.delayMinutes)}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                  <Train className="w-12 h-12 mb-4 opacity-50" />
                  <p>Select a train from the list to view its station timeline</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </ResponsiveContainer>
  );
};

export default RotationSchedule;
