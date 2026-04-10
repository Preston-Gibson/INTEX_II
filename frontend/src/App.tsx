import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';

// General Pages
import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import Register from "./pages/Register.tsx";
import OAuthCallback from "./pages/OAuthCallback.tsx";
import PrivacyPolicy from './pages/PrivacyPolicy.tsx';
import Impact from './pages/Impact.tsx';
import DonorShoutout from './pages/DonorShoutout.tsx';

// Donor Pages
import DonorDashboard from './pages/donor/Dashboard.tsx';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard.tsx';
import AdminDonorsContributions from './pages/admin/DonorsContributions.tsx';
import AdminCaseloadInventory from './pages/admin/CaseloadInventory.tsx';
import AdminProcessRecording from './pages/admin/ProcessRecording.tsx';
import AdminHomeVisitationCaseConference from './pages/admin/HomeVisitationCaseConference.tsx';
import AdminReportsAnalytics from './pages/admin/ReportsAnalytics.tsx';
import AdminUserManagement from './pages/admin/UserManagement.tsx';

// Page Elements
import NavBar from './components/NavBar.tsx';
import CrisisHotlineBanner from './components/CrisisHotlineBanner.tsx';
import Footer from './components/Footer.tsx';
import CookieBanner from './components/CookieBanner.tsx';
import ScrollToTop from './components/ScrollToTop.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

const DASHBOARD_PATHS = ['/donor-dashboard', '/admin-dashboard', '/admin-donors-contributions', '/admin-caseload-inventory', '/admin-process-recording', '/admin-home-visitation-case-conference', '/admin-reports-analytics', '/admin-user-management'];
const NO_CHROME_PATHS = ['/login', '/register', '/oauth-callback'];

function Layout() {
  const location = useLocation();
  const isDashboard = DASHBOARD_PATHS.includes(location.pathname);
  const isNoChrome = NO_CHROME_PATHS.includes(location.pathname);

  return (
    <>
      <ScrollToTop />
      {!isDashboard && !isNoChrome && <CrisisHotlineBanner />}
      {!isDashboard && !isNoChrome && <NavBar />}
      <div className={!isDashboard && !isNoChrome ? 'mt-[7.25rem]' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/donor-shoutout" element={<DonorShoutout />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/oauth-callback" element={<OAuthCallback />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/donor-dashboard" element={<ProtectedRoute requiredRole={['Admin', 'Donor']}><DonorDashboard /></ProtectedRoute>} />
          <Route path="/admin-dashboard" element={<ProtectedRoute requiredRole="Admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin-donors-contributions" element={<ProtectedRoute requiredRole="Admin"><AdminDonorsContributions /></ProtectedRoute>} />
          <Route path="/admin-caseload-inventory" element={<ProtectedRoute requiredRole="Admin"><AdminCaseloadInventory /></ProtectedRoute>} />
          <Route path="/admin-process-recording" element={<ProtectedRoute requiredRole="Admin"><AdminProcessRecording /></ProtectedRoute>} />
          <Route path="/admin-home-visitation-case-conference" element={<ProtectedRoute requiredRole="Admin"><AdminHomeVisitationCaseConference /></ProtectedRoute>} />
          <Route path="/admin-reports-analytics" element={<ProtectedRoute requiredRole="Admin"><AdminReportsAnalytics /></ProtectedRoute>} />
          <Route path="/admin-user-management" element={<ProtectedRoute requiredRole="Admin"><AdminUserManagement /></ProtectedRoute>} />
        </Routes>
      </div>
      {!isDashboard && !isNoChrome && <Footer />}
      <CookieBanner />
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <BrowserRouter>
          <Layout />
        </BrowserRouter>
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;
