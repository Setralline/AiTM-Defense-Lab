import { describe, it, expect } from 'vitest';
import { validateEmail, validatePassword, validateLoginForm } from '../../src/utils/validation';

describe('Security Validation Logic', () => {
  
  describe('Email Validation', () => {
    it('should accept valid emails', () => {
      expect(validateEmail('admin@lab.com')).toBeNull();
      expect(validateEmail('user.name+tag@domain.co.uk')).toBeNull();
    });

    it('should reject invalid emails', () => {
      expect(validateEmail('plainaddress')).toBe('Invalid email address format.');
      expect(validateEmail('@missingusername.com')).toBe('Invalid email address format.');
      expect(validateEmail(null)).toBe('Email is required.');
    });
  });

  describe('Password Complexity (OWASP)', () => {
    it('should reject short passwords', () => {
      expect(validatePassword('Ab1!')).toBe('Password must be at least 8 characters long.');
    });

    it('should reject passwords missing complexity', () => {
      expect(validatePassword('alllowercase1!')).toBe('Password must contain uppercase, lowercase, and a number/symbol.');
      expect(validatePassword('ALLUPPERCASE1!')).toBe('Password must contain uppercase, lowercase, and a number/symbol.');
      expect(validatePassword('NoNumbersOrSymbols')).toBe('Password must contain uppercase, lowercase, and a number/symbol.');
    });

    it('should accept strong passwords', () => {
      expect(validatePassword('StrongP@ss1')).toBeNull();
    });
  });

  describe('Login Form Integration', () => {
    it('should return the first error found', () => {
      // Invalid Email
      expect(validateLoginForm('bad-email', 'StrongP@ss1')).toBe('Invalid email address format.');
      // Valid Email, Bad Password
      expect(validateLoginForm('admin@lab.com', 'weak')).toBe('Password must be at least 8 characters long.');
    });

    it('should return null for valid credentials', () => {
      expect(validateLoginForm('admin@lab.com', 'StrongP@ss1')).toBeNull();
    });
  });
});