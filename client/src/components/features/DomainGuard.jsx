import { useEffect } from 'react';

const DomainGuard = ({ onVerified }) => {
  useEffect(() => {
    const checkDomainIntegrity = async () => {
      try {
        // Styled Init Log
        console.log("%c [Shield] Initializing DomainGuard Sequence...", "color: cyan; font-weight: bold; font-size: 12px;");

        // 1. Get Browser Reality
        const currentBaseURI = document.baseURI; 
        const currentURL = new URL(currentBaseURI);
        const currentHostname = currentURL.hostname;

        // 2. Fetch Config with Anti-Cache & Anti-Tamper Logic
        const response = await fetch(`/api/config/security?t=${Date.now()}`);
        if (!response.ok) throw new Error(`Security Config Unreachable: ${response.status}`);
        
        const config = await response.json();
        
        // 3. Decode the Truth (Base64)
        let allowedDomain = config.allowedDomain;
        if (config.encoding === 'base64') {
            try {
                allowedDomain = atob(config.allowedDomain);
            } catch (e) {
                console.error("%c[Shield] Failed to decode config integrity.", "color: red; font-weight: bold;");
                return; // Fail safe
            }
        }

        // ---------------- DIAGNOSTICS ----------------
        // Styles for the table-like output
        const labelStyle = "color: #3498db; font-weight: bold; padding-right: 10px;"; // Blue
        const valueStyle = "color: #f1c40f; font-weight: bold;"; // Yellow
        const dividerStyle = "color: #7f8c8d; font-weight: bold;"; // Grey

        console.log("%c------------------------------------------------", dividerStyle);
        console.log(`%c Browser Host:      %c${currentHostname}`, labelStyle, valueStyle);
        console.log(`%c Authorized (Dec):  %c${allowedDomain}`, labelStyle, valueStyle);
        console.log(`%c Received (Raw):    %c${config.allowedDomain}`, labelStyle, valueStyle);
        console.log("%c------------------------------------------------", dividerStyle);
        // ---------------------------------------------

        // 4. Verification Logic
        const isLocal = currentHostname === 'localhost' || currentHostname === '127.0.0.1';
        const isSecure = allowedDomain && (
            currentHostname === allowedDomain || 
            currentHostname.endsWith(`.${allowedDomain}`)
        );

        // 5. Action
        if (!isLocal && !isSecure) {
          // Critical Red Alert with large font
          console.error(
              `%c[CRITICAL] Phishing Detected! '${currentHostname}' != '${allowedDomain}'`, 
              "color: #e74c3c; font-weight: 900; font-size: 16px; background: #fff0f0; padding: 5px; border: 1px solid red;"
          );
          
          window.stop();
          document.body.innerHTML = '';
          window.location.href = 'about:blank';
          return;
        }

        console.log("%c [Shield] Integrity Verified.", "color: #2ecc71; font-weight: bold; font-size: 12px;");
        if (onVerified) onVerified();

      } catch (err) {
        console.error(`%c[Shield] Verification Error: ${err.message}`, "color: red; font-weight: bold;");
        
        // Fail-safe logic...
        if (!window.location.hostname.includes('thesis-osamah-lab.live') && 
            !window.location.hostname.includes('localhost')) {
            document.body.innerHTML = '';
            window.stop();
        } else {
             if (onVerified) onVerified();
        }
      }
    };

    checkDomainIntegrity();
  }, [onVerified]);

  return null;
};

export default DomainGuard;