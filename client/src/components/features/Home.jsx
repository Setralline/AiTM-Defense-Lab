import React from 'react';
import { Link } from 'react-router-dom';
import { FaCookieBite, FaShieldVirus, FaSkullCrossbones } from 'react-icons/fa';
import Card from '../layout/Card';
import Button from '../ui/Button';
import { cyberStyles as styles } from '../../utils/themeStyles';

/**
 * Home Component
 * Entry point for the simulation: Mission selection.
 */
const Home = () => {
  return (
    <Card title="SELECT MISSION" footer="UNAUTHORIZED ACCESS PROHIBITED">
      <div style={styles.homeContainer}>
        <p style={styles.homeDescription}>
          Choose your target environment to begin the simulation and test authentication vulnerabilities.
        </p>
        
        {/* Mission Level 1 */}
        <Link to="/level1" style={{ textDecoration: 'none' }}>
          <Button variant="primary" fullWidth>
            <FaCookieBite style={styles.homeIcon} /> 
            LEVEL 1: COOKIES (LEGACY)
          </Button>
        </Link>

        {/* Mission Level 2 */}
        <Link to="/level2" style={{ textDecoration: 'none' }}>
          <Button variant="secondary" fullWidth>
            <FaShieldVirus style={styles.homeIcon} /> 
            LEVEL 2: TOKENS (MODERN)
          </Button>
        </Link>

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