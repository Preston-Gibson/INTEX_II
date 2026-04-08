import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';

// General Pages
import Home from './pages/Home.tsx';
import Login from './pages/Login.tsx';
import PrivacyPolicy from './pages/PrivacyPolicy.tsx';
import Impact from './pages/Impact.tsx';

// Donor Pages
import DonorDashboard from './pages/donor/Dashboard.tsx';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard.tsx';
import AdminDonorsContributions from './pages/admin/DonorsContributions.tsx';
import AdminCaseloadInventory from './pages/admin/CaseloadInventory.tsx';
import AdminProcessRecording from './pages/admin/ProcessRecording.tsx';
import AdminHomeVisitationCaseConference from './pages/admin/HomeVisitationCaseConference.tsx';
import AdminReportsAnalytics from './pages/admin/ReportsAnalytics.tsx';

// Page Elements
import NavBar from './components/NavBar.tsx';
import Footer from './components/Footer.tsx';
import CookieBanner from './components/CookieBanner.tsx';
import ScrollToTop from './components/ScrollToTop.tsx';
import ProtectedRoute from './components/ProtectedRoute.tsx';

const DASHBOARD_PATHS = ['/donor-dashboard', '/admin-dashboard', '/admin-donors-contributions', '/admin-caseload-inventory', '/admin-process-recording', '/admin-home-visitation-case-conference', '/admin-reports-analytics'];

function Layout() {
  const location = useLocation();
  const isDashboard = DASHBOARD_PATHS.includes(location.pathname);

  return (
    <>
      <ScrollToTop />
      {!isDashboard && <NavBar />}
      <div className={!isDashboard ? 'mt-20' : ''}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/impact" element={<Impact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/donor-dashboard" element={<ProtectedRoute requiredRole="Donor"><DonorDashboard /></ProtectedRoute>} />
          <Route path="/admin-dashboard" element={<ProtectedRoute requiredRole="Admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin-donors-contributions" element={<ProtectedRoute requiredRole="Admin"><AdminDonorsContributions /></ProtectedRoute>} />
          <Route path="/admin-caseload-inventory" element={<ProtectedRoute requiredRole="Admin"><AdminCaseloadInventory /></ProtectedRoute>} />
          <Route path="/admin-process-recording" element={<ProtectedRoute requiredRole="Admin"><AdminProcessRecording /></ProtectedRoute>} />
          <Route path="/admin-home-visitation-case-conference" element={<ProtectedRoute requiredRole="Admin"><AdminHomeVisitationCaseConference /></ProtectedRoute>} />
          <Route path="/admin-reports-analytics" element={<ProtectedRoute requiredRole="Admin"><AdminReportsAnalytics /></ProtectedRoute>} />
        </Routes>
      </div>
      {!isDashboard && <Footer />}
      <CookieBanner />
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}

export default App;
