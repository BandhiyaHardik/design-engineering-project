import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./hooks/useAuth";
import Navbar from "./components/Navbar";
import Landing from "./pages/Landing";
import Home from "./pages/Home";
import EventDetail from "./pages/EventDetail";
import CreateEvent from "./pages/CreateEvent";
import ClubPage from "./pages/ClubPage";
import ClubsPage from "./pages/ClubsPage";
import OrgPage from "./pages/OrgPage";
import OrgsPage from "./pages/OrgsPage";
import Dashboard from "./pages/Dashboard";
import Auth from "./pages/Auth";
import Profile from "./pages/Profile";
import AttendanceScanner from "./pages/AttendanceScanner";
import AdminPanel from "./pages/AdminPanel";
import OnboardOrg from "./pages/OnboardOrg";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* Public Landing — has its own footer, no shared Navbar for clean look */}
            <Route path="/" element={<Landing />} />

            {/* App shell — all other pages get Navbar */}
            <Route path="/*" element={
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1">
                  <Routes>
                    <Route path="/events" element={<Home />} />
                    <Route path="/events/create" element={<CreateEvent />} />
                    <Route path="/events/:id" element={<EventDetail />} />
                    <Route path="/events/:id/scan" element={<AttendanceScanner />} />
                    <Route path="/clubs" element={<ClubsPage />} />
                    <Route path="/clubs/:id" element={<ClubPage />} />
                    <Route path="/org" element={<OrgsPage />} />
                    <Route path="/org/:id" element={<OrgPage />} />
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/auth" element={<Auth />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/admin" element={<AdminPanel />} />
                    <Route path="/onboard" element={<OnboardOrg />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
              </div>
            } />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
