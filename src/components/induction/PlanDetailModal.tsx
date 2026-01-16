import React, { useState } from 'react';
import { InductionPlan } from '@/services/agamiService';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Train, Clock, AlertTriangle, CheckCircle, Brain, Lock, 
  FileText, History, Settings, Play, Pause, X, Shield 
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface PlanDetailModalProps {
  plan: InductionPlan | null;
  isOpen: boolean;
  onClose: () => void;
  explanation?: any;
  isLoadingExplanation?: boolean;
  onApprove?: (planId: string, notes?: string) => void;
  onOverride?: (planId: string, newValues: Partial<InductionPlan>, reason: string) => void;
  onStart?: (planId: string) => void;
  onComplete?: (planId: string) => void;
  onExplain?: (type: 'decision' | 'constraint' | 'risk' | 'override_impact') => void;
}

export const PlanDetailModal: React.FC<PlanDetailModalProps> = ({
  plan,
  isOpen,
  onClose,
  explanation,
  isLoadingExplanation,
  onApprove,
  onOverride,
  onStart,
  onComplete,
  onExplain
}) => {
  const [notes, setNotes] = useState('');
  const [overrideReason, setOverrideReason] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  if (!plan) return null;

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'in_progress': return <Play className="w-4 h-4 text-blue-500" />;
      case 'delayed': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
      case 'cancelled': return <X className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-primary" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'destructive';
      case 'high': return 'default';
      case 'low': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Train className="w-6 h-6 text-primary" />
              <div>
                <DialogTitle className="text-xl">
                  {plan.trainsets?.name || plan.trainset_id?.slice(0, 8)}
                </DialogTitle>
                <DialogDescription>
                  Induction Plan for {format(new Date(plan.plan_date), 'MMMM d, yyyy')}
                </DialogDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getStatusIcon(plan.status)}
              <Badge variant={getPriorityColor(plan.priority) as any}>
                {plan.priority}
              </Badge>
              {plan.locked && (
                <Badge variant="outline" className="border-yellow-500 text-yellow-500">
                  <Lock className="w-3 h-3 mr-1" />
                  Locked
                </Badge>
              )}
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="constraints">Constraints</TabsTrigger>
            <TabsTrigger value="explain">AI Explain</TabsTrigger>
            <TabsTrigger value="actions">Actions</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[400px] mt-4">
            <TabsContent value="overview" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Schedule
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Scheduled Start:</span>
                      <span className="font-medium">
                        {format(new Date(plan.scheduled_start_time), 'HH:mm')}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Scheduled End:</span>
                      <span className="font-medium">
                        {format(new Date(plan.scheduled_end_time), 'HH:mm')}
                      </span>
                    </div>
                    {plan.actual_start_time && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Actual Start:</span>
                        <span className="font-medium text-blue-500">
                          {format(new Date(plan.actual_start_time), 'HH:mm')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Platform:</span>
                      <span className="font-medium">
                        {plan.stabling_positions?.bay_name || 'TBA'}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="w-4 h-4" />
                      AI Analysis
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence:</span>
                      <span className={cn(
                        "font-medium",
                        (plan.ai_confidence || 0) > 0.85 ? 'text-green-500' : 
                        (plan.ai_confidence || 0) > 0.7 ? 'text-yellow-500' : 'text-red-500'
                      )}>
                        {((plan.ai_confidence || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Risk Score:</span>
                      <span className={cn(
                        "font-medium",
                        plan.risk_score < 0.3 ? 'text-green-500' : 
                        plan.risk_score < 0.6 ? 'text-yellow-500' : 'text-red-500'
                      )}>
                        {(plan.risk_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Safety Status:</span>
                      <Badge 
                        variant={plan.safety_clearance_status === 'approved' ? 'default' : 'secondary'}
                        className="text-xs"
                      >
                        {plan.safety_clearance_status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {plan.ai_reasoning && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">AI Reasoning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">{plan.ai_reasoning}</p>
                  </CardContent>
                </Card>
              )}

              {plan.blocking_issues?.length > 0 && (
                <Card className="border-red-500/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2 text-red-500">
                      <AlertTriangle className="w-4 h-4" />
                      Blocking Issues
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="text-sm space-y-1">
                      {plan.blocking_issues.map((issue, idx) => (
                        <li key={idx} className="text-red-400">• {issue}</li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {plan.assigned_crew?.length > 0 && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Assigned Crew</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-wrap gap-2">
                      {plan.assigned_crew.map((crew, idx) => (
                        <Badge key={idx} variant="outline">{crew}</Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="constraints" className="space-y-4">
              {plan.constraint_violations?.length > 0 ? (
                plan.constraint_violations.map((violation: any, idx: number) => (
                  <Card key={idx} className={cn(
                    "border-l-4",
                    violation.satisfied ? 'border-l-green-500' : 'border-l-red-500'
                  )}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">{violation.ruleName}</span>
                        <Badge variant={violation.satisfied ? 'outline' : 'destructive'}>
                          {violation.satisfied ? 'Satisfied' : `Penalty: ${violation.penalty}`}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{violation.details}</p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Shield className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>All constraints satisfied</p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="explain" className="space-y-4">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="outline" 
                  onClick={() => onExplain?.('decision')}
                  disabled={isLoadingExplanation}
                >
                  <Brain className="w-4 h-4 mr-2" />
                  Explain Decision
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onExplain?.('constraint')}
                  disabled={isLoadingExplanation}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Analyze Constraints
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onExplain?.('risk')}
                  disabled={isLoadingExplanation}
                >
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  Risk Assessment
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => onExplain?.('override_impact')}
                  disabled={isLoadingExplanation}
                >
                  <History className="w-4 h-4 mr-2" />
                  Override Impact
                </Button>
              </div>

              {isLoadingExplanation && (
                <div className="text-center py-8">
                  <Brain className="w-8 h-8 mx-auto mb-2 animate-pulse text-primary" />
                  <p className="text-muted-foreground">Generating AI explanation...</p>
                </div>
              )}

              {explanation && !isLoadingExplanation && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Brain className="w-4 h-4 text-primary" />
                      AI Explanation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      <p className="whitespace-pre-wrap">{explanation.explanation}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="actions" className="space-y-4">
              {!plan.locked && plan.status === 'planned' && (
                <>
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-green-500" />
                        Approve Plan
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Approving will lock this plan and mark it ready for execution.
                      </p>
                      <div className="space-y-2">
                        <Label>Approval Notes (optional)</Label>
                        <Textarea
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Add any notes for the operations team..."
                          rows={2}
                        />
                      </div>
                      <Button 
                        className="w-full"
                        onClick={() => onApprove?.(plan.id, notes)}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve & Lock Plan
                      </Button>
                    </CardContent>
                  </Card>

                  <Card className="border-orange-500/50">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2 text-orange-500">
                        <History className="w-4 h-4" />
                        Override AI Decision
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <p className="text-sm text-muted-foreground">
                        Override requires a reason and will be logged for audit.
                      </p>
                      <div className="space-y-2">
                        <Label>Override Reason (required)</Label>
                        <Textarea
                          value={overrideReason}
                          onChange={(e) => setOverrideReason(e.target.value)}
                          placeholder="Explain why you're overriding the AI recommendation..."
                          rows={3}
                        />
                      </div>
                      <Button 
                        variant="outline"
                        className="w-full border-orange-500 text-orange-500 hover:bg-orange-500/10"
                        disabled={!overrideReason.trim()}
                        onClick={() => onOverride?.(plan.id, {}, overrideReason)}
                      >
                        <History className="w-4 h-4 mr-2" />
                        Submit Override
                      </Button>
                    </CardContent>
                  </Card>
                </>
              )}

              {plan.locked && plan.status === 'planned' && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Play className="w-4 h-4 text-blue-500" />
                      Start Induction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Begin the induction process for this trainset.
                    </p>
                    <Button 
                      className="w-full"
                      onClick={() => onStart?.(plan.id)}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Start Induction
                    </Button>
                  </CardContent>
                </Card>
              )}

              {plan.status === 'in_progress' && (
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      Complete Induction
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">
                      Mark this induction as completed.
                    </p>
                    <Button 
                      className="w-full bg-green-600 hover:bg-green-700"
                      onClick={() => onComplete?.(plan.id)}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Mark Complete
                    </Button>
                  </CardContent>
                </Card>
              )}

              {plan.status === 'completed' && (
                <div className="text-center py-8 text-green-500">
                  <CheckCircle className="w-12 h-12 mx-auto mb-2" />
                  <p className="font-medium">Induction Completed</p>
                  {plan.actual_end_time && (
                    <p className="text-sm text-muted-foreground">
                      Completed at {format(new Date(plan.actual_end_time), 'HH:mm')}
                    </p>
                  )}
                </div>
              )}
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
