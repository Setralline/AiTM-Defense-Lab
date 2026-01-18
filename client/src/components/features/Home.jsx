import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCookieBite, FaShieldVirus, FaUserShield, FaGlobe, FaFingerprint, FaSkullCrossbones } from 'react-icons/fa';
import Card from '../layout/Card';
import Button from '../ui/Button';

/**
 * Home Component
 * Logic: Mission selection gateway.
 * Style: Balanced cyber-grid with BEM.
 */
const Home = () => {
  const navigate = useNavigate();

  return (
    <Card title="SELECT MISSION" footer="UNAUTHORIZED ACCESS PROHIBITED">
      <div className="home-grid">
        <p className="home-desc">
          Select a target environment to analyze authentication vulnerabilities and defense mechanisms.
        </p>

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
        
        <Button
          variant="secondary"
          fullWidth
          onClick={() => navigate('/level5')}
          className="btn--secure-gold"
        >
          <FaFingerprint size={18} /> LEVEL 5: FIDO2 (PHISHING PROOF)
        </Button>

        <div className="home-footer-decor">
          <FaSkullCrossbones className="footer-icon" />
          PHISHING LAB INITIALIZED
        </div>
      </div>
    </Card>
  );
};

export default Home;