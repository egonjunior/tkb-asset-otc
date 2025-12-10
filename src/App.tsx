import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import AdminLogin from "./pages/AdminLogin";
import Dashboard from "./pages/Dashboard";
import TradingOrderPage from "./pages/TradingOrderPage";
import OrderDetails from "./pages/OrderDetails";
import Documents from "./pages/Documents";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminOrderDetails from "./pages/admin/AdminOrderDetails";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminUserDetails from "./pages/admin/AdminUserDetails";
import AdminDocuments from "./pages/admin/AdminDocuments";
import AdminPartners from "./pages/admin/AdminPartners";
import AdminSupport from "./pages/admin/AdminSupport";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminPartnersB2B from "./pages/admin/AdminPartnersB2B";
import Partner from "./pages/Partner";
import PartnerB2B from "./pages/PartnerB2B";
import PartnerB2BOtc from "./pages/PartnerB2BOtc";
import Support from "./pages/Support";
import QuotePage from "./pages/QuotePage";
import Settings from "./pages/Settings";
import Empresas from "./pages/Empresas";
import AdminOfflineClients from "./pages/admin/AdminOfflineClients";
import AdminOfflineClientDetails from "./pages/admin/AdminOfflineClientDetails";
import OtcQuote from "./pages/OtcQuote";
import AdminOtcClients from "./pages/admin/AdminOtcClients";
import AdminPLDCompliance from "./pages/admin/AdminPLDCompliance";
import AdminOkxOperations from "./pages/admin/AdminOkxOperations";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/home" element={<Landing />} />
            <Route path="/empresas" element={<Empresas />} />
            <Route path="/cotacao" element={<QuotePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/order/new" element={
              <ProtectedRoute>
                <TradingOrderPage />
              </ProtectedRoute>
            } />
            <Route path="/order/:orderId" element={
              <ProtectedRoute>
                <OrderDetails />
              </ProtectedRoute>
            } />
            <Route path="/documents" element={
              <ProtectedRoute>
                <Documents />
              </ProtectedRoute>
            } />
            <Route path="/settings" element={
              <ProtectedRoute>
                <Settings />
              </ProtectedRoute>
            } />
            <Route path="/parceiro" element={
              <ProtectedRoute>
                <Partner />
              </ProtectedRoute>
            } />
            <Route path="/partner" element={<Partner />} />
            <Route path="/partner/b2b" element={<PartnerB2B />} />
            <Route path="/partner/b2b-otc" element={<ProtectedRoute><PartnerB2BOtc /></ProtectedRoute>} />
            <Route path="/suporte" element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
            <Route path="/admin/partners" element={<AdminProtectedRoute><AdminPartners /></AdminProtectedRoute>} />
            <Route path="/admin/partners-b2b" element={<AdminProtectedRoute><AdminPartnersB2B /></AdminProtectedRoute>} />
            <Route path="/admin/support" element={<AdminProtectedRoute><AdminSupport /></AdminProtectedRoute>} />
            <Route path="/admin/leads" element={<AdminProtectedRoute><AdminLeads /></AdminProtectedRoute>} />
            <Route path="/admin/documents" element={<AdminProtectedRoute><AdminDocuments /></AdminProtectedRoute>} />
            <Route path="/admin/order/:orderId" element={<AdminProtectedRoute><AdminOrderDetails /></AdminProtectedRoute>} />
            <Route path="/admin/users" element={<AdminProtectedRoute><AdminUsers /></AdminProtectedRoute>} />
            <Route path="/admin/users/:userId" element={<AdminProtectedRoute><AdminUserDetails /></AdminProtectedRoute>} />
            <Route path="/admin/offline-clients" element={<AdminProtectedRoute><AdminOfflineClients /></AdminProtectedRoute>} />
            <Route path="/admin/offline-clients/:clientId" element={<AdminProtectedRoute><AdminOfflineClientDetails /></AdminProtectedRoute>} />
            <Route path="/admin/otc-clients" element={<AdminProtectedRoute><AdminOtcClients /></AdminProtectedRoute>} />
            <Route path="/admin/pld-compliance" element={<AdminProtectedRoute><AdminPLDCompliance /></AdminProtectedRoute>} />
            <Route path="/admin/okx-operations" element={<AdminProtectedRoute><AdminOkxOperations /></AdminProtectedRoute>} />
            <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="/:slug" element={<OtcQuote />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
