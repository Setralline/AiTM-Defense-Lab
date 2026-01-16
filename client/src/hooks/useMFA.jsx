import React, { useState } from 'react';
import toast from 'react-hot-toast';
import authService from '../services/authService';

/**
 * useMFA Hook
 * Manages the logic for enabling/disabling TOTP Multi-Factor Authentication.
 */
const useMFA = (user, setUser) => {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Determine if MFA is active based on the secret's presence
  const isMfaEnabled = !!(user?.mfa_secret);

  const enableMFA = async () => {
    if (!user?.email) {
      toast.error('Identity context missing.');
      return;
    }
    setLoading(true);
    const mfaToast = toast.loading('Generating secure encryption keys...');
    
    try {
      const res = await authService.enableMFA({ email: user.email });
      if (res.success) {
        setQrCode(res.qrCode);
        if (typeof setUser === 'function') setUser({ ...user, mfa_secret: res.secret });
        toast.success('Security keys generated.', { id: mfaToast });
      } else {
        toast.error(res.message || 'Key generation failed.', { id: mfaToast });
      }
    } catch (err) {
      toast.error('Connection failure.', { id: mfaToast });
    } finally {
      setLoading(false);
    }
  };

  const executeDisableMFA = async () => {
    setLoading(true);
    const disableToast = toast.loading('Purging security secret...');
    
    try {
      const res = await authService.disableMFA({ email: user.email });
      if (res.success) {
        setQrCode(null);
        if (typeof setUser === 'function') setUser({ ...user, mfa_secret: null });
        toast.success('MFA protection deactivated.', { id: disableToast });
      } else {
        toast.error('Deactivation failed.', { id: disableToast });
      }
    } catch (err) {
      toast.error('System integrity preserved.', { id: disableToast });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Triggers a custom toast notification requiring explicit confirmation.
   * Uses BEM classes for styling instead of inline styles.
   */
  const disableMFA = () => {
    toast((t) => (
      <div className="toast-alert">
        <b className="toast-alert__title">CRITICAL SECURITY WARNING</b>
        Deactivating MFA will lower your clearance. Proceed?
        
        <div className="toast-alert__actions">
          <button
            className="toast-alert__btn toast-alert__btn--confirm"
            onClick={() => {
              toast.dismiss(t.id);
              executeDisableMFA();
            }}
          >
            CONFIRM
          </button>
          
          <button
            className="toast-alert__btn"
            onClick={() => toast.dismiss(t.id)}
          >
            ABORT
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      className: 'toast-custom-border' // Optional helper class if needed
    });
  };

  return { isMfaEnabled, qrCode, setQrCode, enableMFA, disableMFA, loading, error };
};

export default useMFA;