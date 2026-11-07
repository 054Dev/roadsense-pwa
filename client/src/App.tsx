import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Firmware from "./pages/Firmware";
import AlertsDashboard from "./pages/AlertsDashboard";
import ValidationHub from "./pages/ValidationHub";
import DataExport from "./pages/DataExport";
import Settings from "./pages/Settings";
import RoadSenseShell from "./components/RoadSenseShell";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      <Route path={"/"} component={Home} />
      <Route path={"/dashboard"} component={Dashboard} />
      <Route path={"/firmware"} component={Firmware} />
      <Route path={"/alerts"} component={AlertsDashboard} />
      <Route path={"/validate"} component={ValidationHub} />
      <Route path={"/export"} component={DataExport} />
      <Route path={"/settings"} component={Settings} />
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="dark"
      >
        <TooltipProvider>
          <Toaster />
          <RoadSenseShell>
            <Router />
          </RoadSenseShell>
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
