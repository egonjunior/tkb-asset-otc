import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { AdminProtectedRoute } from "./components/AdminProtectedRoute";

// Lazy-loaded pages
const Index = lazy(() => import("./pages/Index"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Landing = lazy(() => import("./pages/Landing"));
const PremiumLanding = lazy(() => import("./pages/PremiumLanding"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const TradingOrderPage = lazy(() => import("./pages/TradingOrderPage"));
const OrderDetails = lazy(() => import("./pages/OrderDetails"));
const Documents = lazy(() => import("./pages/Documents"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminOrderDetails = lazy(() => import("./pages/admin/AdminOrderDetails"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));
const AdminUserDetails = lazy(() => import("./pages/admin/AdminUserDetails"));
const AdminPricing = lazy(() => import("./pages/admin/AdminPricing"));
const AdminDocuments = lazy(() => import("./pages/admin/AdminDocuments"));
const AdminPartners = lazy(() => import("./pages/admin/AdminPartners"));
const AdminSupport = lazy(() => import("./pages/admin/AdminSupport"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminPartnersB2B = lazy(() => import("./pages/admin/AdminPartnersB2B"));
const Partner = lazy(() => import("./pages/Partner"));
const PartnerB2B = lazy(() => import("./pages/PartnerB2B"));
const PartnerDashboard = lazy(() => import("./pages/PartnerDashboard"));
const PartnerClients = lazy(() => import("./pages/PartnerClients"));
const PartnerPricing = lazy(() => import("./pages/PartnerPricing"));
const Support = lazy(() => import("./pages/Support"));
const QuotePage = lazy(() => import("./pages/QuotePage"));
const Settings = lazy(() => import("./pages/Settings"));
const Analytics = lazy(() => import("./pages/Analytics"));
const Empresas = lazy(() => import("./pages/Empresas"));
const AdminOfflineClients = lazy(() => import("./pages/admin/AdminOfflineClients"));
const AdminOfflineClientDetails = lazy(() => import("./pages/admin/AdminOfflineClientDetails"));
const OtcQuote = lazy(() => import("./pages/OtcQuote"));
const AdminOtcClients = lazy(() => import("./pages/admin/AdminOtcClients"));
const AdminPLDCompliance = lazy(() => import("./pages/admin/AdminPLDCompliance"));
const AdminOkxOperations = lazy(() => import("./pages/admin/AdminOkxOperations"));
const AdminOperationalNotes = lazy(() => import("./pages/admin/AdminOperationalNotes"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Blog = lazy(() => import("./pages/Blog"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const AdminBlog = lazy(() => import("./pages/admin/AdminBlog"));
const AdminMarketing = lazy(() => import("./pages/admin/AdminMarketing"));
const AdminNotifications = lazy(() => import("./pages/admin/AdminNotifications"));
const Notificacoes = lazy(() => import("./pages/Notificacoes"));

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen bg-black flex flex-col items-center justify-center p-8">
    <div className="w-16 h-16 relative">
      <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
      <div className="absolute inset-0 border-r-2 border-[#00D4FF]/20 rounded-full"></div>
    </div>
    <div className="mt-8">
      <h2 className="text-sm font-brand tracking-widest text-white uppercase animate-pulse">TKB Asset</h2>
      <p className="text-[10px] text-white/20 font-mono text-center uppercase tracking-[0.2em] mt-2">Loading Core Modules...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/home" element={<PremiumLanding />} />
                <Route path="/premium" element={<PremiumLanding />} />
                <Route path="/old-home" element={<Landing />} />
                <Route path="/empresas" element={<Empresas />} />
                <Route path="/cotacao" element={<QuotePage />} />
                <Route path="/blog" element={<Blog />} />
                <Route path="/blog/:slug" element={<BlogPost />} />
                <Route path="/notificacoes" element={<ProtectedRoute><Notificacoes /></ProtectedRoute>} />
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
                <Route path="/analytics" element={
                  <ProtectedRoute>
                    <Analytics />
                  </ProtectedRoute>
                } />
                <Route path="/parceiro" element={
                  <ProtectedRoute>
                    <Partner />
                  </ProtectedRoute>
                } />
                <Route path="/partner" element={<Partner />} />
                <Route path="/partner/b2b" element={<PartnerB2B />} />
                <Route path="/partner-b2b" element={<PartnerB2B />} />
                <Route path="/partner/b2b-otc" element={<ProtectedRoute><PartnerDashboard /></ProtectedRoute>} />
                <Route path="/partner/dashboard" element={<ProtectedRoute><PartnerDashboard /></ProtectedRoute>} />
                <Route path="/partner/clients" element={<ProtectedRoute><PartnerClients /></ProtectedRoute>} />
                <Route path="/partner/financial" element={<ProtectedRoute><PartnerPricing /></ProtectedRoute>} />
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
                <Route path="/admin/pricing" element={<AdminProtectedRoute><AdminPricing /></AdminProtectedRoute>} />
                <Route path="/admin/offline-clients" element={<AdminProtectedRoute><AdminOfflineClients /></AdminProtectedRoute>} />
                <Route path="/admin/offline-clients/:clientId" element={<AdminProtectedRoute><AdminOfflineClientDetails /></AdminProtectedRoute>} />
                <Route path="/admin/otc-clients" element={<AdminProtectedRoute><AdminOtcClients /></AdminProtectedRoute>} />
                <Route path="/admin/pld-compliance" element={<AdminProtectedRoute><AdminPLDCompliance /></AdminProtectedRoute>} />
                <Route path="/admin/okx-operations" element={<AdminProtectedRoute><AdminOkxOperations /></AdminProtectedRoute>} />
                <Route path="/admin/operational-notes" element={<AdminProtectedRoute><AdminOperationalNotes /></AdminProtectedRoute>} />
                <Route path="/admin/blog" element={<AdminProtectedRoute><AdminBlog /></AdminProtectedRoute>} />
                <Route path="/admin/marketing" element={<AdminProtectedRoute><AdminMarketing /></AdminProtectedRoute>} />
                <Route path="/admin/notifications" element={<AdminProtectedRoute><AdminNotifications /></AdminProtectedRoute>} />
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="/:slug" element={<OtcQuote />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
