import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCookieBite, FaShieldVirus, FaUserShield, FaGlobe, FaFingerprint, FaSkullCrossbones, FaTools } from 'react-icons/fa';

import Card from '../components/layout/Card';
import Button from '../components/ui/Button';

const Home = ({ user }) => {
  const navigate = useNavigate();

  return (
    <Card title="SELECT MISSION" footer="UNAUTHORIZED ACCESS PROHIBITED">
      <div className="home-grid">
        <p className="home-desc">Analyze authentication vulnerabilities across multiple security layers.</p>

        {/* [FIX] Added Admin Panel Button */}
        <Button variant="outline" fullWidth onClick={() => navigate('/admin')}>
          <FaTools size={18} /> ADMIN PANEL (CONTROL)
        </Button>

        <div className="divider" style={{ margin: '10px 0', borderBottom: '1px solid #333' }}></div>

        <Button variant="primary" fullWidth onClick={() => navigate('/level1')}>
          <FaCookieBite size={18} /> LEVEL 1: COOKIES (LEGACY)
        </Button>

        <Button variant="secondary" fullWidth onClick={() => navigate('/level2')}>
          <FaShieldVirus size={18} /> LEVEL 2: TOKENS (MODERN)
        </Button>

        <Button variant="secondary" fullWidth onClick={() => navigate('/level3')}>
          <FaUserShield size={18} /> LEVEL 3: HEADER DEFENSE
        </Button>

        <Button variant="secondary" fullWidth onClick={() => navigate('/level4')}>
          <FaGlobe size={18} /> LEVEL 4: CLIENT DEFENSE
        </Button>

        <Button variant="secondary" fullWidth onClick={() => navigate('/level5')} className="btn--secure-gold">
          <FaFingerprint size={18} /> LEVEL 5: FIDO2 (SECURE)
        </Button>

        <div className="home-footer-decor">
          <FaSkullCrossbones className="footer-icon" /> PHISHING LAB INITIALIZED
        </div>
      </div>
    </Card>
  );
};

export default Home;