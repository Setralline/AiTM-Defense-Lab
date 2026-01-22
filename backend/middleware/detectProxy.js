const config = require('../config/env');

/**
 * Lab 3: Server-Side Defense (Dynamic)
 * Uses environment variables from env.js to validate hosts.
 */
const detectProxy = (req, res, next) => {
    // 1. Extract Host Information
    const rawHost = req.headers['x-forwarded-host'] || req.headers.host || '';
    const clientHost = rawHost.split(':')[0]; // Remove port if present

    // 2. DEFENSE LAYER 1: Fingerprint Detection (Anti-Evilginx)
    if (req.headers['x-evilginx']) {
        console.error(`[SECURITY] Evilginx signature detected from: ${clientHost}`);
        return res.status(403).json({ 
            message: "Security Alert: Malicious Proxy Fingerprint Detected." 
        });
    }

    // 3. DEFENSE LAYER 2: Host Whitelisting (Dynamic)
    // Pulls the allowed list directly from config/env.js
    const allowedHosts = config.security.allowedHosts || [];

    // Validation Logic:
    // Check if clientHost matches any host in the allowed list (stripping ports from config if needed)
    const isAuthorized = allowedHosts.some(host => {
        const cleanHost = host.split(':')[0]; // Handle cases like 'localhost:5000' in config
        return clientHost === cleanHost || clientHost.endsWith(`.${cleanHost}`);
    });

    if (!isAuthorized) {
        console.warn(`[SECURITY] Blocked unauthorized host: ${clientHost}`);
        // Debug log to help you verify what is in the env list
        console.debug(`[DEBUG] Allowed Targets: ${JSON.stringify(allowedHosts)}`);
        
        return res.status(403).json({
            message: "Access Denied: Domain not authorized."
        });
    }

    next();
};

module.exports = detectProxy;