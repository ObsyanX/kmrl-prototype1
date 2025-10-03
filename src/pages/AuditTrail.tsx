import React, { useEffect, useState } from 'react';
import { Shield, Clock, User, Activity, Search } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

const AuditTrail: React.FC = () => {
  const { toast } = useToast();
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAuditLogs();
  }, []);

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('audit_log')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setAuditLogs(data || []);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      toast({
        title: "Error Loading Data",
        description: "Failed to fetch audit logs",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getActionColor = (action: string) => {
    switch (action.toLowerCase()) {
      case 'create':
      case 'insert': return 'bg-green-500';
      case 'update': return 'bg-blue-500';
      case 'delete': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredLogs = auditLogs.filter(log => 
    log.action?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.table_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    log.user_id?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-glow mb-2">Audit Trail</h1>
        <p className="text-muted-foreground">Track all system activities and user actions</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Events</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-glow">{auditLogs.length}</div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Creates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">
              {auditLogs.filter(log => log.action?.toLowerCase().includes('create') || log.action?.toLowerCase().includes('insert')).length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Updates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">
              {auditLogs.filter(log => log.action?.toLowerCase() === 'update').length}
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-primary/20">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Deletes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">
              {auditLogs.filter(log => log.action?.toLowerCase() === 'delete').length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow flex items-center gap-2">
            <Shield className="w-5 h-5" />
            System Audit Log
          </CardTitle>
          <CardDescription>Complete activity history and changes</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs by action, table, or user..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading audit logs...</div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchTerm ? 'No logs match your search' : 'No audit logs found'}
            </div>
          ) : (
            <div className="space-y-2">
              {filteredLogs.map((log) => (
                <div
                  key={log.id}
                  className="p-3 rounded-lg border border-primary/20 bg-background/30 hover:bg-background/50 transition-all"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3 flex-1">
                      <Activity className="w-4 h-4 text-primary mt-1" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge className={getActionColor(log.action)}>
                            {log.action}
                          </Badge>
                          <span className="text-sm font-medium">{log.table_name}</span>
                          {log.record_id && (
                            <span className="text-xs text-muted-foreground">ID: {log.record_id}</span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(log.created_at).toLocaleString()}
                          </div>
                          {log.user_id && (
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3" />
                              {log.user_id.substring(0, 8)}...
                            </div>
                          )}
                          {log.ip_address && (
                            <div>IP: {log.ip_address}</div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuditTrail;