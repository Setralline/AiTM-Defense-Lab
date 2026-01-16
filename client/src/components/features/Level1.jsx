import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaUserAstronaut, FaKey, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';
import authService from '../../services/authService';

// UI Components
import Card from '../layout/Card';
import InputGroup from '../ui/InputGroup';
import Button from '../ui/Button';
import Checkbox from '../ui/Checkbox';
import Dashboard from './Dashboard';

/**
 * Level 1 Component: Legacy Authentication Simulation
 * Simulates a traditional web application environment using Cookies and Form Data.
 */
const Level1 = ({ user, setUser }) => {
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

  // 1. Session Synchronization
  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await authService.getCurrentUser();
        if (data.user) setUser(data.user);
      } catch (err) {
        // Silent failure expected
      }
    };
    checkSession();
  }, [setUser]);

  // 2. Input Handler
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  // 3. Auth Logic
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const tId = toast.loading(step === 1 ? 'Verifying Identity...' : 'Validating MFA...');

    try {
      if (step === 1) {
        // Legacy Form Data Simulation
        const params = new URLSearchParams();
        params.append('email', formData.email.trim());
        params.append('password', formData.password);
        params.append('rememberMe', formData.rememberMe);

        const res = await authService.loginLevel1(params);
        
        if (res.mfa_required) {
          setTempToken(res.temp_token);
          setStep(2);
          toast.success('MFA Required.', { id: tId });
        } else {
          finalizeLogin(res, tId);
        }
      } else {
        const res = await authService.verifyMfa({ 
          email: formData.email.trim(), 
          code: formData.code.trim(), 
          temp_token: tempToken 
        });
        
        if (res.success) finalizeLogin(res, tId);
      }
    } catch (err) {
      toast.error(err.sanitizedMessage || 'Access Denied.', { id: tId });
    } finally { 
      setIsLoading(false); 
    }
  };

  const finalizeLogin = (res, tId) => {
    setUser(res.user);
    toast.success(`Welcome, ${res.user.name}`, { id: tId });
  };

  const handleLogout = async () => {
    const tId = toast.loading('Terminating session...');
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setUser(null);
      setStep(1);
      toast.success('Session Revoked.', { id: tId, icon: '🛡️' });
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
            
            {/* New BEM Checkbox Component */}
            <Checkbox 
              label="Remember terminal" 
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

export default Level1;