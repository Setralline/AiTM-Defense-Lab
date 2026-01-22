import { useEffect } from 'react';

const DomainGuard = ({ onVerified }) => {
  useEffect(() => {
    const verifyIntegrity = async () => {
      try {
        // Attempt to fetch configuration from the server
        let authorizedDomain = null;
        try {
          const response = await fetch('/api/config/security');
          if (response.ok) {
            const config = await response.json();
            authorizedDomain = config.allowedDomain;
          }
        } catch (e) {
          console.warn("Could not fetch security config, using strict fallback.");
        }

        const currentHostname = window.location.hostname;

        // Explicit Whitelist
        const TRUSTED_DOMAINS = [
            'thesis-osamah-lab.live',
            'localhost', 
            '127.0.0.1'
        ];

        // Validation: Is the current domain in the trusted list or matches server settings?
        const isSafe = TRUSTED_DOMAINS.some(d => currentHostname.includes(d)) || 
                       (authorizedDomain && currentHostname.includes(authorizedDomain));

        if (!isSafe) {
          console.error(`SECURITY ALERT: ${currentHostname} is not authorized!`);
          window.stop();
          document.documentElement.innerHTML = ""; 
          return;
        }

        // Success: Allow the page to render
        if (onVerified) onVerified();

      } catch (err) {
        // In case of an unexpected error, fail safe and allow rendering if the domain is the real domain
        if (window.location.hostname.includes('thesis-osamah-lab.live')) {
            if (onVerified) onVerified();
        }
      }
    };

    verifyIntegrity();
  }, [onVerified]);

  return null;
};

export default DomainGuard;