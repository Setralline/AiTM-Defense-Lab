import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaFingerprint, FaShieldAlt, FaUserAstronaut, FaKey, FaArrowLeft, FaTrashAlt } from 'react-icons/fa';
import authService from '../../services/authService';

import Card from '../layout/Card';
import InputGroup from '../ui/InputGroup';
import Button from '../ui/Button';
import Checkbox from '../ui/Checkbox';
import Dashboard from './Dashboard';

const Level5 = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Credentials, 2: MFA, 3: FIDO
  const [isLoading, setIsLoading] = useState(false);
  const [tempToken, setTempToken] = useState('');
  const [formData, setFormData] = useState({ email: '', password: '', code: '', rememberMe: false });

  const handleChange = (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setFormData({ ...formData, [e.target.name]: value });
  };

  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const tId = toast.loading('Synchronizing...');
    try {
      const res = await authService.fidoLoginWithPassword(formData.email.trim(), formData.password, formData.rememberMe);
      if (res.mfa_required) {
        setTempToken(res.temp_token); setStep(2);
        toast.success('MFA Code Required', { id: tId });
      } else if (res.status === 'fido_required') {
        setStep(3); toast.success('Touch Security Key', { id: tId });
      } else { setUser(res.user); toast.success('Access Granted', { id: tId }); }
    } catch (err) { toast.error(err.message || 'Verification Failed', { id: tId }); }
    finally { setIsLoading(false); }
  };

  const handleMfaVerify = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const tId = toast.loading('Validating MFA...');
    try {
      const res = await authService.verifyMfa({ ...formData, temp_token: tempToken });
      if (res.user?.has_fido) { setStep(3); toast.success('Touch Security Key', { id: tId }); }
      else { setUser(res.user); toast.success('MFA Verified', { id: tId }); }
    } catch (err) { toast.error('Token Rejected', { id: tId }); }
    finally { setIsLoading(false); }
  };

  const handleFidoVerify = async () => {
    setIsLoading(true);
    const tId = toast.loading('Awaiting Gesture...');
    try {
      const res = await authService.fidoLogin(formData.email, formData.rememberMe);
      if (res.verified) { setUser(res.user); toast.success('Identity Verified', { id: tId }); }
    } catch (err) { toast.error('Hardware Reject', { id: tId }); }
    finally { setIsLoading(false); }
  };

  if (user) return (
    <Dashboard user={user} setUser={setUser} onLogout={() => setUser(null)}>
      <div className="info-panel" style={{marginTop: '20px'}}>
        <div className="info-panel__row"><FaShieldAlt className="info-panel__icon" /><span className="info-panel__text">IDENTITY SECURITY</span></div>
        {user.has_fido ? (
          <Button onClick={() => authService.fidoDisable(user.email).then(() => setUser({...user, has_fido: false}))} variant="danger" fullWidth><FaTrashAlt /> DISABLE FIDO KEY</Button>
        ) : (
          <Button onClick={() => authService.fidoRegister(user.email, true).then(() => setUser({...user, has_fido: true}))} variant="primary" fullWidth><FaFingerprint /> ENROLL FIDO KEY</Button>
        )}
      </div>
    </Dashboard>
  );

  return (
    <Card title={step === 1 ? "OPERATIVE LOGIN" : step === 2 ? "MFA CHALLENGE" : "HARDWARE CHALLENGE"}>
      <form onSubmit={step === 1 ? handlePasswordLogin : handleMfaVerify}>
        {step === 1 && (
          <><InputGroup icon={<FaUserAstronaut />} type="email" name="email" placeholder="Email" onChange={handleChange} required />
            <InputGroup icon={<FaKey />} type="password" name="password" placeholder="Passcode" onChange={handleChange} required />
            <Checkbox label="Stay Persistent (1 Year)" name="rememberMe" checked={formData.rememberMe} onChange={handleChange} /></>
        )}
        {step === 2 && <InputGroup icon={<FaShieldAlt />} type="text" name="code" placeholder="6-Digit Token" onChange={handleChange} maxLength={6} highlight autoFocus required />}
        {step === 3 && <div className="animate-fade-in" style={{textAlign: 'center'}}><FaShieldAlt style={{ fontSize: '2.5rem', marginBottom: '10px', color: 'var(--cyber-green)' }} /><p className="home-desc">Waiting for cryptographic gesture...</p></div>}
        <div className="form-actions">
          {step < 3 ? <Button type="submit" disabled={isLoading} fullWidth>{isLoading ? 'PROCESSING...' : 'INITIATE'}</Button> : <Button type="button" onClick={handleFidoVerify} variant="primary" fullWidth>TOUCH KEY</Button>}
          <Button type="button" variant="secondary" onClick={() => step === 1 ? navigate('/') : setStep(1)} fullWidth><FaArrowLeft /> BACK</Button>
        </div>
      </form>
    </Card>
  );
};

export default Level5;