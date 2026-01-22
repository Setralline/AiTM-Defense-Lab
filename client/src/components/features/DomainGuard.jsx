const config = require('../config/env');

const detectProxy = (req, res, next) => {
    // 1. Extract the host (removing port if present)
    const rawHost = req.headers['x-forwarded-host'] || req.headers.host || '';
    const clientHost = rawHost.split(':')[0]; // remove port (e.g., :80)

    // 2. Trusted Domains List (Hardcoded Whitelist for Stability)
    // This ensures the original domain always works regardless of Docker/CloudFront configuration
    const TRUSTED_DOMAINS = [
        'thesis-osamah-lab.live',
        'www.thesis-osamah-lab.live',
        'localhost',
        '127.0.0.1'
    ];

    // 3. Detect Evilginx Fingerprint (X-Evilginx Header)
    if (req.headers['x-evilginx']) {
        console.error(`[CRITICAL] Evilginx Header Detected from: ${clientHost}`);
        return res.status(403).json({ message: "Security Alert: Proxy Detected." });
    }

    // 4. Host Verification (Lab 3 Logic)
    // Check if the current host is in the trusted whitelist or matches the environment config
    const isAuthorized = TRUSTED_DOMAINS.includes(clientHost) || 
                         (config.app.allowedHosts[0] && clientHost === config.app.allowedHosts[0]);

    if (!isAuthorized) {
        console.warn(`[Security Lab 3] Blocked Host: ${clientHost}`);
        return res.status(403).json({
            message: `Access Denied: Domain ${clientHost} is not authorized.`
        });
    }

    next();
};

module.exports = detectProxy;