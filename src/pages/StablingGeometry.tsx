import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Map, Route, Shuffle, CheckCircle, AlertTriangle, Clock } from 'lucide-react';

const StablingGeometry: React.FC = () => {
  const [isFinalizeModalOpen, setIsFinalizeModalOpen] = useState(false);
  const [operationalNote, setOperationalNote] = useState('');
  
  const trainPositions = {
    current: [
      { id: 'KRISHNA', track: 'A1', position: { x: 20, y: 30 }, status: 'parked' },
      { id: 'TAPTI', track: 'A2', position: { x: 20, y: 50 }, status: 'parked' },
      { id: 'NILA', track: 'B1', position: { x: 60, y: 30 }, status: 'cleaning' },
      { id: 'SARAYU', track: 'B2', position: { x: 60, y: 50 }, status: 'parked' },
      { id: 'ARUTH', track: 'C1', position: { x: 100, y: 30 }, status: 'maintenance' },
    ],
    proposed: [
      { id: 'KRISHNA', track: 'A1', position: { x: 20, y: 30 }, status: 'parked', moved: false },
      { id: 'TAPTI', track: 'B1', position: { x: 60, y: 30 }, status: 'parked', moved: true },
      { id: 'NILA', track: 'A2', position: { x: 20, y: 50 }, status: 'parked', moved: true },
      { id: 'SARAYU', track: 'C1', position: { x: 100, y: 30 }, status: 'parked', moved: true },
      { id: 'ARUTH', track: 'B2', position: { x: 60, y: 50 }, status: 'parked', moved: true },
    ]
  };

  const shuntingMoves = [
    { from: 'TAPTI', fromTrack: 'A2', toTrack: 'B1', complexity: 'Simple', duration: '5 min' },
    { from: 'NILA', fromTrack: 'B1', toTrack: 'A2', complexity: 'Medium', duration: '8 min' },
    { from: 'SARAYU', fromTrack: 'B2', toTrack: 'C1', complexity: 'Simple', duration: '6 min' },
    { from: 'ARUTH', fromTrack: 'C1', toTrack: 'B2', complexity: 'Complex', duration: '12 min' },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'parked': return 'success';
      case 'cleaning': return 'warning';
      case 'maintenance': return 'destructive';
      default: return 'secondary';
    }
  };

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case 'Simple': return 'success';
      case 'Medium': return 'warning';
      case 'Complex': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-glow">Nightly Stabling & Shunting Plan</h1>
          <p className="text-muted-foreground">Interactive workspace for planning final depot arrangement</p>
        </div>
        <Dialog open={isFinalizeModalOpen} onOpenChange={setIsFinalizeModalOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <CheckCircle className="w-4 h-4" />
              Finalize Stabling Plan
            </Button>
          </DialogTrigger>
          <DialogContent className="glass-card">
            <DialogHeader>
              <DialogTitle>Finalize Stabling Plan</DialogTitle>
              <DialogDescription>
                Lock in the stabling positions for tonight and record operational notes.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Operational Note for Morning Shift (Optional)</Label>
                <Textarea
                  value={operationalNote}
                  onChange={(e) => setOperationalNote(e.target.value)}
                  placeholder="Enter any special instructions or notes for the morning shift..."
                  className="min-h-[100px]"
                  maxLength={200}
                />
                <div className="text-xs text-muted-foreground">
                  {operationalNote.length}/200 characters
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <Button onClick={() => setIsFinalizeModalOpen(false)} className="flex-1">
                  Commit Plan
                </Button>
                <Button variant="outline" onClick={() => setIsFinalizeModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Planning Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Shunting Moves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{shuntingMoves.length}</div>
            <p className="text-xs text-muted-foreground">Required tonight</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Duration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">31 min</div>
            <p className="text-xs text-muted-foreground">Estimated time</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Complex Moves</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              {shuntingMoves.filter(m => m.complexity === 'Complex').length}
            </div>
            <p className="text-xs text-muted-foreground">Requiring caution</p>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Morning Delay</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">0 min</div>
            <p className="text-xs text-muted-foreground">Expected impact</p>
          </CardContent>
        </Card>
      </div>

      {/* 3D Depot Digital Twin */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="w-5 h-5" />
            Interactive Depot Digital Twin
          </CardTitle>
          <CardDescription>Full-screen 3D model with drag-and-drop planning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-96 bg-gradient-to-br from-primary/5 to-kmrl-green/5 rounded-lg border border-primary/20 relative overflow-hidden">
            {/* Simulated 3D depot layout */}
            <div className="absolute inset-4">
              <div className="grid grid-cols-3 gap-8 h-full">
                {/* Track A */}
                <div className="space-y-4">
                  <div className="text-xs font-medium text-muted-foreground text-center">Track A</div>
                  <div className="space-y-2">
                    <div className="h-12 bg-primary/10 rounded border-2 border-dashed border-primary/30 flex items-center justify-center">
                      <div className="text-xs font-medium text-primary">A1: T01</div>
                    </div>
                    <div className="h-12 bg-kmrl-green/10 rounded border-2 border-dashed border-kmrl-green/30 flex items-center justify-center">
                      <div className="text-xs font-medium text-kmrl-green">A2: T03 (Ghost)</div>
                    </div>
                  </div>
                </div>

                {/* Track B */}
                <div className="space-y-4">
                  <div className="text-xs font-medium text-muted-foreground text-center">Track B</div>
                  <div className="space-y-2">
                    <div className="h-12 bg-kmrl-green/10 rounded border-2 border-dashed border-kmrl-green/30 flex items-center justify-center">
                      <div className="text-xs font-medium text-kmrl-green">B1: T02 (Ghost)</div>
                    </div>
                    <div className="h-12 bg-kmrl-green/10 rounded border-2 border-dashed border-kmrl-green/30 flex items-center justify-center">
                      <div className="text-xs font-medium text-kmrl-green">B2: T05 (Ghost)</div>
                    </div>
                  </div>
                </div>

                {/* Track C */}
                <div className="space-y-4">
                  <div className="text-xs font-medium text-muted-foreground text-center">Track C</div>
                  <div className="space-y-2">
                    <div className="h-12 bg-kmrl-green/10 rounded border-2 border-dashed border-kmrl-green/30 flex items-center justify-center">
                      <div className="text-xs font-medium text-kmrl-green">C1: T04 (Ghost)</div>
                    </div>
                    <div className="h-12 bg-secondary/20 rounded border-2 border-dashed border-secondary/30 flex items-center justify-center">
                      <div className="text-xs font-medium text-muted-foreground">C2: Empty</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Control instructions */}
              <div className="absolute bottom-4 left-4 right-4 glass-card p-3">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-primary/20 rounded border border-primary/30"></div>
                      <span>Current Position</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-3 h-3 bg-kmrl-green/20 rounded border border-kmrl-green/30"></div>
                      <span>Proposed (Ghost)</span>
                    </div>
                  </div>
                  <div className="text-muted-foreground">
                    Drag trains to new positions • Path animation shows shunt routes
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Shunting Movement Plan */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="w-5 h-5" />
            Required Shunting Movements
          </CardTitle>
          <CardDescription>Calculated movement sequence with complexity analysis</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {shuntingMoves.map((move, index) => (
              <div key={index} className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 bg-primary/20 rounded-full flex items-center justify-center text-sm font-bold text-primary">
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold text-lg">{move.from}</div>
                      <div className="text-sm text-muted-foreground">
                        {move.fromTrack} → {move.toTrack}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <Badge variant={getComplexityColor(move.complexity)}>
                      {move.complexity}
                    </Badge>
                    <div className="text-right">
                      <div className="font-medium">{move.duration}</div>
                      <div className="text-xs text-muted-foreground">Duration</div>
                    </div>
                    {move.complexity === 'Complex' && (
                      <AlertTriangle className="w-5 h-5 text-warning" />
                    )}
                  </div>
                </div>
                
                {move.complexity === 'Complex' && (
                  <div className="mt-3 p-2 bg-warning/10 rounded border border-warning/20">
                    <div className="text-xs text-warning flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      Complex shunt requires additional safety protocols and coordination
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Current vs Proposed Comparison */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Current Layout</CardTitle>
            <CardDescription>Real-time positions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trainPositions.current.map((train) => (
                <div key={train.id} className="flex items-center justify-between p-3 glass-card">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold">{train.id}</div>
                    <Badge variant={getStatusColor(train.status)}>
                      {train.status}
                    </Badge>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Track {train.track}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle>Proposed Layout</CardTitle>
            <CardDescription>AI-optimized arrangement</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {trainPositions.proposed.map((train) => (
                <div key={train.id} className="flex items-center justify-between p-3 glass-card">
                  <div className="flex items-center gap-3">
                    <div className="font-semibold">{train.id}</div>
                    <Badge variant={getStatusColor(train.status)}>
                      {train.status}
                    </Badge>
                    {train.moved && (
                      <Shuffle className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Track {train.track}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StablingGeometry;
