import React, { useState } from 'react';
import { Eye, EyeOff, Shield, Zap, Brain, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import heroImage from '@/assets/hero-dashboard.jpg';

interface LoginPageProps {
  onLogin: (credentials: { username: string; password: string; role: string }) => void;
}

const LoginPage: React.FC<LoginPageProps> = ({ onLogin }) => {
  const [showPassword, setShowPassword] = useState(false);
  const [credentials, setCredentials] = useState({
    username: '',
    password: '',
    role: 'operator'
  });
  const [accessRequest, setAccessRequest] = useState({
    name: '',
    employeeId: '',
    department: '',
    requestedRole: 'operator',
    justification: ''
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin(credentials);
  };

  const handleAccessRequest = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle access request submission
    console.log('Access request submitted:', accessRequest);
  };

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Hero Image with Overlay */}
      <div className="absolute inset-0">
        <img 
          src={heroImage} 
          alt="KMRL Control Dashboard" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-background/95 via-background/80 to-background/90" />
        <div className="absolute inset-0 bg-gradient-neural opacity-20" />
      </div>

      {/* Floating Data Streams */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 bg-gradient-to-t from-transparent via-primary to-transparent opacity-60 data-stream"
            style={{
              left: `${15 + i * 15}%`,
              height: '100vh',
              animationDelay: `${i * 0.5}s`
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex items-center justify-center min-h-screen p-6">
        <div className="w-full max-w-md">
          
          {/* KMRL Header */}
          <div className="text-center mb-8 space-y-4">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="p-3 glass-card rounded-xl hologram-glow">
                <Brain className="w-8 h-8 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-glow">KMRL AI Platform</h1>
                <p className="text-sm text-muted-foreground">Train Induction Planning & Scheduling</p>
              </div>
            </div>
            
            <div className="glass-card p-4 rounded-lg">
              <div className="flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-success rounded-full animate-pulse" />
                  <span className="text-success">Systems Online</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-3 h-3 text-warning" />
                  <span className="text-warning">Real-time Data</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3 text-primary" />
                  <span className="text-primary">Secure Access</span>
                </div>
              </div>
            </div>
          </div>

          {/* Login/Access Request Tabs */}
          <Card className="glass-card border-primary/20 hologram-glow">
            <CardHeader className="pb-4">
              <CardTitle className="text-center text-glow">Digital Control Tower Access</CardTitle>
              <CardDescription className="text-center">
                Mission-critical authentication for operations supervisors
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2 glass mb-6">
                  <TabsTrigger value="login" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                    Secure Login
                  </TabsTrigger>
                  <TabsTrigger value="request" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                    Request Access
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-6">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="username" className="text-foreground">Username</Label>
                        <Input
                          id="username"
                          type="text"
                          placeholder="Enter your KMRL username"
                          value={credentials.username}
                          onChange={(e) => setCredentials({...credentials, username: e.target.value})}
                          className="glass-card border-primary/30 focus:border-primary mt-2"
                          required
                        />
                      </div>
                      
                      <div>
                        <Label htmlFor="password" className="text-foreground">Password</Label>
                        <div className="relative mt-2">
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            placeholder="Enter your secure password"
                            value={credentials.password}
                            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
                            className="glass-card border-primary/30 focus:border-primary pr-10"
                            required
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="role" className="text-foreground">Role</Label>
                        <select
                          id="role"
                          value={credentials.role}
                          onChange={(e) => setCredentials({...credentials, role: e.target.value})}
                          className="w-full mt-2 glass-card border border-primary/30 focus:border-primary rounded-md px-3 py-2 text-foreground bg-transparent"
                        >
                          <option value="operator" className="bg-background">Operations Supervisor</option>
                          <option value="admin" className="bg-background">System Administrator</option>
                          <option value="manager" className="bg-background">Operations Manager</option>
                          <option value="analyst" className="bg-background">Data Analyst</option>
                        </select>
                      </div>
                    </div>

                    <Button type="submit" className="w-full" variant="neural">
                      <Shield className="w-4 h-4 mr-2" />
                      Initialize Control Tower Access
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="request">
                  <form onSubmit={handleAccessRequest} className="space-y-4">
                    <div className="glass-card p-4 rounded-lg border border-warning/30 mb-4">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-warning mt-0.5" />
                        <div>
                          <h4 className="font-semibold text-warning">Access Request Protocol</h4>
                          <p className="text-sm text-muted-foreground mt-1">
                            All access requests require approval from the System Administrator and Operations Manager.
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Full Name</Label>
                        <Input
                          id="name"
                          value={accessRequest.name}
                          onChange={(e) => setAccessRequest({...accessRequest, name: e.target.value})}
                          className="glass-card border-primary/30 focus:border-primary mt-1"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="employeeId">Employee ID</Label>
                        <Input
                          id="employeeId"
                          value={accessRequest.employeeId}
                          onChange={(e) => setAccessRequest({...accessRequest, employeeId: e.target.value})}
                          className="glass-card border-primary/30 focus:border-primary mt-1"
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={accessRequest.department}
                        onChange={(e) => setAccessRequest({...accessRequest, department: e.target.value})}
                        className="glass-card border-primary/30 focus:border-primary mt-1"
                        placeholder="e.g., Operations, Maintenance, Safety"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="requestedRole">Requested Access Level</Label>
                      <select
                        id="requestedRole"
                        value={accessRequest.requestedRole}
                        onChange={(e) => setAccessRequest({...accessRequest, requestedRole: e.target.value})}
                        className="w-full mt-1 glass-card border border-primary/30 focus:border-primary rounded-md px-3 py-2 text-foreground bg-transparent"
                      >
                        <option value="operator" className="bg-background">Operations Supervisor</option>
                        <option value="analyst" className="bg-background">Data Analyst</option>
                        <option value="manager" className="bg-background">Operations Manager</option>
                        <option value="admin" className="bg-background">System Administrator</option>
                      </select>
                    </div>

                    <div>
                      <Label htmlFor="justification">Business Justification</Label>
                      <textarea
                        id="justification"
                        value={accessRequest.justification}
                        onChange={(e) => setAccessRequest({...accessRequest, justification: e.target.value})}
                        className="w-full mt-1 glass-card border border-primary/30 focus:border-primary rounded-md px-3 py-2 text-foreground bg-transparent h-20"
                        placeholder="Explain why you need access to this system..."
                        required
                      />
                    </div>

                    <Button type="submit" className="w-full" variant="cockpit">
                      Submit Access Request
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Footer Info */}
          <div className="text-center mt-6 text-xs text-muted-foreground">
            <p>© 2024 Kochi Metro Rail Limited. All rights reserved.</p>
            <p className="mt-1">Secure • Auditable • AI-Driven</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;