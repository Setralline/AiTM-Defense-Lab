import React from 'react';
import toast from 'react-hot-toast';
import { 
  FaUserSecret, FaEnvelope, FaFingerprint, 
  FaQrcode, FaPowerOff, FaLock, FaUnlock 
} from 'react-icons/fa';
import useMFA from '../../hooks/useMFA';
import Card from '../layout/Card';
import Button from '../ui/Button';
import authService from '../../services/authService';

const Dashboard = ({ user, setUser, onLogout }) => {
  const { isMfaEnabled, qrCode, setQrCode, enableMFA, disableMFA, loading } = useMFA(user, setUser);

  /**
   * Terminate Session
   * Synchronizes with the backend to clear cookies and resets local state.
   */
  const handleLogout = async () => {
    try {
      // 1. Call backend to clear HttpOnly cookies and storage tokens
      await authService.logout();
      
      // 2. Visual feedback for the operative
      toast('Session terminated. Security lock active.', { 
        icon: '🚫',
        className: 'toast-custom'
      });

      // 3. Reset React state and redirect to home
      onLogout(); 
    } catch (err) {
      console.error('Termination sequence failed:', err);
      toast.error('System bypass failed. Manual clearance required.');
    }
  };

  return (
    <Card title="OPERATIVE TERMINAL">
      {/* Info Panel Block */}
      <div className="info-panel">
        {/* Clearance Badge Modifier: changes color based on MFA status */}
        <div className={`clearance-badge ${isMfaEnabled ? 'clearance-badge--secure' : 'clearance-badge--restricted'}`}>
          {isMfaEnabled ? 'LEVEL 5 CLEARANCE' : 'RESTRICTED ACCESS'}
        </div>

        {/* User Info Rows */}
        <div className="info-panel__row">
          <span className="info-panel__icon"><FaUserSecret /></span> 
          <span className="info-panel__text">{user?.name?.toUpperCase() || 'UNKNOWN'}</span>
        </div>

        <div className="info-panel__row">
          <span className="info-panel__icon"><FaEnvelope /></span> 
          <span className="info-panel__text">{user?.email}</span>
        </div>

        <div className="info-panel__row">
          <span className="info-panel__icon"><FaFingerprint /></span>
          <span className={`info-panel__status ${isMfaEnabled ? 'info-panel__status--secure' : 'info-panel__status--warning'}`}>
            {isMfaEnabled ? 'ENCRYPTED' : 'UNPROTECTED'} 
            {isMfaEnabled ? <FaLock size={12}/> : <FaUnlock size={12}/>}
          </span>
        </div>
      </div>

      {/* QR Code Section */}
      {qrCode && (
        <div className="qr-container">
          <p className="qr-container__label">SCAN WITH AUTHENTICATOR</p>
          <img src={qrCode} alt="MFA" className="qr-container__img" />
          <Button onClick={() => setQrCode(null)} variant="secondary" fullWidth className="btn--mt">
            CONFIRM SCAN
          </Button>
        </div>
      )}

      {/* Actions */}
      <div className="form-actions">
        <Button 
          onClick={isMfaEnabled ? disableMFA : enableMFA} 
          variant={isMfaEnabled ? "danger" : "primary"} 
          disabled={loading}
        >
          {isMfaEnabled ? <FaUnlock /> : <FaQrcode />} 
          {loading ? 'PROCESSING...' : (isMfaEnabled ? 'DEACTIVATE MFA' : 'ACTIVATE MFA')}
        </Button>
        
        <Button onClick={handleLogout} variant="secondary">
          <FaPowerOff /> TERMINATE SESSION
        </Button>
      </div>
    </Card>
  );
};

export default Dashboard;