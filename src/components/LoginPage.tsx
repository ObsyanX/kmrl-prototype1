import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EyeIcon, EyeOffIcon, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { loginSchema, accessRequestSchema, registrationSchema, type LoginFormData, type AccessRequestFormData, type RegistrationFormData } from "@/lib/validations";
import { useAuth } from "@/hooks/useAuth";

interface LoginPageProps {
  onLogin: (role: string) => void;
}

const LoginPage = ({ onLogin }: LoginPageProps) => {
  const [showPassword, setShowPassword] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const { signIn, signUp, loading } = useAuth();

  // Login form
  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  // Access request form
  const accessForm = useForm<AccessRequestFormData>({
    resolver: zodResolver(accessRequestSchema),
    defaultValues: {
      full_name: "",
      employee_id: "",
      department: "",
      email: "",
      justification: "",
    },
  });

  // Registration form
  const registrationForm = useForm<RegistrationFormData>({
    resolver: zodResolver(registrationSchema),
    defaultValues: {
      email: "",
      password: "",
      confirm_password: "",
      employee_id: "",
      full_name: "",
      department: "",
    },
  });

  const handleLogin = async (data: LoginFormData) => {
    const { error } = await signIn(data.email, data.password);
    if (!error) {
      onLogin("supervisor"); // Default role, will be determined by database
    }
  };

  const handleRegistration = async (data: RegistrationFormData) => {
    const { error } = await signUp(data.email, data.password, {
      employee_id: data.employee_id,
      full_name: data.full_name,
      department: data.department,
    });
    
    if (!error) {
      setActiveTab("login");
    }
  };

  const handleAccessRequest = (data: AccessRequestFormData) => {
    console.log("Access request submitted:", data);
    // This would typically send to an admin for approval
    accessForm.reset();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold text-white">KMRL AI Platform</h1>
          <p className="text-blue-200">Train Induction Planning & Scheduling</p>
          
          {/* System Status */}
          <div className="flex items-center justify-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-green-300">All Systems Online</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-3 h-3 text-blue-300" />
              <span className="text-blue-300">Real-time Data</span>
            </div>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="login">Secure Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
            <TabsTrigger value="access">Request Access</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white">Secure Login</CardTitle>
                <CardDescription className="text-gray-300">
                  Enter your KMRL credentials to access the platform
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...loginForm}>
                  <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
                    <FormField
                      control={loginForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">KMRL Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="your.name@kmrl.org"
                              className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={loginForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Password</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                {...field}
                                type={showPassword ? "text" : "password"}
                                placeholder="Enter your password"
                                className="bg-white/10 border-white/20 text-white placeholder-gray-400 pr-10"
                              />
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent text-gray-400 hover:text-white"
                                onClick={() => setShowPassword(!showPassword)}
                              >
                                {showPassword ? (
                                  <EyeOffIcon className="h-4 w-4" />
                                ) : (
                                  <EyeIcon className="h-4 w-4" />
                                )}
                              </Button>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-3"
                      disabled={loading}
                    >
                      {loading ? "Signing in..." : "Access KMRL AI Platform"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="register">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white">Register Account</CardTitle>
                <CardDescription className="text-gray-300">
                  Create a new KMRL account (requires admin approval)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...registrationForm}>
                  <form onSubmit={registrationForm.handleSubmit(handleRegistration)} className="space-y-4">
                    <FormField
                      control={registrationForm.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Full Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter your full name"
                              className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registrationForm.control}
                      name="employee_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Employee ID</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="KMRL123456"
                              className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registrationForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Department</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                <SelectValue placeholder="Select your department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="operations">Operations</SelectItem>
                              <SelectItem value="rolling-stock">Rolling-Stock</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                              <SelectItem value="telecom">Telecom</SelectItem>
                              <SelectItem value="signalling">Signalling</SelectItem>
                              <SelectItem value="it">Information Technology</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registrationForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">KMRL Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="your.name@kmrl.org"
                              className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registrationForm.control}
                      name="password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Create a strong password"
                              className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={registrationForm.control}
                      name="confirm_password"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Confirm Password</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="password"
                              placeholder="Confirm your password"
                              className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 text-white font-semibold py-3"
                      disabled={loading}
                    >
                      {loading ? "Creating Account..." : "Create Account"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="access">
            <Card>
              <CardHeader className="text-center">
                <CardTitle className="text-2xl font-bold text-white">Request Access</CardTitle>
                <CardDescription className="text-gray-300">
                  Submit a request for platform access approval
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Form {...accessForm}>
                  <form onSubmit={accessForm.handleSubmit(handleAccessRequest)} className="space-y-4">
                    <FormField
                      control={accessForm.control}
                      name="full_name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Full Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Enter your full name"
                              className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accessForm.control}
                      name="employee_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Employee ID</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="KMRL123456"
                              className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accessForm.control}
                      name="department"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Department</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger className="bg-white/10 border-white/20 text-white">
                                <SelectValue placeholder="Select your department" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="operations">Operations</SelectItem>
                              <SelectItem value="rolling-stock">Rolling-Stock</SelectItem>
                              <SelectItem value="maintenance">Maintenance</SelectItem>
                              <SelectItem value="commercial">Commercial</SelectItem>
                              <SelectItem value="telecom">Telecom</SelectItem>
                              <SelectItem value="signalling">Signalling</SelectItem>
                              <SelectItem value="it">Information Technology</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accessForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">KMRL Email</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="email"
                              placeholder="your.name@kmrl.org"
                              className="bg-white/10 border-white/20 text-white placeholder-gray-400"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={accessForm.control}
                      name="justification"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white">Justification for Access</FormLabel>
                          <FormControl>
                            <Textarea
                              {...field}
                              placeholder="Please provide a detailed reason for needing access to this platform, including your role and responsibilities."
                              className="bg-white/10 border-white/20 text-white placeholder-gray-400 min-h-[100px]"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <AlertTriangle className="h-5 w-5 text-yellow-400 mt-0.5" />
                        <div>
                          <p className="text-yellow-200 font-medium text-sm">Access Request Protocol</p>
                          <p className="text-yellow-300 text-xs mt-1">
                            All access requests are reviewed by the system administrator. 
                            Please allow 2-3 business days for approval. You will be contacted 
                            via your official KMRL email once your request is processed.
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <Button 
                      type="submit"
                      className="w-full bg-gradient-to-r from-secondary to-secondary/80 hover:from-secondary/90 hover:to-secondary/70 text-white font-semibold py-3"
                      disabled={loading}
                    >
                      {loading ? "Submitting..." : "Submit Access Request"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="text-center text-sm text-gray-400">
          <p>© 2025 Kochi Metro Rail Limited. All Rights Reserved.</p>
          <p className="mt-1">Secure • Auditable • AI-Driven</p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;