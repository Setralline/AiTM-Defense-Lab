import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaUserAstronaut, FaKey, FaShieldAlt, FaArrowLeft } from 'react-icons/fa';
import authService from '../../services/authService';
import Card from '../layout/Card';
import InputGroup from '../ui/InputGroup';
import Button from '../ui/Button';
import Dashboard from './Dashboard';
import { cyberStyles as styles } from '../../utils/themeStyles';

const Level2 = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '', code: '', rememberMe: false });

  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await authService.getCurrentUser();
        if (data.user) setUser(data.user);
      } catch (err) { /* Silent */ }
    };
    checkSession();
  }, [setUser]);

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handleAuthSuccess = (data, toastId) => {
    const { token, user: userData } = data;
    const storage = formData.rememberMe ? localStorage : sessionStorage;
    
    // Cleanup other storage to prevent token conflicts
    localStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_token');
    
    storage.setItem('auth_token', token);
    setUser(userData);
    toast.success(`Access Granted. Welcome, ${userData.name}`, { id: toastId });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const tId = toast.loading(step === 1 ? 'Handshaking...' : 'Validating MFA payload...');

    try {
      if (step === 1) {
        const res = await authService.loginLevel2({
          email: formData.email.trim(),
          password: formData.password,
          rememberMe: formData.rememberMe
        });

        if (res.mfa_required) {
          setTempToken(res.temp_token);
          setStep(2);
          toast.success('Credentials verified. Awaiting MFA.', { id: tId });
        } else {
          handleAuthSuccess(res, tId);
        }
      } else {
        const res = await authService.verifyMfa({
          email: formData.email.trim(),
          code: formData.code.trim(),
          temp_token: tempToken
        });
        if (res.success) handleAuthSuccess(res, tId);
      }
    } catch (err) {
      toast.error(step === 1 ? 'Auth Failed' : 'Token Rejected', { id: tId });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    ['auth_token'].forEach(k => { localStorage.removeItem(k); sessionStorage.removeItem(k); });
    setUser(null);
    setStep(1);
    toast('JWT Revoked.', { icon: '🔑' });
    navigate('/level2');
  };

  if (user) return <Dashboard user={user} setUser={setUser} onLogout={handleLogout} />;

  return (
    <Card title={step === 1 ? "TOKEN AUTHENTICATION" : "2-FACTOR AUTH"}>
      <form onSubmit={handleSubmit}>
        {step === 1 ? (
          <>
            <InputGroup icon={<FaUserAstronaut />} type="email" name="email" placeholder="Email" onChange={handleChange} required />
            <InputGroup icon={<FaKey />} type="password" name="password" placeholder="Passcode" onChange={handleChange} required />
            <div style={styles.checkboxContainer}>
              <input type="checkbox" name="rememberMe" onChange={handleChange} checked={formData.rememberMe} style={{ marginRight: '8px', accentColor: 'var(--cyber-red)' }} />
              <label>Stay Persistent (JWT)</label>
            </div>
          </>
        ) : (
          <InputGroup icon={<FaShieldAlt />} type="text" name="code" placeholder="6-Digit Token" onChange={handleChange} maxLength={6} highlight autoFocus />
        )}

        <div style={styles.actions}>
          <Button type="submit" disabled={isLoading} fullWidth>
            {isLoading ? 'PROCESSING...' : (step === 1 ? 'INITIATE' : 'VERIFY')}
          </Button>
          <Button type="button" variant="secondary" onClick={() => navigate('/')} fullWidth style={styles.returnBtn}>
            <FaArrowLeft /> RETURN TO BASE
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default Level2;