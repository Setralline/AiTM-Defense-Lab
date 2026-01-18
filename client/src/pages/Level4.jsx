import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaGlobe, FaKey, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';
import authService from '../services/authService';

// UI Components (BEM Architecture)
import Card from '../components/layout/Card';
import InputGroup from '../components/ui/InputGroup';
import Button from '../components/ui/Button';
import Checkbox from '../components/ui/Checkbox';
import Dashboard from '../components/features/Dashboard';
import DomainGuard from '../components/features/DomainGuard'; // <--- The Client-Side Defense

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
  const [step, setStep] = useState(1); // 1: Credentials, 2: MFA
  const [isLoading, setIsLoading] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    code: '',
    rememberMe: false
  });

  // =========================================================================
  // 1. SESSION SYNCHRONIZATION
  // =========================================================================
  useEffect(() => {
    let isMounted = true;
    const checkSession = async () => {
      try {
        const data = await authService.getCurrentUser();
        if (isMounted && data.user) setUser(data.user);
      } catch (err) {
        // Silent catch
      }
    };
    checkSession();
    return () => { isMounted = false; };
  }, [setUser]);

  // =========================================================================
  // 2. HANDLERS & LOGIC
  // =========================================================================

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  /**
   * Updates local state upon successful authentication.
   * Defined BEFORE usage to prevent ReferenceErrors.
   */
  const finalizeLogin = (res, tId) => {
    // Auth logic is handled by the service. We just update the UI.
    const { user: userData } = res;
    setUser(userData);
    toast.success(`Welcome back, ${userData.name}`, { id: tId });
  };

  /**
   * Main Login Flow
   * Relies on the standard 'v2' endpoint, as the defense is handled 
   * entirely by the <DomainGuard /> component in the DOM.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const tId = toast.loading(step === 1 ? 'Checking Domain Integrity...' : 'Validating MFA...');

    try {
      if (step === 1) {
        // ---------------------------------------------------
        // STEP A: CREDENTIAL EXCHANGE
        // ---------------------------------------------------
        // Uses 'v2' because the backend defense is not active here.
        // The protection is the <DomainGuard /> component below.
        const res = await authService.loginModern(
          formData.email.trim(),
          formData.password,
          'v2',
          formData.rememberMe
        );

        if (res.mfa_required) {
          setTempToken(res.temp_token);
          setStep(2);
          toast.success('Domain Verified. Credentials Accepted.', { id: tId });
        } else {
          finalizeLogin(res, tId);
        }
      } else {
        // ---------------------------------------------------
        // STEP B: MFA VERIFICATION
        // ---------------------------------------------------
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
      toast.success('See you soon.', { id: tId, icon: '👋' });
      navigate('/level4');
    }
  };

  // =========================================================================
  // 3. UI RENDERING
  // =========================================================================

  if (user) return <Dashboard user={user} setUser={setUser} onLogout={handleLogout} />;

  return (
    <>
      {/* 🛡️ ACTIVE DEFENSE: Runs silently in background checking window.location */}
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