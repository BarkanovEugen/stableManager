import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/use-auth";
import LandingPage from "@/pages/landing";
import Dashboard from "@/pages/dashboard";
import LessonsPage from "@/pages/lessons";
import HorsesPage from "@/pages/horses";
import ClientsPage from "@/pages/clients";
import InstructorsPage from "@/pages/instructors";
import CertificatesPage from "@/pages/certificates";
import SubscriptionsPage from "@/pages/subscriptions";
import UsersPage from "@/pages/users";
import StatisticsPage from "@/pages/statistics";
import Sidebar from "@/components/layout/sidebar";
import Header from "@/components/layout/header";
import NotFound from "@/pages/not-found";

function AuthenticatedApp() {
  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Sidebar />
      <div className="flex-1 lg:ml-64">
        <Header />
        <main className="p-6">
          <Switch>
            <Route path="/dashboard" component={Dashboard} />
            <Route path="/lessons" component={LessonsPage} />
            <Route path="/horses" component={HorsesPage} />
            <Route path="/clients" component={ClientsPage} />
            <Route path="/instructors" component={InstructorsPage} />
            <Route path="/certificates" component={CertificatesPage} />
            <Route path="/subscriptions" component={SubscriptionsPage} />
            <Route path="/users" component={UsersPage} />
            <Route path="/statistics" component={StatisticsPage} />
            <Route component={NotFound} />
          </Switch>
        </main>
      </div>
    </div>
  );
}

function Router() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      {user && (
        <>
          <Route path="/dashboard" component={() => <AuthenticatedApp />} />
          <Route path="/lessons" component={() => <AuthenticatedApp />} />
          <Route path="/horses" component={() => <AuthenticatedApp />} />
          <Route path="/clients" component={() => <AuthenticatedApp />} />
          <Route path="/instructors" component={() => <AuthenticatedApp />} />
          <Route path="/certificates" component={() => <AuthenticatedApp />} />
          <Route path="/subscriptions" component={() => <AuthenticatedApp />} />
          <Route path="/users" component={() => <AuthenticatedApp />} />
          <Route path="/statistics" component={() => <AuthenticatedApp />} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
