import React from 'react';
import toast from 'react-hot-toast';
import { 
  FaUserSecret, FaEnvelope, FaFingerprint, 
  FaQrcode, FaPowerOff, FaLock, FaUnlock 
} from 'react-icons/fa';
import useMFA from '../../hooks/useMFA';
import Card from '../layout/Card';
import Button from '../ui/Button';
import { cyberStyles as styles } from '../../utils/themeStyles'; 
import authService from '../../services/authService';

const Dashboard = ({ user, setUser, onLogout }) => {
  const { isMfaEnabled, qrCode, setQrCode, enableMFA, disableMFA, loading, error } = useMFA(user, setUser);

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
        style: {
          borderRadius: '0',
          background: '#1a1a1a',
          color: '#ff4444',
          border: '1px solid #ff4444'
        }
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
      <div style={styles.infoPanel}>
        <div style={styles.clearanceBadge(isMfaEnabled)}>
          {isMfaEnabled ? 'LEVEL 5 CLEARANCE' : 'RESTRICTED ACCESS'}
        </div>

        <div style={styles.row}>
          <span style={styles.icon}><FaUserSecret /></span> 
          <span style={{ letterSpacing: '1px' }}>{user?.name?.toUpperCase() || 'UNKNOWN'}</span>
        </div>

        <div style={styles.row}>
          <span style={styles.icon}><FaEnvelope /></span> {user?.email}
        </div>

        <div style={styles.row}>
          <span style={styles.icon}><FaFingerprint /></span>
          <span style={{ color: isMfaEnabled ? '#2ecc71' : '#ff4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
            {isMfaEnabled ? 'ENCRYPTED' : 'UNPROTECTED'} {isMfaEnabled ? <FaLock size={12}/> : <FaUnlock size={12}/>}
          </span>
        </div>
      </div>

      {qrCode && (
        <div style={styles.qrContainer}>
          <p style={{ fontSize: '11px', fontWeight: 'bold' }}>SCAN WITH AUTHENTICATOR</p>
          <img src={qrCode} alt="MFA" style={{ width: '150px', margin: '0 auto' }} />
          <Button onClick={() => setQrCode(null)} variant="secondary" fullWidth style={{ marginTop: '10px' }}>
            CONFIRM SCAN
          </Button>
        </div>
      )}

      <div style={styles.actions}>
        <Button onClick={isMfaEnabled ? disableMFA : enableMFA} variant={isMfaEnabled ? "danger" : "primary"} disabled={loading}>
          {isMfaEnabled ? <FaUnlock /> : <FaQrcode />} {loading ? 'PROCESSING...' : (isMfaEnabled ? 'DEACTIVATE MFA' : 'ACTIVATE MFA')}
        </Button>
        <Button onClick={handleLogout} variant="secondary">
          <FaPowerOff /> TERMINATE SESSION
        </Button>
      </div>
    </Card>
  );
};

export default Dashboard;