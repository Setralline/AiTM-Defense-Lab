import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import authService from './services/authService';

// === Layout & Features ===
import AdminPanel from './components/features/AdminPanel';
import Home from './components/features/Home';
import Level1 from './components/features/Level1';
import Level2 from './components/features/Level2';
import Level3 from './components/features/Level3'; 
import Level4 from './components/features/Level4';
import Level5 from './components/features/Level5';
import Footer from './components/layout/Footer';

// === Styles & Config ===
import { toasterOptions } from './utils/themeStyles';

// === BROWSER SIGNATURE (Thesis Branding) ===
if (typeof window !== 'undefined') {
  console.log(
    `%c MODERN PHISHING LAB %c BUILD BY: OSAMAH AMER %c 2026 `,
    'background: #ff4444; color: #fff; padding: 5px; border-radius: 3px 0 0 3px; font-weight: bold;',
    'background: #1a1a1a; color: #2ecc71; padding: 5px; font-weight: bold; border: 1px solid #2ecc71;',
    'background: #333; color: #ccc; padding: 5px; border-radius: 0 3px 3px 0;'
  );
}

/**
 * Root Application Component
 * Orchestrates routing and implements global session recovery to prevent logout on refresh.
 */
const App = () => {
  // Global State: shared across all levels
  const [user, setUser] = useState(null);
  const [isInitializing, setIsInitializing] = useState(true);

  // ✅ GLOBAL SESSION RECOVERY (Fixes Refresh Bug)
  useEffect(() => {
    const recoverSession = async () => {
      // Check both persistent (localStorage) and session-only (sessionStorage)
      const token = localStorage.getItem('auth_token') || sessionStorage.getItem('auth_token');
      
      if (token) {
        try {
          const data = await authService.getCurrentUser();
          if (data && data.user) {
            setUser(data.user);
          }
        } catch (err) {
          console.warn('[Session] Recovery failed. Purging invalid tokens.');
          localStorage.removeItem('auth_token');
          sessionStorage.removeItem('auth_token');
        }
      }
      setIsInitializing(false);
    };

    recoverSession();
  }, []);

  // Show loader while checking session status
  if (isInitializing) {
    return (
      <div className="cyber-loader">
        <p className="cyber-loader__text">SYNCHRONIZING_LAB_SESSIONS...</p>
      </div>
    );
  }

  return (
    <Router>
      <div className="layout">
        
        {/* Global Toast Notifications */}
        <Toaster position="top-right" toastOptions={toasterOptions} />
        
        {/* Route Definitions */}
        <Routes>
          {/* Landing Page */}
          <Route path="/" element={<Home user={user} />} />

          {/* Level 1: Legacy Auth (Cookies) */}
          <Route 
            path="/level1" 
            element={<Level1 user={user} setUser={setUser} />} 
          />

          {/* Level 2: Modern Auth (JWT) */}
          <Route 
            path="/level2" 
            element={<Level2 user={user} setUser={setUser} />} 
          />

          {/* Level 3: Server Defense (Header Analysis) */}
          <Route 
            path="/level3" 
            element={<Level3 user={user} setUser={setUser} />} 
          />

          {/* Level 4: Client Defense (Domain Guard) */}
          <Route 
            path="/level4" 
            element={<Level4 user={user} setUser={setUser} />} 
          />

          {/* Level 5: Hardware Defense (FIDO2/WebAuthn) */}
          <Route 
            path="/level5" 
            element={<Level5 user={user} setUser={setUser} />} 
          />

          {/* Admin Dashboard */}
          <Route path="/admin" element={<AdminPanel />} />

          {/* Fallback Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
};

export default App;