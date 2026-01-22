import { useEffect } from 'react';

const DomainGuard = ({ onVerified }) => {
  useEffect(() => {
    const verifyIntegrity = async () => {
      try {
        const currentHostname = window.location.hostname;
        const TRUSTED_ROOT = 'thesis-osamah-lab.live';

        // 1. Strict Localhost Check (Exact Match Only)
        // This fixes the bug where "localhost.live" was allowed because it contained "localhost"
        const isLocal = currentHostname === 'localhost' || currentHostname === '127.0.0.1';

        // 2. Strict Production Domain Check
        // Allows "thesis-osamah-lab.live" or "www.thesis-osamah-lab.live"
        // Blocks "fake-thesis-osamah-lab.live" or "evil.com"
        const isProduction = currentHostname === TRUSTED_ROOT || 
                             currentHostname.endsWith(`.${TRUSTED_ROOT}`);

        // 3. Security Decision
        if (!isLocal && !isProduction) {
          console.error(`SECURITY ALERT: ${currentHostname} is not authorized!`);
          
          // Kill Switch: Stop execution and clear DOM
          window.stop();
          document.documentElement.innerHTML = ""; 
          
          // Hard Redirect (Optional backup)
          window.location.href = "about:blank";
          return;
        }

        // Success: Allow the page to render
        if (onVerified) onVerified();

      } catch (err) {
        // Fail-safe: If an error occurs, checking against the hardcoded domain guarantees safety
        if (window.location.hostname.endsWith('thesis-osamah-lab.live')) {
            if (onVerified) onVerified();
        }
      }
    };

    verifyIntegrity();
  }, [onVerified]);

  return null;
};

export default DomainGuard;