import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// === Layout & Features ===
import AdminPanel from './components/features/AdminPanel';
import Home from './components/features/Home';
import Level1 from './components/features/Level1';
import Level2 from './components/features/Level2';
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
 * Orchestrates routing and global user state management.
 */
const App = () => {
  // Global State: Lifted up to share authentication status across levels
  const [user, setUser] = useState(null);

  return (
    <Router>
      {/* CRITICAL CHANGE: 
        Replaced style={layoutStyle} with className="layout".
        This class is defined in src/styles/main.css 
      */}
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