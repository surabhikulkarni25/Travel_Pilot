import { Switch, Route, Redirect } from 'wouter';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TripProvider } from './contexts/TripContext';
import { Navbar } from './components/Navbar';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './views/LandingPage';
import { AuthenticatedHome } from './views/AuthenticatedHome';
import { PlanTripView } from './views/PlanTripView';
import { TripItineraryView } from './views/TripItineraryView';
import { TripDashboardView } from './views/TripDashboardView';
import { SurpriseMeView } from './views/SurpriseMeView';
import { SharedTripView } from './views/SharedTripView';
import { Compass, Sparkles } from 'lucide-react';

const queryClient = new QueryClient();

function RootRoute() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-[#EBF2F1] text-[#1D4E4F] flex items-center justify-center mb-3 animate-pulse">
          <Compass className="w-6 h-6 animate-spin" />
        </div>
        <p className="font-mono-meta text-xs uppercase text-[#576574]">Loading TravelPilot...</p>
      </div>
    );
  }

  if (user) {
    return <AuthenticatedHome />;
  }

  return <LandingPage />;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TripProvider>
          <div className="min-h-screen flex flex-col bg-[#FAF8F5] text-[#1A202C] selection:bg-[#EBF2F1] selection:text-[#1D4E4F]">
            {/* Main Application Header */}
            <Navbar />

            {/* Application View Routing */}
            <main className="flex-1">
              <Switch>
                {/* Root Route: Public Landing if logged out, Authenticated Home if logged in */}
                <Route path="/" component={RootRoute} />
                <Route path="/home">
                  {() => (
                    <ProtectedRoute>
                      <AuthenticatedHome />
                    </ProtectedRoute>
                  )}
                </Route>

                {/* Protected Planning & Feature Routes */}
                <Route path="/plan">
                  {() => (
                    <ProtectedRoute>
                      <PlanTripView />
                    </ProtectedRoute>
                  )}
                </Route>

                <Route path="/surprise">
                  {() => (
                    <ProtectedRoute>
                      <SurpriseMeView />
                    </ProtectedRoute>
                  )}
                </Route>

                <Route path="/trip/:tripId">
                  {() => (
                    <ProtectedRoute>
                      <TripItineraryView />
                    </ProtectedRoute>
                  )}
                </Route>

                <Route path="/dashboard/:tripId">
                  {() => (
                    <ProtectedRoute>
                      <TripDashboardView />
                    </ProtectedRoute>
                  )}
                </Route>

                {/* Public Read-Only Shared Trip Route - NO AUTH REQUIRED */}
                <Route path="/shared-trip/:shareToken" component={SharedTripView} />

                {/* Fallback to Home */}
                <Route>
                  {() => <Redirect to="/" />}
                </Route>
              </Switch>
            </main>

            {/* Editorial Footer */}
            <footer className="mt-auto border-t border-[#E7E2D9] bg-[#FAF8F5] py-8 text-[#576574]">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center space-x-2.5">
                  <div className="w-6 h-6 rounded-lg bg-[#1D4E4F] flex items-center justify-center text-white">
                    <Compass className="w-3.5 h-3.5" />
                  </div>
                  <span className="font-serif text-lg font-bold text-[#1A202C]">TravelPilot</span>
                  <span className="text-xs font-mono-meta text-[#576574]">
                    • Your trip, intelligently planned.
                  </span>
                </div>

                <div className="flex flex-wrap items-center justify-center sm:justify-end gap-x-3 gap-y-1 text-xs font-mono-meta text-[#576574]">
                  <span className="flex items-center space-x-1.5 text-[#1D4E4F] font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-[#D96B43]" />
                    <span>Curated Indian Discovery</span>
                  </span>
                  <span className="text-[#D5CEC5]">•</span>
                  <span>Bespoke Travel Intelligence</span>
                  <span className="text-[#D5CEC5]">•</span>
                  <span>Crafted for Modern Explorers</span>
                </div>
              </div>
            </footer>
          </div>
        </TripProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
