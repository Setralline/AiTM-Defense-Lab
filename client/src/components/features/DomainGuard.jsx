import React, { useEffect } from 'react';

const DomainGuard = () => {
  const ALLOWED_DOMAINS = ["thesis-osamah-lab.live", "localhost", "127.0.0.1"];

  useEffect(() => {
    const currentDomain = window.location.hostname;
    
    if (!ALLOWED_DOMAINS.includes(currentDomain)) {
      // Kill Switch Action
      document.body.innerHTML = `
        <div style="background:#8b0000; color:white; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; font-family:sans-serif;">
            <h1>⚠️ SECURITY ALERT ⚠️</h1>
            <h2>Phishing Detected</h2>
            <p>Unauthorized Domain: <strong>${currentDomain}</strong></p>
        </div>
      `;
      throw new Error("Security Kill Switch Activated");
    }
  }, []);

  return null; // Invisible component
};

export default DomainGuard;