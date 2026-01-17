import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCookieBite, FaShieldVirus, FaUserShield, FaGlobe, FaFingerprint, FaSkullCrossbones } from 'react-icons/fa';
import Card from '../layout/Card';
import Button from '../ui/Button';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Card title="SELECT MISSION" footer="UNAUTHORIZED ACCESS PROHIBITED">
      <div className="home-grid">
        <p className="home-desc">
          Choose your target environment to begin the simulation and test authentication vulnerabilities.
        </p>
        
        {/* Level 1: Legacy */}
        <Button 
          variant="primary" 
          fullWidth 
          onClick={() => navigate('/level1')}
        >
          <FaCookieBite size={18} /> 
          LEVEL 1: COOKIES (LEGACY)
        </Button>

        {/* Level 2: Modern (Vulnerable) */}
        <Button 
          variant="secondary" 
          fullWidth 
          onClick={() => navigate('/level2')}
        >
          <FaShieldVirus size={18} /> 
          LEVEL 2: TOKENS (MODERN)
        </Button>

        {/* Level 3: Server Defense */}
        <Button 
          variant="secondary" 
          fullWidth 
          onClick={() => navigate('/level3')}
        >
          <FaUserShield size={18} /> 
          LEVEL 3: HEADER DEFENSE
        </Button>

        {/* Level 4: Client Defense */}
        <Button 
          variant="secondary" 
          fullWidth 
          onClick={() => navigate('/level4')}
        >
          <FaGlobe size={18} /> 
          LEVEL 4: CLIENT DEFENSE
        </Button>

        {/* Level 5: FIDO2 Hardware Defense (NEW) */}
        <Button 
          variant="secondary" 
          fullWidth 
          onClick={() => navigate('/level5')}
          style={{ 
            borderColor: '#f1c40f', 
            color: '#f39c12',
            background: 'rgba(241, 196, 15, 0.05)'
          }}
        >
          <FaFingerprint size={18} /> 
          LEVEL 5: FIDO2 (PHISHING PROOF)
        </Button>

        {/* Decor Footer */}
        <div style={{ 
          marginTop: '20px', 
          textAlign: 'center', 
          fontSize: '11px', 
          color: 'var(--cyber-green)',
          letterSpacing: '3px',
          textShadow: '0 0 5px rgba(0, 255, 65, 0.5)'
        }}>
          <FaSkullCrossbones style={{ verticalAlign: 'middle', marginRight: '5px' }} /> 
          PHISHING LAB INITIALIZED
        </div>
      </div>
    </Card>
  );
};

export default Home;