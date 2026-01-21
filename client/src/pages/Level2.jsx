import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaUserAstronaut, FaKey, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';
import authService from '../services/authService';

import Card from '../components/layout/Card';
import InputGroup from '../components/ui/InputGroup';
import Button from '../components/ui/Button';
import Checkbox from '../components/ui/Checkbox';
import Dashboard from '../components/features/Dashboard';

/**
 * ------------------------------------------------------------------
 * LEVEL 2: MODERN AUTHENTICATION SIMULATION (JWT)
 * ------------------------------------------------------------------
 * Simulates a modern Single Page Application (SPA) environment.
 * * Security Characteristics:
 * - Transmission: application/json (Modern standard)
 * - Storage: LocalStorage or SessionStorage (Client-managed)
 * - Vulnerability: Susceptible to XSS attacks (Token Exfiltration)
 * - Persistence: Handled via the 'Remember Me' flag in authService.
 */
const Level2 = ({ user, setUser }) => {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    code: '',
    rememberMe: false
  });

  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const data = await authService.getCurrentUser();
        if (isMounted && data.user) setUser(data.user);
      } catch (err) {}
    };
    checkSession();
    return () => { isMounted = false; };
  }, [setUser]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const finalizeLogin = (res, tId) => {
    const { user: userData } = res;
    setUser(userData);
    toast.success(`Access Granted. Welcome, ${userData.name}`, { id: tId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const tId = toast.loading(step === 1 ? 'Handshaking...' : 'Validating MFA payload...');

    try {
      if (step === 1) {
        // [FIX] FRONTEND PASSWORD VALIDATION
        if (formData.password.length < 8) {
          toast.error('Password must be at least 8 characters.', { id: tId });
          setIsLoading(false);
          return;
        }

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
        const res = await authService.verifyMfa({
          email: formData.email.trim(),
          code: formData.code.trim(),
          temp_token: tempToken,
          rememberMe: formData.rememberMe
        });

        if (res.success) finalizeLogin(res, tId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Token Rejected.', { id: tId });
    } finally {
      setIsLoading(false);
    }
  };

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
            {isLoading ? 'PROCESSING...' : (step === 1 ? 'INITIATE' : 'VERIFY')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/')} fullWidth>
            <FaArrowLeft /> RETURN TO BASE
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default Level2;