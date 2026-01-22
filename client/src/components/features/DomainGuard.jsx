import { useEffect } from 'react';

const DomainGuard = ({ onVerified }) => {
  useEffect(() => {
    const checkDomainIntegrity = async () => {
      try {
        console.log("%c [Shield] Initializing DomainGuard Sequence...", "color: cyan");

        // 1. Get the "Real" Location from the Browser
        // We use document.baseURI as requested to get the full context
        const currentBaseURI = document.baseURI; 
        const currentURL = new URL(currentBaseURI);
        const currentHostname = currentURL.hostname;

        // 2. Fetch the Authorized Configuration from Backend
        const response = await fetch('/api/config/security');
        if (!response.ok) {
            throw new Error(`Security Config Unreachable (Status: ${response.status})`);
        }
        
        const config = await response.json();
        const allowedDomain = config.allowedDomain; // e.g., "thesis-osamah-lab.live"

        // ---------------- DIAGNOSTICS (Check Console) ----------------
        console.log("------------------------------------------------");
        console.log("🔎 DOMAIN INTEGRITY CHECK");
        console.log(`📍 Browser BaseURI:   ${currentBaseURI}`);
        console.log(`🏠 Detected Host:     ${currentHostname}`);
        console.log(`🔐 Authorized Host:   ${allowedDomain}`);
        console.log("------------------------------------------------");
        // -------------------------------------------------------------

        // 3. The Comparison Logic
        // Allow Localhost for testing
        const isLocal = currentHostname === 'localhost' || currentHostname === '127.0.0.1';

        // Strict Check: Does the current host match the allowed domain?
        // We use .endsWith to allow subdomains like 'www.'
        const isSecure = allowedDomain && (
            currentHostname === allowedDomain || 
            currentHostname.endsWith(`.${allowedDomain}`)
        );

        // 4. IMMEDIATE ACTION
        if (!isLocal && !isSecure) {
          console.error(`[CRITICAL] Phishing Detected! Origin '${currentHostname}' does not match '${allowedDomain}'`);
          
          // A. Kill the Page Execution
          window.stop();
          
          // B. Wipe the DOM (Show Blank)
          document.body.innerHTML = '';
          document.head.innerHTML = '';
          
          // C. Force Redirect (Optional: trap the user)
          window.location.href = 'about:blank';
          return;
        }

        // 5. Success
        console.log("%c [Shield] Integrity Verified. Access Granted.", "color: green");
        if (onVerified) onVerified();

      } catch (err) {
        // Fail-Safe: If we can't verify, we MUST assume we are under attack unless on localhost
        console.error("[Shield] Verification Error:", err);
        
        // Strict Fallback: Check if we are clearly on the known legitimate domain
        // This handles cases where API might fail but domain is correct
        if (!window.location.hostname.includes('thesis-osamah-lab.live') && 
            !window.location.hostname.includes('localhost')) {
            document.body.innerHTML = '<h1>Security Check Failed</h1>';
            window.stop();
        } else {
             // If on real domain but API failed, allow access (Availability vs Security trade-off)
             if (onVerified) onVerified();
        }
      }
    };

    checkDomainIntegrity();
  }, [onVerified]);

  // Render nothing while checking
  return null;
};

export default DomainGuard;