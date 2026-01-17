/**
 * Lab 3 Defense: Header Analysis
 * Blocks requests if the Host header doesn't match the allowed domain.
 */
const detectProxy = (req, res, next) => {
    const hostHeader = req.headers['host'];
    
    // Allow Production Domain & Localhost
    const ALLOWED_DOMAINS = ['thesis-osamah-lab.live', 'localhost:5000', '127.0.0.1:5000'];

    // Check Logic
    if (!ALLOWED_DOMAINS.includes(hostHeader)) {
        console.warn(`[Lab 3] 🚨 Blocked Proxy Request: ${hostHeader}`);
        return res.status(403).json({
            error: "Security Violation",
            message: "Access Denied: Origin mismatch detected (Host Header Defense)."
        });
    }

    next();
};

module.exports = detectProxy;