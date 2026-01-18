import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaFingerprint, FaKey, FaArrowLeft, FaUserAstronaut, FaTrashAlt } from 'react-icons/fa';
import authService from '../../services/authService';

// UI Components (BEM Architecture)
import Card from '../layout/Card';
import InputGroup from '../ui/InputGroup';
import Button from '../ui/Button';
import Checkbox from '../ui/Checkbox';
import Dashboard from './Dashboard';

/**
 * ------------------------------------------------------------------
 * LEVEL 5: PURE FIDO2 / WEBAUTHN AUTHENTICATION
 * ------------------------------------------------------------------
 * Focuses exclusively on Hardware-Bound Authentication.
 * Legacy TOTP (MFA) steps have been removed to isolate the 
 * analysis of Phishing-Resistant FIDO protocols.
 */
const Level5 = ({ user, setUser }) => {
  const navigate = useNavigate();

  // =========================================================================
  // STATE MANAGEMENT
  // =========================================================================
  // Steps: 1 = Password Check, 2 = Hardware Challenge
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  
  // Note: 'code' is removed as we are not using TOTP here
  const [formData, setFormData] = useState({ 
    email: '', 
    password: '', 
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
   */
  const finalizeLogin = (res, tId) => {
    setUser(res.user);
    toast.success(`Secure Identity Verified. Welcome, ${res.user.name}`, { id: tId });
    setStep(1);
  };

  /**
   * Step 1: Initial Password Check
   * Checks if the user has a FIDO key registered.
   */
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const tId = toast.loading('Verifying Credentials...');

    try {
      const res = await authService.fidoLoginWithPassword(
        formData.email.trim(), 
        formData.password, 
        formData.rememberMe
      );

      // Check if backend indicates a FIDO key exists
      if (res.status === 'fido_required' || (res.user && res.user.has_fido)) {
        setStep(2); // Move to Hardware Challenge
        toast.success('Credentials Valid. Touch Security Key.', { id: tId });
      } else {
        // If no FIDO key is enrolled, login directly so they can enroll inside
        finalizeLogin(res, tId);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Access Denied.', { id: tId });
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Step 2: Hardware Ceremony (WebAuthn)
   * The browser interacts directly with the Authenticator (USB/NFC).
   */
  const handleFidoVerify = async () => {
    setIsLoading(true);
    const tId = toast.loading('Communicating with Authenticator...');

    try {
      const res = await authService.fidoLogin(formData.email, formData.rememberMe);
      if (res.verified) finalizeLogin(res, tId);
    } catch (err) {
      toast.error('Key Verification Failed or Cancelled.', { id: tId });
    } finally {
      setIsLoading(false);
    }
  };

  // =========================================================================
  // 3. KEY MANAGEMENT (ENROLL/DISABLE)
  // =========================================================================

  const handleEnrollKey = async () => {
    const tId = toast.loading('Registering new hardware key...');
    try {
      await authService.fidoRegister(user.email, true);
      toast.success('Key Enrolled Successfully!', { id: tId });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Enrollment Failed.', { id: tId });
    }
  };

  const handleDisableKey = async () => {
    const tId = toast.loading('Revoking hardware credential...');
    try {
      await authService.fidoDisable(user.email);
      toast.success('FIDO Key Disabled.', { id: tId });
      setTimeout(() => window.location.reload(), 1000);
    } catch (err) {
      toast.error('Disable Failed.', { id: tId });
    }
  };

  const handleLogout = async () => {
    const tId = toast.loading('Terminating secure session...');
    try {
      await authService.logout();
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setUser(null);
      setStep(1);
      toast.success('Session Closed.', { id: tId, icon: '🔒' });
      navigate('/level5');
    }
  };

  // =========================================================================
  // 4. UI RENDERING
  // =========================================================================

  if (user) return (
    <Dashboard user={user} setUser={setUser} onLogout={handleLogout}>
      <div className="info-panel" style={{ marginTop: '20px' }}>
        <div className="info-panel__row">
          <FaFingerprint className="info-panel__icon" />
          <span className="info-panel__text">HARDWARE SECURITY MODULE</span>
        </div>
        <p style={{ marginBottom: '15px', fontSize: '0.9rem', color: '#8892b0' }}>
          Manage your WebAuthn/FIDO2 authenticators.
        </p>
        
        {user.has_fido ? (
          <Button onClick={handleDisableKey} variant="danger" fullWidth>
            <FaTrashAlt /> DISABLE FIDO KEY
          </Button>
        ) : (
          <Button onClick={handleEnrollKey} variant="primary" fullWidth>
            <FaFingerprint /> ENROLL SECURITY KEY
          </Button>
        )}
      </div>
    </Dashboard>
  );

  return (
    <Card title={step === 1 ? "OPERATIVE LOGIN" : "HARDWARE CHALLENGE"}>
      <form onSubmit={step === 1 ? handlePasswordLogin : (e) => e.preventDefault()}>
        
        {/* Step 1: Password Entry */}
        {step === 1 && (
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
              label="Stay Persistent (1 Year)" 
              name="rememberMe" 
              checked={formData.rememberMe} 
              onChange={handleChange} 
            />
          </>
        )}

        {/* Step 2: FIDO2 Interaction UI */}
        {step === 2 && (
          <div className="animate-fade-in" style={{ textAlign: 'center', padding: '20px 0' }}>
            <FaFingerprint 
              style={{ 
                fontSize: '4rem', 
                marginBottom: '20px', 
                color: 'var(--cyber-green)',
                filter: 'drop-shadow(0 0 15px rgba(0,255,65,0.4))'
              }} 
            />
            <p className="home-desc" style={{ marginBottom: '10px' }}>
              Security Key Detected.
            </p>
            <p className="home-desc" style={{ fontSize: '0.9rem', opacity: 0.8 }}>
              Please touch your device to authenticate.
            </p>
          </div>
        )}

        {/* Actions */}
        <div className="form-actions">
          {step === 1 ? (
            <Button type="submit" disabled={isLoading} fullWidth>
              {isLoading ? 'PROCESSING...' : 'INITIATE'}
            </Button>
          ) : (
            <Button 
              type="button" 
              onClick={handleFidoVerify} 
              variant="primary" 
              fullWidth
            >
              ACTIVATE KEY
            </Button>
          )}

          <Button 
            type="button" 
            variant="secondary" 
            onClick={() => step === 1 ? navigate('/') : setStep(1)} 
            fullWidth
          >
            <FaArrowLeft /> {step === 1 ? 'RETURN TO BASE' : 'CANCEL'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default Level5;