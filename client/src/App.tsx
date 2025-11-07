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

// Lazy load admin pages (only loaded when accessed)
const AdminDashboard = lazy(() => import("./pages/AdminDashboard"));
const AdminSettings = lazy(() => import("./pages/AdminSettings"));
const AdminKYCReview = lazy(() => import("./pages/AdminKYCReview"));
const AdminRoles = lazy(() => import("./pages/AdminRoles"));
const AdminPermissions = lazy(() => import("./pages/AdminPermissions"));
const SuperAdminDashboard = lazy(() => import("./pages/SuperAdminDashboard"));
const EmailSettings = lazy(() => import("./pages/EmailSettings"));

// Lazy load CRM pages
const CRMDashboard = lazy(() => import("./pages/CRMDashboard"));
const CRMLeads = lazy(() => import("./pages/CRMLeads"));
const CRMCases = lazy(() => import("./pages/CRMCases"));

// Lazy load help desk system
const HelpDesk = lazy(() => import("./pages/HelpDesk"));
const AgentDashboard = lazy(() => import("./pages/AgentDashboard"));
const KnowledgeBase = lazy(() => import("./pages/KnowledgeBase"));

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
      <Route path="/properties" component={Properties} />
      <Route path="/properties/:id" component={PropertyDetail} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/wallet" component={Wallet} />
      <Route path="/menu" component={Menu} />
      <Route path="/profile" component={Profile} />
      <Route path="/kyc-questionnaire" component={KYCQuestionnaire} />
      <Route path={"/contact"} component={Contact} />
      <Route path={"/faq"} component={FAQ} />
      <Route path={"/about"} component={About} />
      <Route path={"/how-it-works"} component={HowItWorks} />
      <Route path="/super-admin" component={SuperAdminDashboard} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/roles" component={AdminRoles} />
      <Route path="/admin/permissions" component={AdminPermissions} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/email-settings" component={EmailSettings} />
      <Route path="/admin/kyc-review" component={AdminKYCReview} />
      <Route path="/crm" component={CRMDashboard} />
      <Route path="/crm/leads" component={CRMLeads} />
      <Route path="/crm/cases" component={CRMCases} />
      <Route path="/lead-capture" component={LeadCapture} />
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
          </Suspense>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
