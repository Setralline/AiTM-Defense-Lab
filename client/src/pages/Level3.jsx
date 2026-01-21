import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaUserShield, FaKey, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';
import authService from '../services/authService';
import { validateLoginForm } from '../utils/validation';

// UI Components (BEM Architecture)
import Card from '../components/layout/Card';
import InputGroup from '../components/ui/InputGroup';
import Button from '../components/ui/Button';
import Checkbox from '../components/ui/Checkbox';
import Dashboard from '../components/features/Dashboard';

/**
 * ------------------------------------------------------------------
 * LEVEL 3: SERVER-SIDE DEFENSE (HEADER ANALYSIS)
 * ------------------------------------------------------------------
 * Structurally identical to Level 2 (SPA/JWT) regarding the frontend flow,
 * but targets a specific backend endpoint ('v3') that enforces strict 
 * Host Header analysis to detect and block Reverse Proxy anomalies.
 * * * Security Characteristics:
 * - Transmission: application/json
 * - Defense: Server-side Middleware (detectProxy.js)
 * - Persistence: Handled via centralized authService.
 */
const Level3 = ({ user, setUser }) => {
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
        // Silent failure expected
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
    toast.success(`Secure Connection Established. Welcome, ${userData.name}`, { id: tId });
  };

  /**
   * Main Login Flow
   * Targets the 'v3' endpoint which includes the Proxy Detection Middleware.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const tId = toast.loading(step === 1 ? 'Analyzing Headers...' : 'Validating MFA...');

    try {
      if (step === 1) {
        // [FIX] FRONTEND PASSWORD VALIDATION (CENTRALIZED)
        const validationError = validateLoginForm(formData.email, formData.password);
        if (validationError) {
          toast.error(validationError, { id: tId });
          setIsLoading(false);
          return;
        }

        // ---------------------------------------------------
        // STEP A: CREDENTIALS (TARGETING V3 ENDPOINT)
        // ---------------------------------------------------
        const res = await authService.loginModern(
          formData.email.trim(),
          formData.password,
          'v3', // <--- Critical: Targets /auth/level3 (Protected Endpoint)
          formData.rememberMe
        );

        if (res.mfa_required) {
          setTempToken(res.temp_token);
          setStep(2);
          toast.success('Headers Valid. Credentials Verified.', { id: tId });
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
      // If blocked by Lab 3 defense, err.message will contain the specific security warning
      toast.error(err.response?.data?.message || 'Access Denied: Potential Proxy Detected.', { id: tId });
    } finally {
      setIsLoading(false);
    }
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

  // =========================================================================
  // 3. UI RENDERING
  // =========================================================================

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