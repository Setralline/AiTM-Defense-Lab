import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import authService from './services/authService';
import { toasterOptions } from './utils/themeStyles';
import { printDeveloperSignature } from './utils/signature';

import Home from './pages/Home';
import AdminPanel from './pages/AdminPanel';
import Level1 from './pages/Level1';
import Level2 from './pages/Level2';
import Level3 from './pages/Level3';
import Level4 from './pages/Level4';
import Level5 from './pages/Level5';
import Footer from './components/layout/Footer';

const App = () => {
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);
  let isSignaturePrinted = false;
  // 1. My SIGNATURE
  useEffect(() => {
    if (!isSignaturePrinted) {
      printDeveloperSignature();
      isSignaturePrinted = true;
    }
  }, []);

  // 2. GLOBAL SESSION RECOVERY
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
    return (
      <div className="cyber-loader">
        <p className="cyber-loader__text">INITIALIZING_LAB_SESSIONS...</p>
      </div>
    );
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