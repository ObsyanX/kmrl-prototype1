import React, { useState, useEffect, useCallback } from 'react';
import { ResponsiveContainer } from '@/components/layout/ResponsiveContainer';
import { PageHeader } from '@/components/layout/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { agamiService, ConstraintRule } from '@/services/agamiService';
import { toast } from 'sonner';
import { 
  Brain, Settings, Code, Zap, Shield, AlertTriangle, Save,
  Plus, Edit, Trash2, RefreshCw, Filter, Search, Clock,
  Train, Users, CloudSun, Gauge, Lock, BarChart3
} from 'lucide-react';
import { cn } from '@/lib/utils';

const AlgorithmRules: React.FC = () => {
  const [rules, setRules] = useState<ConstraintRule[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [editingRule, setEditingRule] = useState<ConstraintRule | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch rules on mount
  useEffect(() => {
    const fetchRules = async () => {
      try {
        setIsLoading(true);
        const data = await agamiService.getConstraintRules();
        setRules(data);
      } catch (error) {
        console.error('Error fetching rules:', error);
        toast.error('Failed to load constraint rules');
      } finally {
        setIsLoading(false);
      }
    };

    fetchRules();
  }, []);

  const handleUpdateRule = useCallback(async (id: string, updates: Partial<ConstraintRule>) => {
    try {
      await agamiService.updateConstraintRule(id, updates);
      setRules(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
      toast.success('Rule updated successfully');
    } catch (error) {
      console.error('Error updating rule:', error);
      toast.error('Failed to update rule');
    }
  }, []);

  const handleToggleRule = useCallback(async (rule: ConstraintRule) => {
    await handleUpdateRule(rule.id, { is_active: !rule.is_active });
  }, [handleUpdateRule]);

  const handleSaveEdit = useCallback(async () => {
    if (!editingRule) return;

    try {
      await agamiService.updateConstraintRule(editingRule.id, {
        rule_name: editingRule.rule_name,
        description: editingRule.description,
        weight: editingRule.weight,
        violation_penalty: editingRule.violation_penalty,
        parameters: editingRule.parameters
      });
      setRules(prev => prev.map(r => r.id === editingRule.id ? editingRule : r));
      setIsEditDialogOpen(false);
      setEditingRule(null);
      toast.success('Rule saved successfully');
    } catch (error) {
      console.error('Error saving rule:', error);
      toast.error('Failed to save rule');
    }
  }, [editingRule]);

  // Filter rules
  const filteredRules = rules.filter(rule => {
    const matchesSearch = rule.rule_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (rule.description?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = categoryFilter === 'all' || rule.rule_category === categoryFilter;
    const matchesType = typeFilter === 'all' || rule.rule_type === typeFilter;
    return matchesSearch && matchesCategory && matchesType;
  });

  // Group rules by category
  const categories = [...new Set(rules.map(r => r.rule_category))];

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'platform': return <Train className="w-4 h-4" />;
      case 'crew': return <Users className="w-4 h-4" />;
      case 'safety': return <Shield className="w-4 h-4" />;
      case 'timing': return <Clock className="w-4 h-4" />;
      case 'power': return <Zap className="w-4 h-4" />;
      default: return <Settings className="w-4 h-4" />;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'platform': return 'text-blue-500 bg-blue-500/10';
      case 'crew': return 'text-purple-500 bg-purple-500/10';
      case 'safety': return 'text-red-500 bg-red-500/10';
      case 'timing': return 'text-orange-500 bg-orange-500/10';
      case 'power': return 'text-yellow-500 bg-yellow-500/10';
      default: return 'text-primary bg-primary/10';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-cockpit">
      <ResponsiveContainer>
        <PageHeader
          title="Algorithm & Rules Engine"
          subtitle="Configure AI constraints, weights, and optimization parameters"
          icon={<Brain className="w-6 h-6 sm:w-8 sm:h-8" />}
        />

        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="glass-card border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Settings className="w-4 h-4 text-primary" />
                <span className="text-xs text-muted-foreground">Total Rules</span>
              </div>
              <p className="text-2xl font-bold text-glow mt-1">{rules.length}</p>
            </CardContent>
          </Card>

          <Card className="glass-card border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-green-500" />
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
              <p className="text-2xl font-bold text-green-500 mt-1">
                {rules.filter(r => r.is_active).length}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-red-500" />
                <span className="text-xs text-muted-foreground">Hard</span>
              </div>
              <p className="text-2xl font-bold text-red-500 mt-1">
                {rules.filter(r => r.rule_type === 'hard').length}
              </p>
            </CardContent>
          </Card>

          <Card className="glass-card border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Gauge className="w-4 h-4 text-yellow-500" />
                <span className="text-xs text-muted-foreground">Soft</span>
              </div>
              <p className="text-2xl font-bold text-yellow-500 mt-1">
                {rules.filter(r => r.rule_type === 'soft').length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="glass-card border-primary/20 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map(cat => (
                    <SelectItem key={cat} value={cat} className="capitalize">{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="hard">Hard</SelectItem>
                  <SelectItem value="soft">Soft</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Rules Tabs */}
        <Tabs defaultValue="grid" className="space-y-4">
          <TabsList className="w-full sm:w-auto grid grid-cols-2 sm:flex">
            <TabsTrigger value="grid">
              <BarChart3 className="w-4 h-4 mr-2" />
              Grid View
            </TabsTrigger>
            <TabsTrigger value="category">
              <Filter className="w-4 h-4 mr-2" />
              By Category
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grid">
            {isLoading ? (
              <div className="flex items-center justify-center py-16">
                <RefreshCw className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRules.map((rule) => (
                  <Card 
                    key={rule.id} 
                    className={cn(
                      "glass-card transition-all",
                      rule.is_active ? "border-primary/20" : "border-muted/20 opacity-60",
                      rule.rule_type === 'hard' ? "border-l-4 border-l-red-500" : "border-l-4 border-l-yellow-500"
                    )}
                  >
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={cn("p-2 rounded-lg", getCategoryColor(rule.rule_category))}>
                            {getCategoryIcon(rule.rule_category)}
                          </div>
                          <div>
                            <CardTitle className="text-sm">{rule.rule_name}</CardTitle>
                            <Badge variant="outline" className="text-xs capitalize mt-1">
                              {rule.rule_category}
                            </Badge>
                          </div>
                        </div>
                        <Switch
                          checked={rule.is_active}
                          onCheckedChange={() => handleToggleRule(rule)}
                        />
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {rule.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2">
                          {rule.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <span className="text-muted-foreground">Weight</span>
                          <span className="font-medium">{rule.weight}</span>
                        </div>
                        <div className="flex items-center justify-between p-2 bg-muted/30 rounded">
                          <span className="text-muted-foreground">Penalty</span>
                          <span className="font-medium">{rule.violation_penalty}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <Badge variant={rule.rule_type === 'hard' ? 'destructive' : 'secondary'}>
                          {rule.rule_type}
                        </Badge>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            setEditingRule(rule);
                            setIsEditDialogOpen(true);
                          }}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="category">
            <ScrollArea className="h-[600px]">
              <div className="space-y-6">
                {categories.map(category => {
                  const categoryRules = filteredRules.filter(r => r.rule_category === category);
                  if (categoryRules.length === 0) return null;

                  return (
                    <Card key={category} className="glass-card border-primary/20">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2 capitalize">
                          <div className={cn("p-2 rounded-lg", getCategoryColor(category))}>
                            {getCategoryIcon(category)}
                          </div>
                          {category} Rules
                          <Badge variant="outline" className="ml-auto">
                            {categoryRules.length}
                          </Badge>
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {categoryRules.map((rule) => (
                            <div 
                              key={rule.id}
                              className={cn(
                                "flex items-center justify-between p-3 rounded-lg bg-muted/20",
                                "border-l-4",
                                rule.rule_type === 'hard' ? "border-l-red-500" : "border-l-yellow-500",
                                !rule.is_active && "opacity-50"
                              )}
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-sm truncate">{rule.rule_name}</p>
                                  <Badge variant={rule.rule_type === 'hard' ? 'destructive' : 'secondary'} className="text-xs">
                                    {rule.rule_type}
                                  </Badge>
                                </div>
                                <p className="text-xs text-muted-foreground truncate mt-1">
                                  Weight: {rule.weight} | Penalty: {rule.violation_penalty}
                                </p>
                              </div>
                              <div className="flex items-center gap-2">
                                <Switch
                                  checked={rule.is_active}
                                  onCheckedChange={() => handleToggleRule(rule)}
                                />
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => {
                                    setEditingRule(rule);
                                    setIsEditDialogOpen(true);
                                  }}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Edit Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5 text-primary" />
                Edit Constraint Rule
              </DialogTitle>
              <DialogDescription>
                Modify rule parameters and weights
              </DialogDescription>
            </DialogHeader>

            {editingRule && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Rule Name</Label>
                  <Input
                    value={editingRule.rule_name}
                    onChange={(e) => setEditingRule({ ...editingRule, rule_name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Description</Label>
                  <Textarea
                    value={editingRule.description || ''}
                    onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <Label>Weight: {editingRule.weight}</Label>
                    <Slider
                      value={[editingRule.weight]}
                      onValueChange={([v]) => setEditingRule({ ...editingRule, weight: v })}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>

                  <div className="space-y-3">
                    <Label>Violation Penalty: {editingRule.violation_penalty}</Label>
                    <Slider
                      value={[editingRule.violation_penalty]}
                      onValueChange={([v]) => setEditingRule({ ...editingRule, violation_penalty: v })}
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <h4 className="text-sm font-medium mb-2 flex items-center gap-2">
                    <Code className="w-4 h-4" />
                    Rule Parameters
                  </h4>
                  <pre className="text-xs text-muted-foreground overflow-auto">
                    {JSON.stringify(editingRule.parameters, null, 2)}
                  </pre>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveEdit}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </ResponsiveContainer>
    </div>
  );
};

export default AlgorithmRules;
