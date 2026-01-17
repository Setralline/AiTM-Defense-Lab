import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { FaFingerprint, FaKey, FaArrowLeft, FaShieldAlt, FaUserAstronaut, FaTrashAlt } from 'react-icons/fa';
import authService from '../../services/authService';

// UI Components (BEM Architecture)
import Card from '../layout/Card';
import InputGroup from '../ui/InputGroup';
import Button from '../ui/Button';
import Dashboard from './Dashboard';

/**
 * Level 5 Component: FIDO2 / WebAuthn Defense
 * Logic: Handles Multi-Factor Authentication via Hardware Keys.
 * Style: Uses strict BEM conventions from global CSS.
 */
const Level5 = ({ user, setUser }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Credentials, 2: FIDO Challenge
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({ email: '', password: '' });

  // 1. Session Validation
  useEffect(() => {
    const checkSession = async () => {
      try {
        const data = await authService.getCurrentUser();
        if (data.user) setUser(data.user);
      } catch (err) {
        // Silent catch
      }
    };
    checkSession();
  }, [setUser]);

  // 2. Input Handler
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // 3. Step 1: Standard Password Login
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    const tId = toast.loading('Verifying Credentials...');

    try {
      const res = await authService.fidoLoginWithPassword(formData.email, formData.password);
      
      if (res.status === 'success') {
        setUser(res.user);
        toast.success('Login Success', { id: tId });
      } else if (res.status === 'fido_required') {
        toast.success('Credentials Valid. Hardware Key Required.', { id: tId });
        setStep(2); 
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid Credentials', { id: tId });
    } finally {
      setIsLoading(false);
    }
  };

  // 4. Step 2: FIDO Hardware Check
 // 4. Step 2: FIDO Hardware Check (FIXED LOGIC)
  const handleFidoVerify = async () => {
    if (isLoading) return; // منع التكرار إذا كان هناك طلب قيد التنفيذ
    
    setIsLoading(true);
    const tId = toast.loading('Waiting for Security Key interaction...');

    try {
      // نستخدم formData.email للتأكد من إرسال الإيميل الذي أدخله المستخدم في الخطوة 1
      const data = await authService.fidoLogin(formData.email);
      
      if (data && data.verified) {
        setUser(data.user);
        toast.success('Identity Confirmed via Hardware Key', { id: tId });
        navigate('/dashboard');
      } else {
        throw new Error("Verification failed");
      }
    } catch (err) {
      console.error("FIDO Login Error:", err);
      // إذا كان الخطأ 500 من السيرفر، نعرض رسالة أوضح
      const errorMessage = err.response?.status === 500 
        ? 'Server Challenge Mismatch. Please try again.' 
        : 'Security Key Rejected! (Phishing Attempt?)';
      
      toast.error(errorMessage, { id: tId });
    } finally {
      setIsLoading(false);
    }
  };

  // 5. Enable Key
  const handleRegisterKey = async () => {
    const tId = toast.loading('Insert & Touch Security Key...');
    try {
      await authService.fidoRegister(user.email);
      // Immediate local state update
      setUser({ ...user, hasFido: true });
      toast.success('Security Key Enabled! Account Protected.', { id: tId });
    } catch (err) {
      toast.error('Failed to register key', { id: tId });
    }
  };

  // 6. Disable Key
  const handleDisableKey = async () => {
    if(!window.confirm("Are you sure? Removing the key will weaken your security.")) return;
    
    const tId = toast.loading('Removing Security Key...');
    try {
      await authService.fidoDisable(user.email);
      // Immediate local state update
      setUser({ ...user, hasFido: false });
      toast.success('Security Key Removed.', { id: tId });
    } catch (err) {
      toast.error('Failed to remove key', { id: tId });
    }
  };

  // 7. Secure Logout
  const handleLogout = async () => {
    const tId = toast.loading('Terminating Session...');
    try {
      await authService.logout();
    } catch (err) {
      console.error(err);
    } finally {
      setUser(null);
      setStep(1);
      setFormData({ email: '', password: '' });
      toast.success('Session Closed.', { id: tId, icon: '🔒' });
      navigate('/level5');
    }
  };

  // --- RENDER VIEWS ---

  // View A: Dashboard (Authenticated)
  if (user) {
    return (
      <Dashboard user={user} setUser={setUser} onLogout={handleLogout}>
        {/* Injected Content: FIDO Controls using BEM .info-panel */}
        <div className="info-panel" style={{ marginTop: '20px' }}>
          
          <div className="info-panel__row">
            <span className="info-panel__icon"><FaShieldAlt /></span>
            <span className="info-panel__text">ADVANCED SECURITY</span>
          </div>

          {user.hasFido ? (
             <>
               <p className="home-desc" style={{ textAlign: 'left', margin: '10px 0' }}>
                 <span className="info-panel__status--secure">
                   Hardware Protection Active
                 </span>
               </p>
               <Button 
                 onClick={handleDisableKey} 
                 variant="danger" // Maps to .btn--danger
                 fullWidth
               >
                  <FaTrashAlt /> DISABLE FIDO2 KEY
               </Button>
             </>
          ) : (
             <>
               <p className="home-desc" style={{ textAlign: 'left', margin: '10px 0', fontSize: '12px' }}>
                 Bind a hardware key (YubiKey) to your account to block phishing attacks.
               </p>
               <Button 
                 onClick={handleRegisterKey} 
                 variant="primary" // Maps to .btn--primary
                 fullWidth
               >
                  <FaFingerprint /> ENABLE FIDO2 KEY
               </Button>
             </>
          )}
        </div>
      </Dashboard>
    );
  }

  // View B: Login Flow (Step 1 & 2)
  return (
    <Card 
      title={step === 1 ? "SECURE LOGIN" : "HARDWARE CHALLENGE"} 
      footer="LEVEL 5: PHISHING IMMUNITY"
    >
      {step === 1 ? (
        /* STEP 1: PASSWORD LOGIN */
        <form onSubmit={handlePasswordLogin}>
           <div className="card__header">
              <p className="home-desc" style={{ marginBottom: '15px' }}>
                Enter credentials to access the secure vault.
              </p>
           </div>

          <InputGroup 
            icon={<FaUserAstronaut />} 
            type="email" 
            name="email" 
            placeholder="Email Address" 
            value={formData.email}
            onChange={handleChange}
            required 
          />
          <InputGroup 
            icon={<FaKey />} 
            type="password" 
            name="password" 
            placeholder="Password" 
            value={formData.password}
            onChange={handleChange}
            required 
          />

          <div className="form-actions">
            <Button type="submit" disabled={isLoading} fullWidth>
              {isLoading ? 'CHECKING...' : 'LOGIN'}
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
      ) : (
        /* STEP 2: FIDO CHALLENGE */
        <div className="animate-fade-in">
           {/* Reusing .info-panel for the status box */}
           <div className="info-panel" style={{ textAlign: 'center' }}>
             <div className="info-panel__row" style={{ justifyContent: 'center' }}>
                <span className="info-panel__icon" style={{ fontSize: '2rem', marginBottom: '10px' }}>
                  <FaShieldAlt />
                </span>
             </div>
             
             <h4 className="card__title" style={{ fontSize: '1rem', marginBottom: '10px', color: 'var(--cyber-green)' }}>
               SECURITY KEY REQUIRED
             </h4>
             
             <p className="home-desc" style={{ marginBottom: '0' }}>
               Password verified. Origin check initiated. Please touch your hardware key.
             </p>
           </div>

           <div className="form-actions">
             {/* Using primary button for action, looks consistent with theme */}
             <Button onClick={handleFidoVerify} disabled={isLoading} fullWidth variant="primary">
               {isLoading ? 'TOUCH KEY...' : 'USE SECURITY KEY'}
             </Button>
             
             <Button 
               type="button" 
               variant="secondary" 
               onClick={() => { setStep(1); setFormData({...formData, password: ''}); }} 
               fullWidth
             >
               <FaArrowLeft /> BACK TO PASSWORD
             </Button>
           </div>
        </div>
      )}
    </Card>
  );
};

export default Level5;