import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaUserAstronaut, FaKey, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';
import authService from '../../services/authService';
import Card from '../layout/Card';
import InputGroup from '../ui/InputGroup';
import Button from '../ui/Button';
import Dashboard from './Dashboard';
import { cyberStyles as styles } from '../../utils/themeStyles';

/**
 * Level 2 Component: Modern Authentication Simulation (JWT)
 * Simulates a Single Page Application (SPA) environment where tokens are 
 * managed explicitly by the client logic, making them susceptible to XSS but 
 * allowing for stateless architecture.
 */
const Level2 = ({ user, setUser }) => {
  const navigate = useNavigate();
  
  // State Management
  const [step, setStep] = useState(1); // 1: Credentials, 2: MFA
  const [isLoading, setIsLoading] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    code: '', 
    rememberMe: false 
  });

  // 1. Session Validation
  // Checks for existing JWT in local/session storage on mount.
  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await authService.getCurrentUser();
        if (data.user) setUser(data.user);
      } catch (err) {
        // Silent catch: User is simply unauthenticated
      }
    };
    checkSession();
  }, [setUser]);

  // 2. Input Handler
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // 3. Authentication Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const tId = toast.loading(step === 1 ? 'Handshaking...' : 'Validating MFA payload...');

    try {
      if (step === 1) {
        // Step A: Initial Credential Exchange
        // We send a standard JSON payload here (handled by axios default headers in authService)
        const res = await authService.loginLevel2({
          email: formData.email.trim(),
          password: formData.password,
          rememberMe: formData.rememberMe
        });

        if (res.mfa_required) {
          setTempToken(res.temp_token);
          setStep(2);
          toast.success('Credentials verified. Awaiting MFA.', { id: tId });
        } else {
          finalizeLogin(res, tId);
        }
      } else {
        // Step B: MFA Verification
        const res = await authService.verifyMfa({
          email: formData.email.trim(),
          code: formData.code.trim(),
          temp_token: tempToken
        });
        
        if (res.success) finalizeLogin(res, tId);
      }
    } catch (err) {
      // Use sanitized error message from interceptor
      toast.error(err.sanitizedMessage || 'Token Rejected.', { id: tId });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Finalizes the login and persists the JWT.
   * CRITICAL: This explicit storage is what differentiates Level 2 from Level 1.
   * It simulates the attack surface where tokens are accessible via JavaScript.
   */
  const finalizeLogin = (res, tId) => {
    const { token, user: userData } = res;
    
    // Determine storage persistence based on user preference
    const storage = formData.rememberMe ? localStorage : sessionStorage;
    
    // Clean slate protocol: Remove any conflicting tokens first
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    
    // Store the new Bearer Token
    if (token) storage.setItem('auth_token', token);
    
    setUser(userData);
    toast.success(`Access Granted. Welcome, ${userData.name}`, { id: tId });
  };

  // 4. Secure Logout Handler (Active Revocation)
  const handleLogout = async () => {
    const tId = toast.loading('Revoking JWT...');
    try {
      // CRITICAL: Call backend to blacklist this specific token
      await authService.logout();
    } catch (err) {
      console.error('Revocation failed:', err);
    } finally {
      // Local Cleanup
      setUser(null);
      setStep(1);
      toast.success('Token Revoked & Session Terminated.', { id: tId, icon: '🔑' });
      navigate('/level2');
    }
  };

  // Render Dashboard if authenticated
  if (user) return <Dashboard user={user} setUser={setUser} onLogout={handleLogout} />;

  return (
    <Card title={step === 1 ? "TOKEN AUTHENTICATION" : "2-FACTOR AUTH"}>
      <form onSubmit={handleSubmit}>
        {step === 1 ? (
          <>
            <InputGroup 
              icon={<FaUserAstronaut />} 
              type="email" 
              name="email" 
              placeholder="Email" 
              onChange={handleChange} 
              required 
            />
            <InputGroup 
              icon={<FaKey />} 
              type="password" 
              name="password" 
              placeholder="Passcode" 
              onChange={handleChange} 
              required 
            />
            <div style={styles.checkboxContainer}>
              <input 
                type="checkbox" 
                name="rememberMe" 
                onChange={handleChange} 
                checked={formData.rememberMe} 
                style={{ marginRight: '8px', accentColor: 'var(--cyber-red)' }} 
              />
              <label>Stay Persistent (JWT)</label>
            </div>
          </>
        ) : (
          <InputGroup 
            icon={<FaShieldAlt />} 
            type="text" 
            name="code" 
            placeholder="6-Digit Token" 
            onChange={handleChange} 
            maxLength={6} 
            highlight 
            autoFocus 
          />
        )}

        <div style={styles.actions}>
          <Button type="submit" disabled={isLoading} fullWidth>
            {isLoading ? 'PROCESSING...' : (step === 1 ? 'INITIATE' : 'VERIFY')}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => navigate('/')} 
            fullWidth 
            style={styles.returnBtn}
          >
            <FaArrowLeft /> RETURN TO BASE
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default Level2;