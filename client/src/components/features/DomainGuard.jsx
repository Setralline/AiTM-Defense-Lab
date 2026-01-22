import { useEffect } from 'react';

const DomainGuard = ({ onVerified }) => {
  useEffect(() => {
    const checkDomain = async () => {
      try {
        const response = await fetch('/api/config/security');
        const config = await response.json();
        
        const authorizedDomain = config.allowedDomain;
        const currentHostname = window.location.hostname;

        // Dev bypass
        const isLocal = currentHostname === "localhost" || currentHostname === "127.0.0.1";
        
        // Flexible check: Does the current URL contain our authorized domain?
        const isAuthorized = currentHostname.includes(authorizedDomain);

        if (!isLocal && !isAuthorized) {
          console.error("DOMAIN MISMATCH - KILL SWITCH ACTIVATED");
          window.stop();
          document.documentElement.innerHTML = ""; 
          return;
        }
        
        // Success: Let the UI render
        if (onVerified) onVerified();
      } catch (err) {
        console.error("Security verification failed", err);
      }
    };
    checkDomain();
  }, [onVerified]);

  return null;
};

export default DomainGuard;