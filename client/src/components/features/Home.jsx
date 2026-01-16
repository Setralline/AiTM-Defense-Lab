import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaCookieBite, FaShieldVirus, FaSkullCrossbones } from 'react-icons/fa';
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
        
        {/* Level 1 */}
        <Button 
          variant="primary" 
          fullWidth 
          onClick={() => navigate('/level1')}
        >
          <FaCookieBite size={18} /> 
          LEVEL 1: COOKIES (LEGACY)
        </Button>

        {/* Level 2 */}
        <Button 
          variant="secondary" 
          fullWidth 
          onClick={() => navigate('/level2')}
        >
          <FaShieldVirus size={18} /> 
          LEVEL 2: TOKENS (MODERN)
        </Button>

        {/* Decor */}
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