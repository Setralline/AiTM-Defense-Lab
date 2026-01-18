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
  
  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================
  const [step, setStep] = useState(1); // 1: Credentials, 2: MFA
  const [isLoading, setIsLoading] = useState(false);
  const [tempToken, setTempToken] = useState(''); // Temporary token for MFA handover
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
        // Silent failure expected if no session exists
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
    // Note: authService has already handled token storage.
    // We only need to update the UI state here.
    const { user: userData } = res;
    setUser(userData);
    toast.success(`Access Granted. Welcome, ${userData.name}`, { id: tId });
  };

  /**
   * Main Login Flow
   * Handles both initial credential exchange and secondary MFA verification.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const tId = toast.loading(step === 1 ? 'Handshaking...' : 'Validating MFA payload...');

    try {
      if (step === 1) {
        // ---------------------------------------------------
        // STEP A: INITIAL CREDENTIAL EXCHANGE
        // ---------------------------------------------------
        const res = await authService.loginLevel2({
          email: formData.email.trim(),
          password: formData.password,
          rememberMe: formData.rememberMe // Critical: pass persistence preference
        });

        if (res.mfa_required) {
          setTempToken(res.temp_token);
          setStep(2);
          toast.success('Credentials verified. Awaiting MFA.', { id: tId });
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
          rememberMe: formData.rememberMe // Ensure MFA flow also respects persistence
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

  // =========================================================================
  // 3. UI RENDERING
  // =========================================================================

  // If authenticated, show the Dashboard "Victim" View
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
            
            {/* Persistence Option (JWT in LocalStorage vs SessionStorage) */}
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