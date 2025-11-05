import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
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
import Partner from "./pages/Partner";
import Support from "./pages/Support";
import QuotePage from "./pages/QuotePage";
import Settings from "./pages/Settings";
import Empresas from "./pages/Empresas";

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
            <Route path="/suporte" element={
              <ProtectedRoute>
                <Support />
              </ProtectedRoute>
            } />
            <Route path="/admin/dashboard" element={<AdminDashboard />} />
            <Route path="/admin/partners" element={<AdminPartners />} />
            <Route path="/admin/support" element={<AdminSupport />} />
            <Route path="/admin/documents" element={<AdminDocuments />} />
            <Route path="/admin/order/:orderId" element={<AdminOrderDetails />} />
            <Route path="/admin/users" element={<AdminUsers />} />
            <Route path="/admin/users/:userId" element={<AdminUserDetails />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
