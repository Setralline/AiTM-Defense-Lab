import React from 'react';
import toast from 'react-hot-toast';
import { FaUserSecret, FaEnvelope, FaFingerprint, FaQrcode, FaPowerOff, FaLock, FaUnlock, FaShieldAlt } from 'react-icons/fa';
import useMFA from '../../hooks/useMFA';
import Card from '../layout/Card';
import Button from '../ui/Button';
import authService from '../../services/authService';

/**
 * Dashboard Component
 * Logic: Shared user interface for authenticated operatives.
 * Feature: Supports 'isFidoMode' to override legacy MFA controls for Level 5.
 */
const Dashboard = ({ user, setUser, onLogout, children, isFidoMode = false }) => {
  const { isMfaEnabled, qrCode, setQrCode, enableMFA, disableMFA, loading } = useMFA(user, setUser);

  // Determine Security State
  // If FIDO Mode is active, we are ALWAYS secure. Otherwise, check MFA status.
  const isSecure = isFidoMode || isMfaEnabled;
  
  const handleLogout = async () => {
    const tId = toast.loading('Initiating termination sequence...');
    try {
      await authService.logout();
      toast.success('Session terminated. Security lock active.', { id: tId, icon: '🚫' });
      onLogout(); 
    } catch (err) {
      toast.error('Termination failure. Manual clearance required.', { id: tId });
    }
  };

  return (
    <Card title="OPERATIVE TERMINAL" footer="SECURE COMMUNICATION CHANNEL">
      <div className="info-panel">
        {/* [FIX] Dynamic Badge Logic */}
        <div className={`clearance-badge ${isSecure ? 'clearance-badge--secure' : 'clearance-badge--restricted'}`}>
          {isFidoMode 
            ? 'FIDO2 HARDWARE VERIFIED' 
            : (isMfaEnabled ? 'LEVEL 5 CLEARANCE' : 'RESTRICTED ACCESS')
          }
        </div>

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
          <span className={`info-panel__status ${isSecure ? 'info-panel__status--secure' : 'info-panel__status--warning'}`}>
            {isFidoMode ? 'HARDWARE BOUND' : (isMfaEnabled ? 'ENCRYPTED' : 'UNPROTECTED')} 
            {isSecure ? <FaLock className="status-icon"/> : <FaUnlock className="status-icon"/>}
          </span>
        </div>
      </div>

      {qrCode && !isFidoMode && (
        <div className="qr-container animate-fade-in">
          <p className="qr-container__label">SCAN WITH AUTHENTICATOR</p>
          <img src={qrCode} alt="MFA" className="qr-container__img" />
          <Button onClick={() => setQrCode(null)} variant="secondary" fullWidth className="btn--mt">
            CONFIRM SCAN
          </Button>
        </div>
      )}

      {/* Level 5 Specific Content Injected Here */}
      <div className="dashboard__injected-content">
        {children}
      </div>

      <div className="form-actions--vertical" style={{ marginTop: '20px' }}>
        
        {/* [FIX] HIDE Legacy MFA Button if in FIDO Mode */}
        {!isFidoMode && (
          <Button 
            onClick={isMfaEnabled ? disableMFA : enableMFA} 
            variant={isMfaEnabled ? "danger" : "primary"} 
            disabled={loading}
            fullWidth
          >
            {isMfaEnabled ? <FaUnlock /> : <FaQrcode />} 
            {loading ? 'PROCESSING...' : (isMfaEnabled ? 'DEACTIVATE MFA' : 'ACTIVATE MFA')}
          </Button>
        )}
        
        <Button onClick={handleLogout} variant="secondary" fullWidth>
          <FaPowerOff /> TERMINATE SESSION
        </Button>
      </div>
    </Card>
  );
};

export default Dashboard;