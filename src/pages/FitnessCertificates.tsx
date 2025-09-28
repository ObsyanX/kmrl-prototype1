import React from 'react';
import { Shield, Calendar, AlertTriangle, CheckCircle, FileText } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const FitnessCertificates: React.FC = () => {
  const certificates = [
    { trainId: "KMX-101", issueDate: "2023-12-15", expiryDate: "2024-06-15", status: "valid", daysLeft: 45 },
    { trainId: "KMX-102", issueDate: "2023-10-22", expiryDate: "2024-08-22", status: "valid", daysLeft: 123 },
    { trainId: "KMX-103", issueDate: "2023-11-10", expiryDate: "2024-09-10", status: "valid", daysLeft: 142 },
    { trainId: "KMX-104", issueDate: "2023-08-28", expiryDate: "2024-05-28", status: "expiring", daysLeft: 27 },
    { trainId: "KMX-105", issueDate: "2023-12-12", expiryDate: "2024-11-12", status: "valid", daysLeft: 205 }
  ];

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-glow mb-2">Fitness Certificates</h1>
          <p className="text-muted-foreground">Track and manage train fitness certifications</p>
        </div>
        <Button variant="neural">
          <FileText className="w-4 h-4 mr-2" />
          Generate Report
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Total Certificates", value: "5", icon: Shield, color: "primary" },
          { title: "Valid", value: "4", icon: CheckCircle, color: "success" },
          { title: "Expiring Soon", value: "1", icon: AlertTriangle, color: "warning" },
          { title: "Expired", value: "0", icon: AlertTriangle, color: "destructive" }
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
          <CardDescription>Current status of all train fitness certificates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {certificates.map((cert, index) => (
              <div key={index} className="glass-card p-4 rounded-lg border border-primary/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Shield className="w-6 h-6 text-primary" />
                    <div>
                      <h3 className="font-bold text-foreground">{cert.trainId}</h3>
                      <p className="text-sm text-muted-foreground">
                        Expires: {cert.expiryDate} ({cert.daysLeft} days left)
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={cert.status === 'valid' ? 'success' : 'warning'}>
                      {cert.status}
                    </Badge>
                    <Button variant="outline" size="sm">View Details</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FitnessCertificates;