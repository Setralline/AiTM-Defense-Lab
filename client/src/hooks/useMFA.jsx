import { useState } from 'react';
import toast from 'react-hot-toast';
import authService from '../services/authService';

const useMFA = (user, setUser) => {
  const [qrCode, setQrCode] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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

  const disableMFA = () => {
    toast((t) => (
      <div style={{ textAlign: 'center' }}>
        <b style={{ color: '#ff4444', display: 'block', marginBottom: '8px' }}>CRITICAL SECURITY WARNING</b>
        Deactivating MFA will lower your clearance. Proceed?
        <div style={{ marginTop: '12px', display: 'flex', gap: '10px', justifyContent: 'center' }}>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              executeDisableMFA();
            }}
            style={{
              background: '#ff4444', color: '#fff', border: 'none', padding: '5px 12px',
              borderRadius: '3px', cursor: 'pointer', fontSize: '11px', fontWeight: 'bold'
            }}
          >
            CONFIRM
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              background: '#333', color: '#fff', border: 'none', padding: '5px 12px',
              borderRadius: '3px', cursor: 'pointer', fontSize: '11px'
            }}
          >
            ABORT
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      style: { border: '1px solid #ff4444' }
    });
  };

  return { isMfaEnabled, qrCode, setQrCode, enableMFA, disableMFA, loading, error };
};

export default useMFA;