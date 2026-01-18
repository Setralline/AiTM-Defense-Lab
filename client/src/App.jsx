import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import authService from './services/authService';
import { toasterOptions } from './utils/themeStyles';

// === Layout & Features ===
import AdminPanel from './components/features/AdminPanel';
import Home from './components/features/Home';
import Level1 from './components/features/Level1';
import Level2 from './components/features/Level2';
import Level3 from './components/features/Level3'; 
import Level4 from './components/features/Level4';
import Level5 from './components/features/Level5';
import Footer from './components/layout/Footer';


// === BROWSER SIGNATURE (Thesis Branding) ===
if (typeof window !== 'undefined') {
  console.log(
    `%c MODERN PHISHING LAB %c BUILD BY: OSAMAH AMER %c 2026 `,
    'background: #ff4444; color: #fff; padding: 5px; border-radius: 3px 0 0 3px; font-weight: bold;',
    'background: #1a1a1a; color: #2ecc71; padding: 5px; font-weight: bold; border: 1px solid #2ecc71;',
    'background: #333; color: #ccc; padding: 5px; border-radius: 0 3px 3px 0;'
  );
}

const App = () => {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // ✅ GLOBAL SESSION RECOVERY (Fixes Refresh Bug)
  useEffect(() => {
    const recoverSession = async () => {
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      if (token) {
        try {
          const data = await authService.getCurrentUser();
          if (data && data.user) setUser(data.user);
        } catch (err) {
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_token');
        }
      }
      setIsInitializing(false);
    };
    recoverSession();
  }, []);

  if (isInitializing) {
    return <div className="cyber-loader"><p>SYNCHRONIZING_LAB_SESSIONS...</p></div>;
  }

  return (
    <Router>
      <div className="layout">
        <Toaster position="top-right" toastOptions={toasterOptions} />
        <Routes>
          <Route path="/" element={<Home user={user} />} />
          <Route path="/level1" element={<Level1 user={user} setUser={setUser} />} />
          <Route path="/level2" element={<Level2 user={user} setUser={setUser} />} />
          <Route path="/level3" element={<Level3 user={user} setUser={setUser} />} />
          <Route path="/level4" element={<Level4 user={user} setUser={setUser} />} />
          <Route path="/level5" element={<Level5 user={user} setUser={setUser} />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Footer />
      </div>
    </Router>
  );
};

export default App;