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
 * Level 1 Component: Legacy Authentication Simulation
 * Simulates a traditional web application environment using Cookies and Form Data.
 */
const Level1 = ({ user, setUser }) => {
  const navigate = useNavigate();
  
  // State Management
  const [step, setStep] = useState(1); // 1: Credentials, 2: MFA
  const [isLoading, setIsLoading] = useState(false);
  const [tempToken, setTempToken] = useState(''); // Temporary token for MFA challenge
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
    code: '', 
    rememberMe: false 
  });

  // 1. Session Synchronization on Mount
  // Checks if the user is already authenticated via an HttpOnly cookie.
  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await authService.getCurrentUser();
        if (data.user) setUser(data.user);
      } catch (err) {
        // Silent failure is expected if no session exists.
      }
    };
    checkSession();
  }, [setUser]);

  // 2. Form Input Handler
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // 3. Authentication Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const tId = toast.loading(step === 1 ? 'Verifying Identity...' : 'Validating MFA...');

    try {
      if (step === 1) {
        // CRITICAL: Construct URLSearchParams to match 'application/x-www-form-urlencoded' header
        // This simulates a legacy HTML form submission.
        const params = new URLSearchParams();
        params.append('email', formData.email.trim());
        params.append('password', formData.password);
        params.append('rememberMe', formData.rememberMe);

        const res = await authService.loginLevel1(params);
        
        // Handle MFA Challenge
        if (res.mfa_required) {
          setTempToken(res.temp_token);
          setStep(2);
          toast.success('MFA Required.', { id: tId });
        } else {
          finalizeLogin(res, tId);
        }
      } else {
        // MFA Verification Phase
        const res = await authService.verifyMfa({ 
          email: formData.email.trim(), 
          code: formData.code.trim(), 
          temp_token: tempToken 
        });
        
        if (res.success) finalizeLogin(res, tId);
      }
    } catch (err) {
      // Use the sanitized error message from our Axios interceptor
      toast.error(err.sanitizedMessage || 'Access Denied.', { id: tId });
    } finally { 
      setIsLoading(false); 
    }
  };

  // 4. State Finalization
  const finalizeLogin = (res, tId) => {
    // Level 1 relies on cookies, but we store user metadata for the UI
    setUser(res.user);
    toast.success(`Welcome, ${res.user.name}`, { id: tId });
  };

  // 5. Secure Logout Handler
  const handleLogout = async () => {
    const tId = toast.loading('Terminating session...');
    try {
      // Trigger Active Revocation (Blacklisting)
      await authService.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      // Force UI cleanup
      setUser(null);
      setStep(1);
      toast.success('Session Revoked & Terminated.', { id: tId, icon: '🛡️' });
      navigate('/level1');
    }
  };

  // Render Dashboard if authenticated
  if (user) return <Dashboard user={user} setUser={setUser} onLogout={handleLogout} />;

  return (
    <Card title={step === 1 ? "IDENTITY VERIFICATION" : "2-FACTOR AUTH"}>
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
              <label>Remember terminal</label>
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

export default Level1;