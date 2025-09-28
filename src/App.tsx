import React, { useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Dashboard from "./components/Dashboard";
import InductionPlan from "./pages/InductionPlan";
import FleetStatus from "./pages/FleetStatus";
import Simulator from "./pages/Simulator";
import FitnessCertificates from "./pages/FitnessCertificates";
import Maintenance from "./pages/Maintenance";
import BrandingSLA from "./pages/BrandingSLA";
import Performance from "./pages/Performance";
import StaffAvailability from "./pages/StaffAvailability";
import Incidents from "./pages/Incidents";
import AlgorithmRules from "./pages/AlgorithmRules";
import DataSources from "./pages/DataSources";
import UserManagement from "./pages/UserManagement";
import Feedback from "./pages/Feedback";
import Support from "./pages/Support";
import AuditTrail from "./pages/AuditTrail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userRole, setUserRole] = useState<string>('operator');

  const handleLogin = (credentials: { username: string; password: string; role: string }) => {
    // In a real application, this would validate against a backend
    console.log('Login attempt:', credentials);
    setUserRole(credentials.role);
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('operator');
  };

  if (!isAuthenticated) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <LoginPage onLogin={handleLogin} />
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="min-h-screen bg-background flex flex-col">
            <Navbar userRole={userRole} onLogout={handleLogout} />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/induction-plan" element={<InductionPlan />} />
                <Route path="/simulator" element={<Simulator />} />
                <Route path="/fleet-status" element={<FleetStatus />} />
                <Route path="/fitness-certificates" element={<FitnessCertificates />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/branding-sla" element={<BrandingSLA />} />
                <Route path="/performance" element={<Performance />} />
                <Route path="/staff-availability" element={<StaffAvailability />} />
                <Route path="/incidents" element={<Incidents />} />
                <Route path="/algorithm-rules" element={<AlgorithmRules />} />
                <Route path="/data-sources" element={<DataSources />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/support" element={<Support />} />
                <Route path="/audit-trail" element={<AuditTrail />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </main>
            <Footer />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
