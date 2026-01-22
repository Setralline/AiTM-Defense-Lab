const config = require('../config/env');

/**
 * Lab 3: Server-Side Defense & Debugging
 * 1. Checks for 'X-Evilginx' signature (Weak Defense).
 * 2. Validates Host Header against Whitelist (Strong Defense).
 */
const detectProxy = (req, res, next) => {
    // --- DEBUG DIAGNOSTICS ---
    const rawHost = req.headers['x-forwarded-host'] || req.headers.host || '';
    const clientHost = rawHost.split(':')[0]; // Remove port (e.g. :5000)
    const evilginxHeader = req.headers['x-evilginx'];

    // Console Logs to see exactly what is happening in Production
    console.log("----------------------------------------------------------------");
    console.log(`[DEBUG Lab 3] Incoming Request Analysis`);
    console.log(`[DEBUG] Raw Host Header: '${req.headers.host}'`);
    console.log(`[DEBUG] X-Forwarded-Host: '${req.headers['x-forwarded-host']}'`);
    console.log(`[DEBUG] Resolved Client Host: '${clientHost}'`);
    console.log(`[DEBUG] Evilginx Header Present: ${evilginxHeader ? 'YES' : 'NO'}`);
    // -------------------------

    // 1. Fingerprint Defense (X-Evilginx)
    // Catches default Evilginx installations
    if (evilginxHeader) {
        console.error(`\x1b[31m[CRITICAL] Evilginx Fingerprint Detected! Blocking Request.\x1b[0m`);
        return res.status(403).json({
            message: "Security Alert: Malicious Proxy Fingerprint (X-Evilginx) Detected."
        });
    }

    // 2. Host Validation (The Core Lab 3 Defense)
    // We strictly define allowed domains. If we remove this, custom Evilginx tools will bypass us.
    const TRUSTED_DOMAINS = [
        'thesis-osamah-lab.live',
        'www.thesis-osamah-lab.live',
        'localhost',
        '127.0.0.1'
    ];

    // Check if the current host matches any trusted domain
    // We use .some() to ensure exact matches or subdomains
    const isAuthorized = TRUSTED_DOMAINS.some(domain => 
        clientHost === domain || clientHost.endsWith(`.${domain}`)
    );

    if (!isAuthorized) {
        console.warn(`\x1b[33m[Security Lab 3] BLOCKED: Host '${clientHost}' is not in the whitelist.\x1b[0m`);
        console.warn(`[DEBUG] Expected one of: ${JSON.stringify(TRUSTED_DOMAINS)}`);
        
        return res.status(403).json({
            message: `Access Denied: Domain '${clientHost}' is not authorized. Security Logs Updated.`
        });
    }

    console.log(`[DEBUG] Lab 3 Check Passed for: ${clientHost}`);
    next();
};

module.exports = detectProxy;