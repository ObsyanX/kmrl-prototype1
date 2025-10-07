import React, { useState } from 'react';
import { Database, FileText, Cloud, TrendingUp, Calendar, Activity, Upload } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const DataEntry: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResults, setSeedResults] = useState<any>(null);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string>('');
  const [isUploading, setIsUploading] = useState(false);

  // Calendar Event Form State
  const [eventForm, setEventForm] = useState({
    event_date: '',
    event_name: '',
    event_type: 'holiday' as 'holiday' | 'festival' | 'special_event' | 'maintenance_window',
    ridership_multiplier: 1.0,
    expected_demand_factor: 1.0,
    notes: '',
  });

  // Depot Congestion Form State
  const [congestionForm, setCongestionForm] = useState({
    depot_section: 'main',
    congestion_score: 5,
    active_shunting_moves: 0,
    available_tracks: 20,
    traffic_flow: 'moderate' as 'smooth' | 'moderate' | 'congested',
  });

  const handleSeedData = async (dataType: string) => {
    setIsSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('data-seeder', {
        body: { dataType, days: 90 },
      });

      if (error) throw error;

      setSeedResults(data);
      toast.success(`Successfully generated ${dataType} data`);
    } catch (error) {
      console.error('Data seeding error:', error);
      toast.error('Failed to seed data');
    } finally {
      setIsSeeding(false);
    }
  };

  const handleAddCalendarEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('calendar_events').insert([{
        ...eventForm,
        fleet_adjustment_required: eventForm.ridership_multiplier > 1.2,
      }]);

      if (error) throw error;

      toast.success('Calendar event added successfully');
      setEventForm({
        event_date: '',
        event_name: '',
        event_type: 'holiday',
        ridership_multiplier: 1.0,
        expected_demand_factor: 1.0,
        notes: '',
      });
    } catch (error) {
      console.error('Error adding event:', error);
      toast.error('Failed to add calendar event');
    }
  };

  const handleAddCongestionData = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from('depot_congestion').insert([{
        ...congestionForm,
        timestamp: new Date().toISOString(),
        estimated_delay_minutes: congestionForm.congestion_score * 2,
        sensor_data: {
          track_occupancy: congestionForm.congestion_score / 10,
          manual_entry: true,
        },
      }]);

      if (error) throw error;

      toast.success('Congestion data added successfully');
      setCongestionForm({
        depot_section: 'main',
        congestion_score: 5,
        active_shunting_moves: 0,
        available_tracks: 20,
        traffic_flow: 'moderate',
      });
    } catch (error) {
      console.error('Error adding congestion data:', error);
      toast.error('Failed to add congestion data');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.name.endsWith('.csv')) {
        toast.error('Please upload a CSV file');
        return;
      }
      
      setCsvFile(file);
      
      // Read first 10 lines for preview
      const reader = new FileReader();
      reader.onload = (event) => {
        const text = event.target?.result as string;
        const lines = text.split('\n').slice(0, 10).join('\n');
        setCsvPreview(lines);
      };
      reader.readAsText(file);
    }
  };

  const handleCsvUpload = async () => {
    if (!csvFile) {
      toast.error('Please select a CSV file');
      return;
    }

    setIsUploading(true);
    try {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const csvContent = event.target?.result as string;
        
        const { data, error } = await supabase.functions.invoke('csv-importer', {
          body: { csvContent }
        });

        if (error) throw error;

        setSeedResults(data);
        toast.success(`Successfully uploaded CSV: ${data.results.trainsetsCreated} trainsets created`);
        setCsvFile(null);
        setCsvPreview('');
      };
      reader.readAsText(csvFile);
    } catch (error) {
      console.error('CSV upload error:', error);
      toast.error('Failed to upload CSV file');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-glow mb-2">Manual Data Entry & Seeding</h1>
        <p className="text-muted-foreground">
          Manage historical data, calendar events, and IoT sensor readings
        </p>
      </div>

      <Tabs defaultValue="csv" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="csv">CSV Upload</TabsTrigger>
          <TabsTrigger value="seed">Data Seeding</TabsTrigger>
          <TabsTrigger value="calendar">Calendar Events</TabsTrigger>
          <TabsTrigger value="iot">IoT Sensors</TabsTrigger>
        </TabsList>

        <TabsContent value="csv" className="space-y-4">
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-glow flex items-center gap-2">
                <Upload className="w-5 h-5" />
                Bulk CSV Upload
              </CardTitle>
              <CardDescription>
                Upload trainset data from CSV file with format: TrainID,Fitness_Rolling,Fitness_Signal,Fitness_Telecom,JobCard_Open,Mileage_km,Branding_Contract,Branding_Hours_Current,Branding_Hours_Required,Cleaning_Hours_Req,Home_Bay
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="csv-file">Select CSV File</Label>
                <Input
                  id="csv-file"
                  type="file"
                  accept=".csv"
                  onChange={handleFileChange}
                  className="cursor-pointer"
                />
                <p className="text-xs text-muted-foreground">
                  Required columns: TrainID, Fitness_Rolling, Fitness_Signal, Fitness_Telecom, JobCard_Open, Mileage_km, Branding_Contract, Branding_Hours_Current, Branding_Hours_Required, Cleaning_Hours_Req, Home_Bay
                </p>
              </div>

              {csvPreview && (
                <Card className="bg-background/50">
                  <CardHeader>
                    <CardTitle className="text-sm">CSV Preview (First 10 lines)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs overflow-auto whitespace-pre-wrap font-mono">
                      {csvPreview}
                    </pre>
                  </CardContent>
                </Card>
              )}

              <Button
                onClick={handleCsvUpload}
                disabled={!csvFile || isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <Database className="w-4 h-4 mr-2 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    Upload CSV
                  </>
                )}
              </Button>

              {seedResults && (
                <Card className="bg-background/50">
                  <CardHeader>
                    <CardTitle className="text-sm">Upload Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(seedResults, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="seed" className="space-y-4">
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-glow flex items-center gap-2">
                <Database className="w-5 h-5" />
                Generate Historical Data
              </CardTitle>
              <CardDescription>
                Create 90 days of mock data for AI/ML model training
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <Button
                  onClick={() => handleSeedData('weather')}
                  disabled={isSeeding}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <Cloud className="w-6 h-6" />
                  <span>Weather Data</span>
                  <span className="text-xs opacity-70">90 days history</span>
                </Button>

                <Button
                  onClick={() => handleSeedData('calendar')}
                  disabled={isSeeding}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <Calendar className="w-6 h-6" />
                  <span>Calendar Events</span>
                  <span className="text-xs opacity-70">Holidays & festivals</span>
                </Button>

                <Button
                  onClick={() => handleSeedData('outcomes')}
                  disabled={isSeeding}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <TrendingUp className="w-6 h-6" />
                  <span>Operation Outcomes</span>
                  <span className="text-xs opacity-70">Historical results</span>
                </Button>

                <Button
                  onClick={() => handleSeedData('performance')}
                  disabled={isSeeding}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <Activity className="w-6 h-6" />
                  <span>Performance Metrics</span>
                  <span className="text-xs opacity-70">99.5% target tracking</span>
                </Button>

                <Button
                  onClick={() => handleSeedData('congestion')}
                  disabled={isSeeding}
                  className="h-24 flex flex-col items-center justify-center gap-2"
                >
                  <Database className="w-6 h-6" />
                  <span>Depot Congestion</span>
                  <span className="text-xs opacity-70">Hourly patterns</span>
                </Button>

                <Button
                  onClick={() => handleSeedData('all')}
                  disabled={isSeeding}
                  variant="default"
                  className="h-24 flex flex-col items-center justify-center gap-2 bg-primary"
                >
                  <Database className="w-6 h-6" />
                  <span>Seed All Data</span>
                  <span className="text-xs opacity-70">Complete dataset</span>
                </Button>
              </div>

              {seedResults && (
                <Card className="bg-background/50">
                  <CardHeader>
                    <CardTitle className="text-sm">Generation Results</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <pre className="text-xs overflow-auto">
                      {JSON.stringify(seedResults, null, 2)}
                    </pre>
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="calendar" className="space-y-4">
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-glow flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                Add Calendar Event
              </CardTitle>
              <CardDescription>
                Manually add holidays, festivals, and special events for demand forecasting
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCalendarEvent} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="event_date">Event Date</Label>
                    <Input
                      id="event_date"
                      type="date"
                      value={eventForm.event_date}
                      onChange={(e) => setEventForm({ ...eventForm, event_date: e.target.value })}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event_name">Event Name</Label>
                    <Input
                      id="event_name"
                      value={eventForm.event_name}
                      onChange={(e) => setEventForm({ ...eventForm, event_name: e.target.value })}
                      placeholder="e.g., Diwali, Independence Day"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="event_type">Event Type</Label>
                    <Select
                      value={eventForm.event_type}
                      onValueChange={(value: any) => setEventForm({ ...eventForm, event_type: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="holiday">Holiday</SelectItem>
                        <SelectItem value="festival">Festival</SelectItem>
                        <SelectItem value="special_event">Special Event</SelectItem>
                        <SelectItem value="maintenance_window">Maintenance Window</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ridership_multiplier">Ridership Multiplier</Label>
                    <Input
                      id="ridership_multiplier"
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="2.0"
                      value={eventForm.ridership_multiplier}
                      onChange={(e) => setEventForm({ ...eventForm, ridership_multiplier: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="demand_factor">Expected Demand Factor</Label>
                    <Input
                      id="demand_factor"
                      type="number"
                      step="0.1"
                      min="0.5"
                      max="2.0"
                      value={eventForm.expected_demand_factor}
                      onChange={(e) => setEventForm({ ...eventForm, expected_demand_factor: parseFloat(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      id="notes"
                      value={eventForm.notes}
                      onChange={(e) => setEventForm({ ...eventForm, notes: e.target.value })}
                      placeholder="Additional notes about the event..."
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Add Calendar Event
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="iot" className="space-y-4">
          <Card className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-glow flex items-center gap-2">
                <Activity className="w-5 h-5" />
                Manual IoT Sensor Entry
              </CardTitle>
              <CardDescription>
                Record depot congestion and traffic flow data (until IoT integration)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleAddCongestionData} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="depot_section">Depot Section</Label>
                    <Select
                      value={congestionForm.depot_section}
                      onValueChange={(value) => setCongestionForm({ ...congestionForm, depot_section: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="main">Main Section</SelectItem>
                        <SelectItem value="north">North Section</SelectItem>
                        <SelectItem value="south">South Section</SelectItem>
                        <SelectItem value="inspection">Inspection Bay</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="congestion_score">Congestion Score (1-10)</Label>
                    <Input
                      id="congestion_score"
                      type="number"
                      min="1"
                      max="10"
                      value={congestionForm.congestion_score}
                      onChange={(e) => setCongestionForm({ ...congestionForm, congestion_score: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="shunting_moves">Active Shunting Moves</Label>
                    <Input
                      id="shunting_moves"
                      type="number"
                      min="0"
                      value={congestionForm.active_shunting_moves}
                      onChange={(e) => setCongestionForm({ ...congestionForm, active_shunting_moves: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="available_tracks">Available Tracks</Label>
                    <Input
                      id="available_tracks"
                      type="number"
                      min="0"
                      max="20"
                      value={congestionForm.available_tracks}
                      onChange={(e) => setCongestionForm({ ...congestionForm, available_tracks: parseInt(e.target.value) })}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="traffic_flow">Traffic Flow</Label>
                    <Select
                      value={congestionForm.traffic_flow}
                      onValueChange={(value: any) => setCongestionForm({ ...congestionForm, traffic_flow: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="smooth">Smooth</SelectItem>
                        <SelectItem value="moderate">Moderate</SelectItem>
                        <SelectItem value="congested">Congested</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button type="submit" className="w-full">
                  Record Congestion Data
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DataEntry;
