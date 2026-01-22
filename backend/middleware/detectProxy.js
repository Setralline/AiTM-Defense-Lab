const config = require('../config/env');

/**
 * Lab 3: Server-Side Defense
 * 1. Checks for 'X-Evilginx' Easter Egg fingerprint.
 * 2. Checks for Host Header mismatch.
 */
const detectProxy = (req, res, next) => {
    const allowedHost = config.app.allowedHosts[0] || 'localhost';
 // [DEFENSE: X-Evilginx Fingerprint]
    // Detects the default "Easter Egg" header added by Evilginx3 unless manually removed by the attacker
    
    // Check multiple headers because of Cloudfront/Nginx proxies
    const currentHost = req.headers['x-forwarded-host'] || req.headers.host;
    const evilginxHeader = req.headers['x-evilginx'];

    // 1. Fingerprint Defense (X-Evilginx)
    if (evilginxHeader) {
        console.error(`[CRITICAL] Evilginx Detected via Header!`);
        return res.status(403).json({ message: "Security Alert: Proxy Detected." });
    }

    // 2. Domain Validation (Lab 3)
    // Allow if it's localhost OR if it contains our thesis domain
    const isLocal = currentHost.includes('localhost') || currentHost.includes('127.0.0.1');
    const isAuthorized = currentHost.includes(allowedHost);

    if (!isLocal && !isAuthorized) {
        console.warn(`[Security Lab 3] Blocked Host: ${currentHost}`);
        return res.status(403).json({
            message: `Access Denied: Domain ${currentHost} is not authorized.`
        });
    }

    next();
};

module.exports = detectProxy;