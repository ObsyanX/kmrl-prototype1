import React, { useMemo } from 'react';
import { InductionPlan } from '@/services/agamiService';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Train, Clock, AlertTriangle, CheckCircle, Play, Lock, Brain, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GanttChartProps {
  plans: InductionPlan[];
  startHour?: number;
  endHour?: number;
  onPlanClick?: (plan: InductionPlan) => void;
  onStartInduction?: (planId: string) => void;
  onExplain?: (planId: string) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({
  plans,
  startHour = 5,
  endHour = 10,
  onPlanClick,
  onStartInduction,
  onExplain
}) => {
  const timeSlots = useMemo(() => {
    const slots: string[] = [];
    for (let hour = startHour; hour <= endHour; hour++) {
      for (let minute = 0; minute < 60; minute += 15) {
        if (hour === endHour && minute > 0) break;
        slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
      }
    }
    return slots;
  }, [startHour, endHour]);

  const totalMinutes = (endHour - startHour) * 60;

  const getPositionStyle = (plan: InductionPlan) => {
    const startTime = new Date(plan.scheduled_start_time);
    const endTime = new Date(plan.scheduled_end_time);
    
    const startMinutes = (startTime.getHours() - startHour) * 60 + startTime.getMinutes();
    const duration = (endTime.getTime() - startTime.getTime()) / (1000 * 60);
    
    const left = Math.max(0, (startMinutes / totalMinutes) * 100);
    const width = Math.min(100 - left, (duration / totalMinutes) * 100);

    return {
      left: `${left}%`,
      width: `${Math.max(width, 5)}%`
    };
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500/80';
      case 'in_progress': return 'bg-blue-500/80 animate-pulse';
      case 'delayed': return 'bg-orange-500/80';
      case 'cancelled': return 'bg-red-500/80';
      default: return 'bg-primary/70';
    }
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'critical': return 'border-l-4 border-l-red-500';
      case 'high': return 'border-l-4 border-l-orange-500';
      case 'low': return 'border-l-2 border-l-muted';
      default: return 'border-l-2 border-l-primary';
    }
  };

  // Group plans by platform
  const platformGroups = useMemo(() => {
    const groups = new Map<string, InductionPlan[]>();
    
    plans.forEach(plan => {
      const platformName = plan.stabling_positions?.bay_name || plan.platform_id || 'Unassigned';
      if (!groups.has(platformName)) {
        groups.set(platformName, []);
      }
      groups.get(platformName)!.push(plan);
    });

    return Array.from(groups.entries());
  }, [plans]);

  return (
    <TooltipProvider>
      <div className="w-full overflow-x-auto">
        {/* Time header */}
        <div className="flex sticky top-0 bg-background z-10 border-b border-border mb-2">
          <div className="w-32 shrink-0 p-2 font-medium text-sm text-muted-foreground">
            Platform
          </div>
          <div className="flex-1 relative">
            <div className="flex">
              {timeSlots.filter((_, i) => i % 4 === 0).map((slot, idx) => (
                <div
                  key={slot}
                  className="flex-1 text-xs text-muted-foreground text-center py-2 border-l border-border/50"
                >
                  {slot}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Platform rows */}
        <div className="space-y-1">
          {platformGroups.map(([platformName, platformPlans]) => (
            <div key={platformName} className="flex items-stretch min-h-[60px]">
              {/* Platform label */}
              <div className="w-32 shrink-0 p-2 flex items-center">
                <Badge variant="outline" className="text-xs">
                  {platformName}
                </Badge>
              </div>

              {/* Timeline */}
              <div className="flex-1 relative bg-muted/20 rounded-r-md">
                {/* Grid lines */}
                <div className="absolute inset-0 flex">
                  {timeSlots.filter((_, i) => i % 4 === 0).map((_, idx) => (
                    <div
                      key={idx}
                      className="flex-1 border-l border-border/30"
                    />
                  ))}
                </div>

                {/* Plan bars */}
                {platformPlans.map(plan => (
                  <Tooltip key={plan.id}>
                    <TooltipTrigger asChild>
                      <div
                        className={cn(
                          'absolute top-1 bottom-1 rounded-md cursor-pointer transition-all hover:scale-y-110 hover:z-10',
                          getStatusColor(plan.status),
                          getPriorityBorder(plan.priority),
                          plan.locked && 'ring-2 ring-yellow-500',
                          plan.blocking_issues?.length > 0 && 'ring-2 ring-red-500'
                        )}
                        style={getPositionStyle(plan)}
                        onClick={() => onPlanClick?.(plan)}
                      >
                        <div className="px-2 py-1 h-full flex items-center gap-1 overflow-hidden">
                          <Train className="w-3 h-3 shrink-0 text-white" />
                          <span className="text-xs font-medium text-white truncate">
                            {plan.trainsets?.name || plan.trainset_id?.slice(0, 8)}
                          </span>
                          {plan.locked && <Lock className="w-3 h-3 shrink-0 text-yellow-300" />}
                          {plan.blocking_issues?.length > 0 && (
                            <AlertTriangle className="w-3 h-3 shrink-0 text-red-300" />
                          )}
                        </div>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-sm">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-medium">
                            {plan.trainsets?.name || plan.trainset_id?.slice(0, 8)}
                          </span>
                          <Badge variant={plan.priority === 'critical' ? 'destructive' : 'secondary'}>
                            {plan.priority}
                          </Badge>
                        </div>
                        
                        <div className="text-xs space-y-1">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            <span>
                              {new Date(plan.scheduled_start_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {' → '}
                              {new Date(plan.scheduled_end_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          
                          <div className="flex items-center gap-1">
                            <Brain className="w-3 h-3" />
                            <span>AI Confidence: {((plan.ai_confidence || 0) * 100).toFixed(0)}%</span>
                          </div>

                          {plan.blocking_issues?.length > 0 && (
                            <div className="text-red-400">
                              <AlertTriangle className="w-3 h-3 inline mr-1" />
                              {plan.blocking_issues[0]}
                            </div>
                          )}
                        </div>

                        <div className="flex gap-1 pt-1">
                          {plan.status === 'planned' && !plan.locked && (
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 text-xs"
                              onClick={(e) => {
                                e.stopPropagation();
                                onStartInduction?.(plan.id);
                              }}
                            >
                              <Play className="w-3 h-3 mr-1" />
                              Start
                            </Button>
                          )}
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-6 text-xs"
                            onClick={(e) => {
                              e.stopPropagation();
                              onExplain?.(plan.id);
                            }}
                          >
                            <MessageSquare className="w-3 h-3 mr-1" />
                            Explain
                          </Button>
                        </div>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 mt-4 pt-4 border-t border-border text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-primary/70" />
            <span>Planned</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-blue-500/80" />
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-green-500/80" />
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-3 rounded bg-orange-500/80" />
            <span>Delayed</span>
          </div>
          <div className="flex items-center gap-1">
            <Lock className="w-3 h-3 text-yellow-500" />
            <span>Locked</span>
          </div>
          <div className="flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 text-red-500" />
            <span>Conflict</span>
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
};
