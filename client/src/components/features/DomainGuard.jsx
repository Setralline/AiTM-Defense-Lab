import { useEffect } from 'react';

/**
 * DomainGuard Component - Dynamic Lab Defense
 * Fetches the authorized domain from the backend and kills the page if a mismatch is detected.
 */
const DomainGuard = () => {
  useEffect(() => {
    const verifyIntegrity = async () => {
      try {
        // 1. Fetch the official configuration from the backend (Dynamic from Docker)
        const response = await fetch('/api/config/security');
        const config = await response.json();
        
        const authorizedDomain = config.allowedDomain;
        const currentHostname = window.location.hostname;

        // 2. Define local safety bypass for development
        const isLocal = currentHostname === "localhost" || currentHostname === "127.0.0.1";

        // 3. Security Check: If not local and hostname doesn't match the backend's allowedDomain
        if (!isLocal && currentHostname !== authorizedDomain) {
          
          // CRITICAL: Halt all network activity and script execution
          window.stop(); 
          
          // CRITICAL: Clear the entire DOM (Head and Body) to leave a blank white page
          document.documentElement.innerHTML = ""; 
          
          // Overwrite with clean blank content to neutralize the proxy
          document.write("<html><body style='background:white;'></body></html>");

          console.error("SECURITY ALERT: Domain mismatch. Execution halted.");
          
          // Throw error to break the React component lifecycle
          throw new Error("Security Kill Switch Activated");
        }
      } catch (err) {
        // Silent fail or log internal error
        console.warn("Domain integrity check bypassed or failed to initialize.");
      }
    };

    verifyIntegrity();
  }, []);

  // This component is invisible; it only monitors domain integrity
  return null; 
};

export default DomainGuard;