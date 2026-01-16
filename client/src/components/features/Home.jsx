import React from 'react';
import { useNavigate } from 'react-router-dom'; // 1. استيراد هوك التنقل
import { FaCookieBite, FaShieldVirus, FaSkullCrossbones } from 'react-icons/fa';
import Card from '../layout/Card';
import Button from '../ui/Button';
import { cyberStyles as styles } from '../../utils/themeStyles';

/**
 * Home Component
 * Entry point for the simulation: Mission selection.
 * REFACTORED: Uses 'useNavigate' instead of Link wrapping Buttons to fix click events.
 */
const Home = () => {
  const navigate = useNavigate();

  return (
    <Card title="SELECT MISSION" footer="UNAUTHORIZED ACCESS PROHIBITED">
      <div style={styles.homeContainer}>
        <p style={styles.homeDescription}>
          Choose your target environment to begin the simulation and test authentication vulnerabilities.
        </p>
        
        {/* Mission Level 1 */}
        {/* FIX: Removed <Link> wrapper, added onClick to Button */}
        <Button 
          variant="primary" 
          fullWidth 
          onClick={() => navigate('/level1')}
        >
          <FaCookieBite style={styles.homeIcon} /> 
          LEVEL 1: COOKIES (LEGACY)
        </Button>

        {/* Spacer for visual separation */}
        <div style={{ height: '1rem' }}></div>

        {/* Mission Level 2 */}
        <Button 
          variant="secondary" 
          fullWidth 
          onClick={() => navigate('/level2')}
        >
          <FaShieldVirus style={styles.homeIcon} /> 
          LEVEL 2: TOKENS (MODERN)
        </Button>

        {/* System Status Decorative Element */}
        <div style={styles.systemStatus}>
          <FaSkullCrossbones style={{ verticalAlign: 'middle', marginRight: '5px' }} /> 
          PHISHING LAB INITIALIZED
        </div>
      </div>
    </Card>
  );
};

export default Home;