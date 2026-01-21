import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaUserAstronaut, FaKey, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';
import authService from '../services/authService';

// UI Components
import Card from '../components/layout/Card';
import InputGroup from '../components/ui/InputGroup';
import Button from '../components/ui/Button';
import Checkbox from '../components/ui/Checkbox';
import Dashboard from '../components/features/Dashboard';

/**
 * ------------------------------------------------------------------
 * LEVEL 1: LEGACY AUTHENTICATION SIMULATION
 * ------------------------------------------------------------------
 * Simulates a traditional enterprise web application environment.
 * * Security Characteristics:
 * - Transmission: application/x-www-form-urlencoded (Legacy standard)
 * - Storage: HttpOnly Cookies (Browser-managed)
 * - Defense: Vulnerable to CSRF (if not protected) and Proxy interception.
 * - Persistence: Controlled by the 'Remember Me' flag affecting Cookie Max-Age.
 */
const Level1 = ({ user, setUser }) => {
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
      } catch (err) { }
    };
    checkSession();
    return () => { isMounted = false; };
  }, [setUser]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const finalizeLogin = (res, tId) => {
    setUser(res.user);
    toast.success(`Access Granted. Welcome, ${res.user.name}`, { id: tId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const tId = toast.loading(step === 1 ? 'Verifying Identity...' : 'Validating MFA...');

    try {
      if (step === 1) {
        // [FIX] FRONTEND PASSWORD VALIDATION
        if (formData.password.length < 8) {
          toast.error('Password must be at least 8 characters.', { id: tId });
          setIsLoading(false);
          return;
        }

        const params = new URLSearchParams();
        params.append('email', formData.email.trim());
        params.append('password', formData.password);
        params.append('rememberMe', formData.rememberMe);

        const res = await authService.loginLevel1(params);

        if (res.mfa_required) {
          setTempToken(res.temp_token);
          setStep(2);
          toast.success('MFA Required. Please check your authenticator.', { id: tId });
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
      // The Axios interceptor now passes the specific error message here
      toast.error(err.response?.data?.message || 'Access Denied.', { id: tId });
    } finally {
      setIsLoading(false);
    }
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
            <Checkbox
              label="Remember terminal (Extend Session)"
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

export default Level1;