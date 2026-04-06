import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";

// Pages
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import Cases from "./pages/Cases";
import NewCase from "./pages/NewCase";
import CaseDetail from "./pages/CaseDetail";
import Contacts from "./pages/Contacts";
import Tags from "./pages/Tags";
import Deadlines from "./pages/Deadlines";
import Agenda from "./pages/Agenda";
import ExternalCases from "./pages/ExternalCases";
import ExternalCaseDetail from "./pages/ExternalCaseDetail";
import PartnerLawyers from "./pages/PartnerLawyers";
import TeamMembers from "./pages/TeamMembers";
import Settings from "./pages/Settings";
import Settlements from "./pages/Settlements";
import SettlementDetail from "./pages/SettlementDetail";
import ServiceRequests from "./pages/ServiceRequests";
import ServiceRequestDetail from "./pages/ServiceRequestDetail";
import Crm from "./pages/Crm";
import NotFound from "./pages/NotFound";
import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />

            {/* Protected routes */}
            <Route
              path="/dashboard"
              element={
                <AppLayout>
                  <Dashboard />
                </AppLayout>
              }
            />
            <Route
              path="/cases"
              element={
                <AppLayout>
                  <Cases />
                </AppLayout>
              }
            />
            <Route
              path="/cases/new"
              element={
                <AppLayout>
                  <NewCase />
                </AppLayout>
              }
            />
            <Route
              path="/cases/:id"
              element={
                <AppLayout>
                  <CaseDetail />
                </AppLayout>
              }
            />
            <Route
              path="/contacts"
              element={
                <AppLayout>
                  <Contacts />
                </AppLayout>
              }
            />
            <Route
              path="/tags"
              element={
                <AppLayout>
                  <Tags />
                </AppLayout>
              }
            />
            <Route
              path="/deadlines"
              element={
                <AppLayout>
                  <Deadlines />
                </AppLayout>
              }
            />
            <Route
              path="/agenda"
              element={
                <AppLayout>
                  <Agenda />
                </AppLayout>
              }
            />
            <Route
              path="/external-cases"
              element={
                <AppLayout>
                  <ExternalCases />
                </AppLayout>
              }
            />
            <Route
              path="/external-cases/:id"
              element={
                <AppLayout>
                  <ExternalCaseDetail />
                </AppLayout>
              }
            />
            <Route
              path="/partner-lawyers"
              element={
                <AppLayout>
                  <PartnerLawyers />
                </AppLayout>
              }
            />
            <Route
              path="/team"
              element={
                <AppLayout>
                  <TeamMembers />
                </AppLayout>
              }
            />
            <Route
              path="/settings"
              element={
                <AppLayout>
                  <Settings />
                </AppLayout>
              }
            />
            <Route
              path="/settlements"
              element={
                <AppLayout>
                  <Settlements />
                </AppLayout>
              }
            />
            <Route
              path="/settlements/:id"
              element={
                <AppLayout>
                  <SettlementDetail />
                </AppLayout>
              }
            />
            <Route
              path="/service-requests"
              element={
                <AppLayout>
                  <ServiceRequests />
                </AppLayout>
              }
            />
            <Route
              path="/service-requests/:id"
              element={
                <AppLayout>
                  <ServiceRequestDetail />
                </AppLayout>
              }
            />


            <Route
              path="/crm"
              element={
                <AppLayout>
                  <Crm />
                </AppLayout>
              }
            />

            {/* Admin routes */}
            <Route path="/admin" element={<AdminLogin />} />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
