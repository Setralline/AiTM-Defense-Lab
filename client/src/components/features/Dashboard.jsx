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

const Dashboard = ({ user, setUser, onLogout }) => {
  const { isMfaEnabled, qrCode, setQrCode, enableMFA, disableMFA, loading, error } = useMFA(user, setUser);

  const handleLogout = () => {
    toast('Session locked.', { icon: '🚫' });
    onLogout();
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
        <Button onClick={handleLogout} variant="secondary"><FaPowerOff /> TERMINATE SESSION</Button>
      </div>
    </Card>
  );
};

export default Dashboard;