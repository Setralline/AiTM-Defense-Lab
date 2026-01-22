import { useEffect } from 'react';

const DomainGuard = ({ onVerified }) => {
  useEffect(() => {
    const verifyIntegrity = async () => {
      try {
        // 1. Fetch Dynamic Config from Backend
        const response = await fetch('/api/config/security');
        if (!response.ok) throw new Error('Failed to fetch security config');
        
        const config = await response.json();
        const authorizedDomain = config.allowedDomain; // Comes from env.js -> RP_ID

        const currentHostname = window.location.hostname;

        // 2. Localhost Bypass (Strict)
        const isLocal = currentHostname === 'localhost' || currentHostname === '127.0.0.1';

        // 3. Production Check (Dynamic)
        // Matches exact domain or subdomains (e.g. www.thesis...)
        const isMatch = authorizedDomain && (
            currentHostname === authorizedDomain || 
            currentHostname.endsWith(`.${authorizedDomain}`)
        );

        // 4. Security Decision
        if (!isLocal && !isMatch) {
          console.error(`[DomainGuard] Security Alert: ${currentHostname} is not authorized!`);
          
          // Kill Switch
          window.stop();
          document.documentElement.innerHTML = "";
          return;
        }

        // Success
        if (onVerified) onVerified();

      } catch (err) {
        console.warn("[DomainGuard] Config check failed. Check API connectivity.");
        // Optional: Fail open or closed depending on desired strictness
        // For now, we allow it to proceed if API fails to avoid locking out legitimate users on bad connections
        if (onVerified) onVerified();
      }
    };

    verifyIntegrity();
  }, [onVerified]);

  return null;
};

export default DomainGuard;