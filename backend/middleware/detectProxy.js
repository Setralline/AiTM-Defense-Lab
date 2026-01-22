const config = require('../config/env');

/**
 * Lab 3: Server-Side Defense
 * 1. Checks for 'X-Evilginx' Easter Egg fingerprint.
 * 2. Checks for Host Header mismatch.
 */
const detectProxy = (req, res, next) => {
    const allowedHost = config.app.allowedHosts[0] || 'localhost';
    const currentHost = req.headers.host;
    
    // [DEFENSE: X-Evilginx Fingerprint]
    // Detects the default "Easter Egg" header added by Evilginx3 unless manually removed by the attacker
    const evilginxHeader = req.headers['x-evilginx'];

    if (evilginxHeader) {
        console.error(`\x1b[31m[CRITICAL - Lab 3]\x1b[0m Evilginx Fingerprint Detected! Header Value: ${evilginxHeader}`);
        return res.status(403).json({
            message: "Security Alert: Malicious Proxy Fingerprint (X-Evilginx) Detected."
        });
    }

    // [DEFENSE: Host Validation]
    // Compares the incoming Host header against the authorized domain set in environment variables
    if (currentHost && !currentHost.includes(allowedHost) && !currentHost.includes('localhost')) {
        console.warn(`\x1b[33m[Security Lab 3]\x1b[0m Unauthorized Host: ${currentHost}`);
        return res.status(403).json({
            message: "Access Denied: Domain mismatch detected on server."
        });
    }

    next();
};

module.exports = detectProxy;