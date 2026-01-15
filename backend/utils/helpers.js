const jwt = require('jsonwebtoken');

/**
 * Generates a JSON Web Token (JWT) for a user.
 * * @param {Object} user - The user object from the database.
 * @param {boolean} rememberMe - Determines the expiration time.
 * @returns {string} Signed JWT.
 */
const generateToken = (user, rememberMe) => {
  // Logic: "Remember Me" grants a long-lived token (1 year), otherwise standard session (1 hour)
  const expiresIn = rememberMe ? '365d' : '1h'; 
  
  return jwt.sign(
    { id: user.id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn }
  );
};

module.exports = { generateToken };