import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaUserAstronaut, FaKey, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';
import authService from '../../services/authService';

// UI Components (BEM Architecture)
import Card from '../layout/Card';
import InputGroup from '../ui/InputGroup';
import Button from '../ui/Button';
import Checkbox from '../ui/Checkbox';
import Dashboard from './Dashboard';

/**
 * Level 2 Component: Modern Authentication Simulation (JWT)
 * Simulates a Single Page Application (SPA) environment where tokens are 
 * managed explicitly by the client logic.
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
        // Step A: Initial Credential Exchange (JSON Payload)
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
      toast.error(err.sanitizedMessage || 'Token Rejected.', { id: tId });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Finalizes the login and persists the JWT.
   * CRITICAL: Explicit storage simulates XSS vulnerability surface.
   */
  const finalizeLogin = (res, tId) => {
    const { token, user: userData } = res;
    
    // Determine storage persistence based on user preference
    const storage = formData.rememberMe ? localStorage : sessionStorage;
    
    // Clean slate protocol
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
      await authService.logout();
    } catch (err) {
      console.error('Revocation failed:', err);
    } finally {
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
            
            {/* New BEM Checkbox Component */}
            <Checkbox 
              label="Stay Persistent (JWT)" 
              name="rememberMe" 
              checked={formData.rememberMe} 
              onChange={handleChange} 
            />
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

        {/* BEM Actions Wrapper */}
        <div className="form-actions">
          <Button type="submit" disabled={isLoading} fullWidth>
            {isLoading ? 'PROCESSING...' : (step === 1 ? 'INITIATE' : 'VERIFY')}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => navigate('/')} 
            fullWidth 
          >
            <FaArrowLeft /> RETURN TO BASE
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default Level2;