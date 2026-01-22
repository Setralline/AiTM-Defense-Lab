import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaGlobe, FaKey, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';
import authService from '../services/authService';
import { validateLoginForm } from '../utils/validation';

// UI Components
import Card from '../components/layout/Card';
import InputGroup from '../components/ui/InputGroup';
import Button from '../components/ui/Button';
import Checkbox from '../components/ui/Checkbox';
import Dashboard from '../components/features/Dashboard';
import DomainGuard from '../components/features/DomainGuard'; 

/**
 * ------------------------------------------------------------------
 * LEVEL 4: CLIENT-SIDE DEFENSE (DOMAIN GUARD)
 * ------------------------------------------------------------------
 * Visually identical to Level 2 (SPA/JWT), but includes an active 
 * JavaScript check (DomainGuard) that inspects the browser's URL bar.
 * * * Security Characteristics:
 * - Defense: Client-Side JavaScript (DOM-based detection)
 * - Mechanism: "Kills" the page/redirects if window.location.hostname != whitelist.
 * - Persistence: Handled via centralized authService.
 */
const Level4 = ({ user, setUser }) => {
  const navigate = useNavigate();

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    code: '',
    rememberMe: false
  });

  // =========================================================================
  // 1. SESSION & SECURITY SYNC
  // =========================================================================
  useEffect(() => {
    let isMounted = true;
    const initializeLevel = async () => {
      try {
        // التحقق من الجلسة الحالية
        const data = await authService.getCurrentUser();
        if (isMounted && data.user) setUser(data.user);
      } catch (err) {
        // Silent catch
      }
    };
    initializeLevel();
    return () => { isMounted = false; };
  }, [setUser]);

  // =========================================================================
  // 2. HANDLERS
  // =========================================================================
  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const finalizeLogin = (res, tId) => {
    const { user: userData } = res;
    setUser(userData);
    toast.success(`Welcome back, ${userData.name}`, { id: tId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const tId = toast.loading(step === 1 ? 'Authenticating...' : 'Validating MFA...');

    try {
      if (step === 1) {
        const validationError = validateLoginForm(formData.email, formData.password);
        if (validationError) {
          toast.error(validationError, { id: tId });
          setIsLoading(false);
          return;
        }

        const res = await authService.loginModern(
          formData.email.trim(),
          formData.password,
          'v2',
          formData.rememberMe
        );

        if (res.mfa_required) {
          setTempToken(res.temp_token);
          setStep(2);
          toast.success('Credentials Accepted.', { id: tId });
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
      toast.error(err.response?.data?.message || 'Login Failed.', { id: tId });
    } finally {
      setIsLoading(false);
    }
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
      toast.success('Logged out.', { id: tId });
      navigate('/level4');
    }
  };

  // =========================================================================
  // 3. UI RENDERING
  // =========================================================================

  if (user) return <Dashboard user={user} setUser={setUser} onLogout={handleLogout} />;

  if (!isVerified) {
    return (
      <DomainGuard onVerified={() => setIsVerified(true)} />
    );
  }

  return (
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
  );
};

export default Level4;