import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import Contact from "@/pages/Contact";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Properties from "./pages/Properties";
import Portfolio from "./pages/Portfolio";
import Profile from "./pages/Profile";
import FAQ from "./pages/FAQ";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import PropertyDetail from "./pages/PropertyDetail";
import KYCQuestionnaire from "./pages/KYCQuestionnaire";
import LeadCapture from "./pages/LeadCapture";
import Wallet from "./pages/Wallet";
import Menu from "./pages/Menu";
import Dashboard from "./pages/Dashboard";
import ResetPassword from "./pages/ResetPassword";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import VerifyEmail from "./pages/VerifyEmail";
import SessionManagement from "./pages/SessionManagement";
import ActivateAccount from "./pages/ActivateAccount";
import Workflows from "./pages/Workflows";
import { TermsAcceptanceModal } from "./components/TermsAcceptanceModal";
import PWAInstallPrompt from "./components/PWAInstallPrompt";

// Lazy load admin pages (only loaded when accessed)
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminPlatformSettings = lazy(() => import("./pages/AdminPlatformSettings"));
const AdminPropertyManagement = lazy(() => import("@/pages/AdminPropertyManagement"));
const AdminPropertyImages = lazy(() => import("@/pages/AdminPropertyImages"));
const AdminIncomeDistribution = lazy(() => import("@/pages/AdminIncomeDistribution"));
const AdminAnalytics = lazy(() => import("@/pages/AdminAnalytics"));
const AdminKYCReview = lazy(() => import("./pages/AdminKYCReview"));
const AdminRoles = lazy(() => import("./pages/AdminRoles"));
const AdminPermissions = lazy(() => import("./pages/AdminPermissions"));
const RoleManagement = lazy(() => import("./pages/admin/RoleManagement"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const EmailSettings = lazy(() => import("./pages/EmailSettings"));
const AdminWallet = lazy(() => import("./pages/AdminWallet"));
const AddProperty = lazy(() => import("./pages/AddProperty"));
const PropertyAnalytics = lazy(() => import("./pages/PropertyAnalytics"));
const Invoices = lazy(() => import("./pages/Invoices"));
const AdminInvoices = lazy(() => import("./pages/AdminInvoices"));
const AdminEmailTemplates = lazy(() => import("./pages/AdminEmailTemplates"));
const AdminLegalDocuments = lazy(() => import("./pages/AdminLegalDocuments"));
const FAQContentEditor = lazy(() => import("./pages/FAQContentEditor"));
const ContactContentEditor = lazy(() => import("./pages/ContactContentEditor"));
const TermsContentEditor = lazy(() => import("./pages/TermsContentEditor"));
const SystemMonitoring = lazy(() => import("./pages/admin/SystemMonitoring"));
const EmailTemplateEditor = lazy(() => import("./pages/EmailTemplateEditor"));
const HomepageContentEditor = lazy(() => import("@/pages/HomepageContentEditor"));
const ImageLibrary = lazy(() => import("@/pages/ImageLibrary"));
const AboutPageEditor = lazy(() => import("@/pages/AboutPageEditor"));
const AdminPropertyInterests = lazy(() => import("@/pages/AdminPropertyInterests"));

// Lazy load Fund Manager Portal pages (dedicated portal for fund managers/property developers)
const FundManagerDashboard = lazy(() => import("./pages/fundraiser/FundraiserDashboard"));
const FundManagerProperties = lazy(() => import("./pages/fundraiser/FundraiserProperties"));
const FundManagerPropertyNew = lazy(() => import("./pages/fundraiser/FundraiserPropertyNew"));
const FundManagerOfferings = lazy(() => import("./pages/fundraiser/FundraiserOfferings"));

// Legacy fundraiser pages (for backwards compatibility - will redirect to fund-manager)
const FundraiserDashboard = lazy(() => import("./pages/FundraiserDashboard"));
const FundraiserPropertyManagement = lazy(() => import("./pages/FundraiserPropertyManagement"));

// Lazy load CRM pages
const CRMDashboard = lazy(() => import("./pages/CRMDashboard"));
const CRMLeads = lazy(() => import("./pages/CRMLeads"));
const CRMCases = lazy(() => import("./pages/CRMCases"));

// Lazy load help desk system
const HelpDesk = lazy(() => import("./pages/HelpDesk"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));
const SecurityDashboard = lazy(() => import("@/pages/SecurityDashboard"));
const IPBlockingManagement = lazy(() => import("@/pages/IPBlockingManagement"));
const AdminUserManagement = lazy(() => import("@/pages/AdminUserManagement"));
const SecuritySettingsManagement = lazy(() => import("@/pages/SecuritySettingsManagement"));
const CustomFieldsManagement = lazy(() => import("@/pages/CustomFieldsManagement"));
const CustomFieldsTest = lazy(() => import("@/pages/CustomFieldsTest"));

// Lazy load offering pages
const CreateOffering = lazy(() => import("@/pages/CreateOffering"));
const OfferingsDashboard = lazy(() => import("@/pages/OfferingsDashboard"));
const OfferingDetail = lazy(() => import("@/pages/OfferingDetail"));
const FinancialProjectionForm = lazy(() => import("@/pages/FinancialProjectionForm"));
const FeeStructureEditor = lazy(() => import("@/pages/FeeStructureEditor"));
const OfferingDocuments = lazy(() => import("@/pages/OfferingDocuments"));
const AdminOfferingApproval = lazy(() => import("@/pages/AdminOfferingApproval"));
const OfferingApprovals = lazy(() => import("@/pages/OfferingApprovals"));
const RequestAccess = lazy(() => import("@/pages/RequestAccess"));
const AdminAccessRequests = lazy(() => import("@/pages/AdminAccessRequests"));
const AdminTerms = lazy(() => import("@/pages/AdminTerms"));

// Loading fallback component
const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
  </div>
);

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/forgot-password" component={ForgotPassword} />
      <Route path="/verify-email" component={VerifyEmail} />
      <Route path="/activate-account" component={ActivateAccount} />
      <Route path="/properties" component={Properties} />
      <Route path="/properties/create" component={AddProperty} />
      <Route path="/properties/:id" component={PropertyDetail} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/admin/wallet" component={AdminWallet} />
      <Route path="/admin/property-analytics" component={PropertyAnalytics} />
      <Route path="/invoices" component={Invoices} />
      <Route path="/admin/invoices" component={AdminInvoices} />
      <Route path="/admin/email-templates" component={AdminEmailTemplates} />
      <Route path="/admin/legal-documents" component={AdminLegalDocuments} />
      <Route path="/admin/custom-fields" component={CustomFieldsManagement} />
      <Route path="/test/custom-fields" component={CustomFieldsTest} />
      <Route path="/admin/content/faq" component={FAQContentEditor} />
      <Route path="/admin/content/contact" component={ContactContentEditor} />
      <Route path="/admin/content/terms" component={TermsContentEditor} />
      <Route path="/admin/email-template-editor" component={EmailTemplateEditor} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/menu" component={Menu} />
      <Route path="/profile" component={Profile} />
      <Route path="/sessions" component={SessionManagement} />
      <Route path="/workflows" component={Workflows} />
      <Route path="/kyc-questionnaire" component={KYCQuestionnaire} />
      <Route path="/reset-password" component={ResetPassword} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/faq"} component={FAQ} />
      <Route path={"/about"} component={About} />
      <Route path={"/how-it-works"} component={HowItWorks} />
      <Route path="/super-admin" component={SuperAdminDashboard} />
      <Route path="/admin">
        {() => {
          window.location.href = "/admin/dashboard";
          return null;
        }}
      </Route>
      <Route path="/admin/content/homepage" component={HomepageContentEditor} />
      <Route path="/admin/media-library" component={ImageLibrary} />
      <Route path="/admin/content/about" component={AboutPageEditor} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/monitoring" component={SystemMonitoring} />
      <Route path="/admin/roles" component={AdminRoles} />
      <Route path="/admin/role-management" component={RoleManagement} />
      <Route path="/admin/permissions" component={AdminPermissions} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/platform-settings" component={AdminPlatformSettings} />
      <Route path="/admin/property-management" component={AdminPropertyManagement} />
      <Route path="/admin/property-interests" component={AdminPropertyInterests} />
      <Route path="/admin/properties/:id/images" component={AdminPropertyImages} />
      <Route path="/admin/income-distribution" component={AdminIncomeDistribution} />
      <Route path="/admin/analytics" component={AdminAnalytics} />
      <Route path="/admin/access-requests" component={AdminAccessRequests} />
      <Route path="/admin/terms" component={AdminTerms} />
      <Route path="/request-access" component={RequestAccess} />
      
      {/* ============================================= */}
      {/* FUND MANAGER PORTAL - Dedicated Routes for Fund Managers */}
      {/* ============================================= */}
      
      {/* Main Fund Manager Portal Routes */}
      <Route path="/fund-manager" component={FundManagerDashboard} />
      <Route path="/fund-manager/properties" component={FundManagerProperties} />
      <Route path="/fund-manager/properties/new" component={FundManagerPropertyNew} />
      <Route path="/fund-manager/properties/:id/edit" component={AddProperty} />
      <Route path="/fund-manager/offerings" component={FundManagerOfferings} />
      
      {/* Legacy fundraiser routes - redirect to fund-manager portal */}
      <Route path="/fundraiser">
        {() => {
          window.location.href = "/fund-manager";
          return null;
        }}
      </Route>
      <Route path="/fundraiser/properties">
        {() => {
          window.location.href = "/fund-manager/properties";
          return null;
        }}
      </Route>
      <Route path="/fundraiser/properties/new">
        {() => {
          window.location.href = "/fund-manager/properties/new";
          return null;
        }}
      </Route>
      <Route path="/fundraiser/offerings">
        {() => {
          window.location.href = "/fund-manager/offerings";
          return null;
        }}
      </Route>
      <Route path="/fundraiser/dashboard">
        {() => {
          window.location.href = "/fund-manager";
          return null;
        }}
      </Route>
      <Route path="/fundraiser/property-management">
        {() => {
          window.location.href = "/fund-manager/properties";
          return null;
        }}
      </Route>
      {/* Legacy developer routes - redirect to fund-manager portal */}
      <Route path="/developer">
        {() => {
          window.location.href = "/fund-manager";
          return null;
        }}
      </Route>
      <Route path="/developer/properties">
        {() => {
          window.location.href = "/fund-manager/properties";
          return null;
        }}
      </Route>
      <Route path="/developer/properties/new">
        {() => {
          window.location.href = "/fund-manager/properties/new";
          return null;
        }}
      </Route>
      <Route path="/developer/offerings">
        {() => {
          window.location.href = "/fund-manager/offerings";
          return null;
        }}
      </Route>
      
      {/* ============================================= */}
      {/* OFFERINGS - Shared between Fundraiser & Admin */}
      {/* ============================================= */}
      <Route path="/offerings" component={OfferingsDashboard} />
      <Route path="/offerings/create" component={CreateOffering} />
      <Route path="/offerings/:id/edit" component={CreateOffering} />
      <Route path="/offerings/:id" component={OfferingDetail} />
      <Route path="/offerings/:id/financial-projections" component={FinancialProjectionForm} />
      <Route path="/offerings/:id/fee-structure" component={FeeStructureEditor} />
      <Route path="/offerings/:id/documents" component={OfferingDocuments} />
      
      {/* Admin Offering Approvals */}
      <Route path="/admin/offering-approvals" component={OfferingApprovals} />
      <Route path="/admin/email-settings" component={EmailSettings} />
      <Route path="/admin/kyc-review" component={AdminKYCReview} />
      <Route path="/admin/security" component={SecurityDashboard} />
      <Route path="/admin/ip-blocking" component={IPBlockingManagement} />
      <Route path="/admin/users" component={AdminUserManagement} />
      <Route path="/admin/security-settings" component={SecuritySettingsManagement} />
      
      {/* CRM Routes */}
      <Route path="/crm" component={CRMDashboard} />
      <Route path="/crm/leads" component={CRMLeads} />
      <Route path="/crm/cases" component={CRMCases} />
      <Route path="/lead-capture" component={LeadCapture} />
      
      {/* Help & Support Routes */}
      <Route path="/help" component={HelpDesk} />
      <Route path="/agent" component={AgentDashboard} />
      <Route path="/knowledge-base" component={KnowledgeBase} />
      
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Suspense fallback={<PageLoader />}>
            <Router />
            <TermsAcceptanceModal />
            <PWAInstallPrompt />
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
