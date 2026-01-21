/**
 * ------------------------------------------------------------------
 * SECURITY VALIDATION UTILITIES (OWASP COMPLIANT)
 * ------------------------------------------------------------------
 * Centralized logic for input validation to prevent invalid data 
 * from reaching the backend.
 */

// OWASP Email Regex (Standard HTML5 Spec)
const EMAIL_REGEX = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// Password Complexity: Min 8 chars, 1 Upper, 1 Lower, 1 Number/Symbol
const PASSWORD_COMPLEXITY = /^(?=.*[a-z])(?=.*[A-Z])(?=.*[\d\W]).{8,}$/;

export const validateEmail = (email) => {
  if (!email) return 'Email is required.';
  if (!EMAIL_REGEX.test(email)) return 'Invalid email address format.';
  return null;
};

export const validatePassword = (password) => {
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  
  // Enforce complexity for realism (OWASP recommendations)
  if (!PASSWORD_COMPLEXITY.test(password)) {
    return 'Password must contain uppercase, lowercase, and a number/symbol.';
  }
  return null;
};

/**
 * Validates a complete login form payload.
 * Returns the first error message found, or null if valid.
 */
export const validateLoginForm = (email, password) => {
  const emailError = validateEmail(email);
  if (emailError) return emailError;

  const passError = validatePassword(password);
  if (passError) return passError;

  return null;
};