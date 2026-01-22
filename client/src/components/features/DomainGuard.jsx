import { useEffect } from 'react';

const DomainGuard = ({ onVerified }) => {
  useEffect(() => {
    const verifyIntegrity = async () => {
      try {
        const currentHostname = window.location.hostname;
        
        console.log("%c [DomainGuard] Starting Check...", "color: yellow");
        console.log(`[DomainGuard] Current Window Hostname: ${currentHostname}`);

        // 1. Fetch Config from Backend
        const response = await fetch('/api/config/security');
        if (!response.ok) throw new Error('API Config Fetch Failed');
        
        const config = await response.json();
        console.log("[DomainGuard] Backend Config Received:", config);

        const authorizedDomain = config.allowedDomain; // e.g., thesis-osamah-lab.live
        const rpId = config.rpId;

        // 2. Logic (No Hardcoding)
        const isLocal = currentHostname === "localhost" || currentHostname === "127.0.0.1";
        
        // Flexible Match: Does the current hostname contain the authorized domain?
        // e.g. "www.thesis-osamah-lab.live" includes "thesis-osamah-lab.live" -> TRUE
        const isMatch = authorizedDomain && currentHostname.includes(authorizedDomain);

        if (!isLocal && !isMatch) {
          console.error(`[DomainGuard] 🚨 MISMATCH! Current: ${currentHostname} vs Authorized: ${authorizedDomain}`);
          
          // Kill Switch
          // window.stop();
          // document.documentElement.innerHTML = "";
          // throw new Error("Security Kill Switch Activated");
          
          // FOR DEBUGGING ONLY (Don't kill yet, just alert)
          alert(`DEBUG: DomainGuard Blocking! You are on: ${currentHostname}, Expected: ${authorizedDomain}`);
          return;
        }

        console.log("[DomainGuard] ✅ Verification Passed.");
        if (onVerified) onVerified();

      } catch (err) {
        console.error("[DomainGuard] Error during verification:", err);
        // Fail Open for Debugging (Allow render so we can see logs)
        if (onVerified) onVerified();
      }
    };

    verifyIntegrity();
  }, [onVerified]);

  return null;
};

export default DomainGuard;