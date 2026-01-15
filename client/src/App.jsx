import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Feature Components
import AdminPanel from './components/features/AdminPanel';
import Home from './components/features/Home';
import Level1 from './components/features/Level1';
import Level2 from './components/features/Level2';
import Footer from './components/layout/Footer';

// Styles and Config
import { layoutStyle, toasterOptions } from './utils/themeStyles';

// === OSAMAH AMER BROWSER SIGNATURE ===
if (typeof window !== 'undefined') {
  console.log(
    `%c MODREN PHISHING LAB %c BUILD BY: OSAMAH AMER %c 2026 `,
    'background: #ff4444; color: #fff; padding: 5px; border-radius: 3px 0 0 3px; font-weight: bold;',
    'background: #1a1a1a; color: #2ecc71; padding: 5px; font-weight: bold; border: 1px solid #2ecc71;',
    'background: #333; color: #ccc; padding: 5px; border-radius: 0 3px 3px 0;'
  );
}

const App = () => {
  const [user, setUser] = useState(null);

  return (
    <Router>
      <div style={layoutStyle}>
        <Toaster position="top-right" toastOptions={toasterOptions} />
        
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/level1" element={<Level1 user={user} setUser={setUser} />} />
          <Route path="/level2" element={<Level2 user={user} setUser={setUser} />} />
          <Route path="/admin" element={<AdminPanel />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        <Footer />
      </div>
    </Router>
  );
};

export default App;