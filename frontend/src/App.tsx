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

const DASHBOARD_PATHS = ['/donor-dashboard', '/admin-dashboard', '/admin-donors-contributions', '/admin-caseload-inventory', '/admin-process-recording', '/admin-home-visitation-case-conference', '/admin-reports-analytics'];

function Layout() {
  const location = useLocation();
  const isDashboard = DASHBOARD_PATHS.includes(location.pathname);

  return (
<<<<<<< HEAD
    <BrowserRouter>
      <NavBar />
      <div className="mt-20">
=======
    <>
      {!isDashboard && <NavBar />}
>>>>>>> b9f3c69 (adjusting backend connections + adding donor dashboard)
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/impact" element={<Impact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        <Route path="/donor-dashboard" element={<DonorDashboard />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route path="/admin-donors-contributions" element={<AdminDonorsContributions />} />
        <Route path="/admin-caseload-inventory" element={<AdminCaseloadInventory />} />
        <Route path="/admin-process-recording" element={<AdminProcessRecording />} />
        <Route path="/admin-home-visitation-case-conference" element={<AdminHomeVisitationCaseConference />} />
        <Route path="/admin-reports-analytics" element={<AdminReportsAnalytics />} />
      </Routes>
<<<<<<< HEAD
      </div>
      <Footer />
=======
      {!isDashboard && <Footer />}
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <Layout />
>>>>>>> b9f3c69 (adjusting backend connections + adding donor dashboard)
    </BrowserRouter>
  );
}

export default App;
