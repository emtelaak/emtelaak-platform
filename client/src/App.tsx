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
import AdminSettings from "./pages/AdminSettings";
import AdminKYCReview from "./pages/AdminKYCReview";
import AdminDashboard from "./pages/AdminDashboard";
import AdminRoles from "./pages/AdminRoles";
import AdminPermissions from "./pages/AdminPermissions";

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path="/properties" component={Properties} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/profile" component={Profile} />
      <Route path={"/contact"} component={Contact} />
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/roles" component={AdminRoles} />
      <Route path="/admin/permissions" component={AdminPermissions} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route path="/admin/kyc-review" component={AdminKYCReview} />
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
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
