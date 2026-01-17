import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaUserShield, FaKey, FaShieldAlt, FaArrowLeft } from 'react-icons/fa'; // Changed Icon to UserShield
import authService from '../../services/authService';

// UI Components (BEM Architecture)
import Card from '../layout/Card';
import InputGroup from '../ui/InputGroup';
import Button from '../ui/Button';
import Checkbox from '../ui/Checkbox';
import Dashboard from './Dashboard';

/**
 * Level 3 Component: Server-Side Defense (Header Analysis)
 * Structurally identical to Level 2 (SPA/JWT) but targets a protected endpoint
 * that inspects HTTP headers for proxy anomalies.
 */
const Level3 = ({ user, setUser }) => {
  const navigate = useNavigate();
  
  // State Management (Identical to Level 2)
  const [step, setStep] = useState(1);
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
        // Silent catch
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
    const tId = toast.loading(step === 1 ? 'Analyzing Headers...' : 'Validating MFA...');

    try {
      if (step === 1) {
        // Step A: Initial Credential Exchange
        // CRITICAL CHANGE: passing 'v3' to target the protected endpoint
        const res = await authService.loginModern(
          formData.email.trim(),
          formData.password,
          'v3' 
        );

        if (res.mfa_required) {
          setTempToken(res.temp_token);
          setStep(2);
          toast.success('Headers Valid. Credentials Verified.', { id: tId });
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
      // If blocked by Lab 3 defense, err.message will contain the security warning
      toast.error(err.message || 'Access Denied.', { id: tId });
    } finally {
      setIsLoading(false);
    }
  };

  const finalizeLogin = (res, tId) => {
    const { token, user: userData } = res;
    
    const storage = formData.rememberMe ? localStorage : sessionStorage;
    
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    
    if (token) storage.setItem('auth_token', token);
    
    setUser(userData);
    toast.success(`Secure Connection Established. Welcome, ${userData.name}`, { id: tId });
  };

  const handleLogout = async () => {
    const tId = toast.loading('Terminating Session...');
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setUser(null);
      setStep(1);
      toast.success('Session Closed.', { id: tId, icon: '🔒' });
      navigate('/level3');
    }
  };

  if (user) return <Dashboard user={user} setUser={setUser} onLogout={handleLogout} />;

  return (
    <Card title={step === 1 ? "HEADER ANALYSIS AUTH" : "2-FACTOR AUTH"}>
      <form onSubmit={handleSubmit}>
        {step === 1 ? (
          <>
            <InputGroup 
              icon={<FaUserShield />} 
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

        <div className="form-actions">
          <Button type="submit" disabled={isLoading} fullWidth>
            {isLoading ? 'ANALYZING...' : (step === 1 ? 'SECURE LOGIN' : 'VERIFY')}
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

export default Level3;