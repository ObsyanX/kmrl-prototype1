import React from 'react';
import { HelpCircle, Phone, Mail, MessageCircle, Book, Video, FileText, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Support: React.FC = () => {
  const resources = [
    {
      title: 'User Guides',
      description: 'Comprehensive documentation for all features',
      icon: Book,
      items: [
        'Getting Started with AGAMI',
        'Induction Planning Guide',
        'Algorithm Configuration Manual',
        'Reporting & Analytics Guide'
      ]
    },
    {
      title: 'Video Tutorials',
      description: 'Step-by-step video walkthroughs',
      icon: Video,
      items: [
        'Daily Operations Workflow',
        'Optimization Engine Overview',
        'Data Entry Best Practices',
        'Advanced Features Tutorial'
      ]
    },
    {
      title: 'FAQs',
      description: 'Answers to common questions',
      icon: HelpCircle,
      items: [
        'How to approve induction plans?',
        'Understanding accuracy metrics',
        'Troubleshooting common issues',
        'Interpreting AI recommendations'
      ]
    }
  ];

  const contactOptions = [
    {
      title: 'Email Support',
      description: 'agami-support@kmrl.kerala.gov.in',
      icon: Mail,
      action: 'mailto:agami-support@kmrl.kerala.gov.in'
    },
    {
      title: 'Phone Support',
      description: '+91-484-2801234',
      icon: Phone,
      action: 'tel:+914842801234'
    },
    {
      title: 'Live Chat',
      description: 'Available 6:00 AM - 10:00 PM IST',
      icon: MessageCircle,
      action: '#'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-cockpit p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-glow mb-2">Help & Support Center</h1>
        <p className="text-muted-foreground">Get assistance and technical support</p>
      </div>

      {/* Contact Options */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {contactOptions.map((option, idx) => {
          const Icon = option.icon;
          return (
            <Card key={idx} className="glass-card border-primary/20">
              <CardHeader>
                <CardTitle className="text-glow flex items-center gap-2">
                  <Icon className="w-5 h-5" />
                  {option.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-3">{option.description}</p>
                <Button asChild className="w-full">
                  <a href={option.action}>Contact Now</a>
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Resources */}
      {resources.map((resource, idx) => {
        const Icon = resource.icon;
        return (
          <Card key={idx} className="glass-card border-primary/20">
            <CardHeader>
              <CardTitle className="text-glow flex items-center gap-2">
                <Icon className="w-5 h-5" />
                {resource.title}
              </CardTitle>
              <CardDescription>{resource.description}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {resource.items.map((item, itemIdx) => (
                  <div
                    key={itemIdx}
                    className="flex items-center justify-between p-3 rounded-lg bg-background/50 hover:bg-background/80 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span className="text-sm">{item}</span>
                    </div>
                    <ExternalLink className="w-4 h-4 text-muted-foreground" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        );
      })}

      {/* System Status */}
      <Card className="glass-card border-primary/20">
        <CardHeader>
          <CardTitle className="text-glow">System Status</CardTitle>
          <CardDescription>Current operational status</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded bg-background/50">
              <span>Optimization Engine</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-green-500">Operational</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-background/50">
              <span>Database Services</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-green-500">Operational</span>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 rounded bg-background/50">
              <span>AI Models</span>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                <span className="text-sm text-green-500">Operational</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Support;