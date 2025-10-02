import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileCheck, AlertTriangle, Calendar, Download, Loader2, RefreshCw, Shield, CheckCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useOptimization } from '@/hooks/useOptimization';

const FitnessCertificates: React.FC = () => {
  const [certificates, setCertificates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [validatingAll, setValidatingAll] = useState(false);
  const { validateCertificates } = useOptimization();

  useEffect(() => {
    fetchCertificates();
    
    // Subscribe to real-time certificate updates
    const channel = supabase
      .channel('fitness_certificates_changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'fitness_certificates' },
        () => {
          fetchCertificates();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('fitness_certificates')
        .select('*')
        .order('expiry_date', { ascending: true });

      if (error) throw error;

      const enrichedData = (data || []).map((cert: any) => {
        const expiryDate = new Date(cert.expiry_date);
        const today = new Date();
        const daysUntilExpiry = Math.ceil((expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        
        let calculatedStatus: 'valid' | 'expiring' | 'expired';
        if (daysUntilExpiry < 0) calculatedStatus = 'expired';
        else if (daysUntilExpiry <= 30) calculatedStatus = 'expiring';
        else calculatedStatus = 'valid';

        return {
          ...cert,
          daysUntilExpiry,
          calculatedStatus
        };
      });

      setCertificates(enrichedData);
    } catch (error) {
      console.error('Error fetching certificates:', error);
      toast.error('Failed to fetch fitness certificates');
    } finally {
      setLoading(false);
    }
  };

  const handleValidateAll = async () => {
    setValidatingAll(true);
    try {
      await validateCertificates('validate_all');
      toast.success('All certificates validated successfully');
      fetchCertificates();
    } catch (error) {
      console.error('Error validating certificates:', error);
      toast.error('Failed to validate certificates');
    } finally {
      setValidatingAll(false);
    }
  };

  const validCount = certificates.filter(c => c.calculatedStatus === 'valid').length;
  const expiringCount = certificates.filter(c => c.calculatedStatus === 'expiring').length;
  const expiredCount = certificates.filter(c => c.calculatedStatus === 'expired').length;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'valid': return 'success';
      case 'expiring': return 'warning';
      case 'expired': return 'destructive';
      default: return 'secondary';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-glow mb-2">Fitness Certificates</h1>
          <p className="text-muted-foreground">AI-powered certificate tracking and validation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchCertificates} disabled={loading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="neural" onClick={handleValidateAll} disabled={validatingAll}>
            {validatingAll ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validating...
              </>
            ) : (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Validate All
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Total Certificates", value: certificates.length, icon: Shield, color: "primary" },
          { title: "Valid", value: validCount, icon: CheckCircle, color: "success" },
          { title: "Expiring Soon", value: expiringCount, icon: AlertTriangle, color: "warning" },
          { title: "Expired", value: expiredCount, icon: AlertTriangle, color: "destructive" }
        ].map((stat, index) => (
          <Card key={index} className="glass-card border-primary/20 hologram-glow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-bold text-glow">{stat.value}</p>
                </div>
                <stat.icon className={`w-8 h-8 ${
                  stat.color === 'success' ? 'text-success' :
                  stat.color === 'warning' ? 'text-warning' :
                  stat.color === 'destructive' ? 'text-destructive' : 'text-primary'
                }`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow">Certificate Status</CardTitle>
          <CardDescription>Real-time tracking of all train fitness certificates</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <span className="ml-3 text-muted-foreground">Loading certificates...</span>
            </div>
          ) : certificates.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              No fitness certificates found
            </div>
          ) : (
            <div className="space-y-4">
              {certificates.map((cert) => (
                <div key={cert.id} className="glass-card p-4 rounded-lg border border-primary/10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <Shield className="w-6 h-6 text-primary" />
                      <div>
                        <h3 className="font-bold text-foreground">{cert.trainset_id}</h3>
                        <p className="text-sm text-muted-foreground">
                          Certificate: {cert.certificate_number || 'N/A'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          Expires: {new Date(cert.expiry_date).toLocaleDateString()} 
                          {cert.daysUntilExpiry > 0 ? (
                            <span className="ml-2">({cert.daysUntilExpiry} days left)</span>
                          ) : (
                            <span className="ml-2 text-destructive">(Expired {Math.abs(cert.daysUntilExpiry)} days ago)</span>
                          )}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={getStatusColor(cert.calculatedStatus) as any}>
                        {cert.calculatedStatus}
                      </Badge>
                      <Button variant="outline" size="sm">View Details</Button>
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

export default FitnessCertificates;
