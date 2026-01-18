const config = require('../config/env');

/**
 * Lab 3 Defense: Header Analysis & Proxy Detection
 * Blocks requests if the Host header doesn't match the allowed domains defined in config.
 * Mitigates Host Header Injection and some AiTM scenarios.
 */
const detectProxy = (req, res, next) => {
    const hostHeader = req.headers['host'];

    // Use allowed hosts from config, fallback to localhost defaults if missing
    const allowedHosts = config.security.allowedHosts || ['localhost:5000', '127.0.0.1:5000'];

    // Check if the incoming Host header is in our allowlist
    if (!allowedHosts.includes(hostHeader)) {
        console.warn(`[Security] 🚨 Blocked Suspicious Host Header: ${hostHeader}`);
        return res.status(403).json({
            error: "Security Violation",
            message: "Access Denied: Origin mismatch detected (Host Header Defense)."
        });
    }

    next();
};

module.exports = detectProxy;