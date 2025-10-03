import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import { useAuth } from "@/hooks/useAuth";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Dashboard from "./components/Dashboard";
import InductionPlan from "./pages/InductionPlan";
import FleetStatus from "./pages/FleetStatus";
import Simulator from "./pages/Simulator";
import FitnessCertificates from "./pages/FitnessCertificates";
import Maintenance from "./pages/Maintenance";
import StaffAvailability from "./pages/StaffAvailability";
import BrandingSLA from "./pages/BrandingSLA";
import Performance from "./pages/Performance";
import MileageBalancing from "./pages/MileageBalancing";
import CleaningDetailing from "./pages/CleaningDetailing";
import StablingGeometry from "./pages/StablingGeometry";
import ReportsAnalytics from "./pages/ReportsAnalytics";
import JobCardStatus from "./pages/JobCardStatus";
import AlgorithmRules from "./pages/AlgorithmRules";
import DataSources from "./pages/DataSources";
import DataEntry from "./pages/DataEntry";
import UserManagement from "./pages/UserManagement";
import Feedback from "./pages/Feedback";
import Support from "./pages/Support";
import AuditTrail from "./pages/AuditTrail";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const { user, loading, signOut } = useAuth();

  const handleLogin = (role: string) => {
    // Authentication is handled by useAuth hook
  };

  const handleLogout = () => {
    signOut();
  };

  if (loading) {
    return (
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900 flex items-center justify-center">
            <div className="text-white text-xl">Loading...</div>
          </div>
        </TooltipProvider>
      </QueryClientProvider>
    );
  }

  if (!user) {
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
            <Navbar userRole="supervisor" onLogout={handleLogout} />
            <main className="flex-1">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/induction-plan" element={<InductionPlan />} />
                <Route path="/simulator" element={<Simulator />} />
                <Route path="/fleet-status" element={<FleetStatus />} />
                <Route path="/fitness-certificates" element={<FitnessCertificates />} />
                <Route path="/maintenance" element={<Maintenance />} />
                <Route path="/job-card-status" element={<JobCardStatus />} />
                <Route path="/branding-sla" element={<BrandingSLA />} />
                <Route path="/mileage-balancing" element={<MileageBalancing />} />
                <Route path="/cleaning-detailing" element={<CleaningDetailing />} />
                <Route path="/stabling-geometry" element={<StablingGeometry />} />
                <Route path="/staff-availability" element={<StaffAvailability />} />
                <Route path="/reports-analytics" element={<ReportsAnalytics />} />
                <Route path="/algorithm-rules" element={<AlgorithmRules />} />
                <Route path="/user-management" element={<UserManagement />} />
                <Route path="/feedback" element={<Feedback />} />
                <Route path="/support" element={<Support />} />
                <Route path="/data-sources" element={<DataSources />} />
                <Route path="/data-entry" element={<DataEntry />} />
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
