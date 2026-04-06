import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Home from './pages/Home.tsx';
import DonorDashboard from './pages/DonorDashboard.tsx';
import NavBar from './components/NavBar.tsx';
import Footer from './components/Footer.tsx';

function App() {
  return (
    <BrowserRouter>
      <NavBar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/impact" element={<DonorDashboard />} />
      </Routes>
      <Footer />
    </BrowserRouter>
  );
}

export default App;