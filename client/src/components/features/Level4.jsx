import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaGlobe, FaKey, FaShieldAlt, FaArrowLeft } from 'react-icons/fa'; // Icon changed to Globe
import authService from '../../services/authService';

// UI Components (BEM Architecture)
import Card from '../layout/Card';
import InputGroup from '../ui/InputGroup';
import Button from '../ui/Button';
import Checkbox from '../ui/Checkbox';
import Dashboard from './Dashboard';
import DomainGuard from '../defenses/DomainGuard'; // <--- The Client-Side Defense

/**
 * Level 4 Component: Client-Side Defense (Domain Guard)
 * Visually identical to Level 2 & 3, but includes an active JavaScript
 * check (DomainGuard) that "kills" the page if the domain is mismatched.
 */
const Level4 = ({ user, setUser }) => {
  const navigate = useNavigate();
  
  // State Management
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
    const tId = toast.loading(step === 1 ? 'Checking Domain Integrity...' : 'Validating MFA...');

    try {
      if (step === 1) {
        // Step A: Initial Credential Exchange
        // Uses 'v2' endpoint (Vulnerable Backend) because defense is purely Client-Side
        const res = await authService.loginModern(
          formData.email.trim(),
          formData.password,
          'v2' 
        );

        if (res.mfa_required) {
          setTempToken(res.temp_token);
          setStep(2);
          toast.success('Domain Verified. Credentials Accepted.', { id: tId });
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
      toast.error(err.message || 'Login Failed.', { id: tId });
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
    toast.success(`Welcome back, ${userData.name}`, { id: tId });
  };

  const handleLogout = async () => {
    const tId = toast.loading('Logging out...');
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setUser(null);
      setStep(1);
      toast.success('See you soon.', { id: tId, icon: '👋' });
      navigate('/level4');
    }
  };

  if (user) return <Dashboard user={user} setUser={setUser} onLogout={handleLogout} />;

  return (
    <>
      {/* 🛡️ ACTIVE DEFENSE: Runs silently in background */}
      <DomainGuard />

      <Card title={step === 1 ? "DOMAIN GUARD AUTH" : "2-FACTOR AUTH"}>
        <form onSubmit={handleSubmit}>
          {step === 1 ? (
            <>
              <InputGroup 
                icon={<FaGlobe />} 
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
              {isLoading ? 'VERIFYING...' : (step === 1 ? 'SECURE LOGIN' : 'VERIFY')}
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
    </>
  );
};

export default Level4;