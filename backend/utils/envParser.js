/**
 * Helper to parse comma-separated lists from .env
 * Example: "https://a.com,https://b.com" -> ['https://a.com', 'https://b.com']
 */
const getOrigins = () => {
  if (process.env.EXPECTED_ORIGINS) {
    return process.env.EXPECTED_ORIGINS.split(',');
  }
  // Default fallbacks for local dev (Vite & Docker)
  return ['http://localhost:5173', 'http://localhost'];
};

module.exports = { getOrigins };