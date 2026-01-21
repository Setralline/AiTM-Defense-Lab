// client/src/components/features/DomainGuard.jsx
import { useEffect } from 'react';

const DomainGuard = ({ onVerified }) => {
  useEffect(() => {
    const checkDomain = async () => {
      try {
        const response = await fetch('/api/config/security');
        const config = await response.json();
        
        const authorizedDomain = config.allowedDomain;
        const currentHostname = window.location.hostname;

        if (currentHostname !== authorizedDomain && currentHostname !== "localhost") {

          window.stop();
          document.documentElement.innerHTML = ""; 
          return;
        }

        if (onVerified) onVerified();
      } catch (err) {
        console.error("Security probe failed");
      }
    };
    checkDomain();
  }, [onVerified]);

  return null;
};

export default DomainGuard;