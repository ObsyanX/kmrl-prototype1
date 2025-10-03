import React, { useEffect, useState } from 'react';
import { MapPin, Grid3x3, Layers, Navigation } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const StablingGeometry: React.FC = () => {
  const { toast } = useToast();
  const [positions, setPositions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStablingPositions();
  }, []);

  const fetchStablingPositions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('stabling_positions')
        .select('*')
        .order('depot_section', { ascending: true })
        .order('track_number', { ascending: true });

      if (error) throw error;
      setPositions(data || []);
    } catch (error) {
      console.error('Error fetching stabling positions:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to fetch stabling positions",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-500';
      case 'occupied': return 'bg-blue-500';
      case 'reserved': return 'bg-yellow-500';
      case 'maintenance': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const groupedPositions = positions.reduce((acc: any, pos) => {
    const section = pos.depot_section;
    if (!acc[section]) {
      acc[section] = [];
    }
    acc[section].push(pos);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-glow mb-2">Stabling Geometry Visualization</h1>
        <p className="text-muted-foreground">Interactive depot layout and trainset positioning</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Positions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-glow">{positions.length}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Available</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {positions.filter(p => p.status === 'available').length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Occupied</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              {positions.filter(p => p.status === 'occupied').length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Depot Sections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-glow">{Object.keys(groupedPositions).length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Depot Layout by Section */}
      {loading ? (
        <Card className="glass-card border-primary/20">
          <CardContent className="py-12 text-center text-muted-foreground">
            Loading depot layout...
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedPositions).map(([section, sectionPositions]: [string, any]) => (
          <Card key={section} className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-glow flex items-center gap-2">
                <Grid3x3 className="w-5 h-5" />
                {section}
              </CardTitle>
              <CardDescription>
                {sectionPositions.length} positions • {sectionPositions.filter((p: any) => p.status === 'available').length} available
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {sectionPositions.map((pos: any) => (
                  <div
                    key={pos.id}
                    className="relative p-4 rounded-lg border-2 border-primary/30 bg-background/50 hover:bg-background/80 transition-all cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      <Badge className={getStatusColor(pos.status)}>
                        {pos.status}
                      </Badge>
                    </div>
                    
                    <div className="font-bold text-glow mb-1">{pos.position_name}</div>
                    <div className="text-xs text-muted-foreground mb-2">Track {pos.track_number}</div>
                    
                    {pos.current_occupant && (
                      <div className="text-xs font-medium text-blue-400 mb-2">
                        {pos.current_occupant}
                      </div>
                    )}
                    
                    <div className="text-xs text-muted-foreground">
                      Type: {pos.position_type}
                    </div>
                    
                    {pos.facilities && pos.facilities.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {pos.facilities.slice(0, 2).map((facility: string, idx: number) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {facility}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {/* Legend */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow flex items-center gap-2">
            <Layers className="w-5 h-5" />
            Status Legend
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span className="text-sm">Available</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500"></div>
              <span className="text-sm">Occupied</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-yellow-500"></div>
              <span className="text-sm">Reserved</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span className="text-sm">Under Maintenance</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StablingGeometry;
