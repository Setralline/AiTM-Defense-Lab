import React from 'react';

/**
 * Footer Component
 * Acts as a persistent system status bar at the bottom of the application.
 * Features a pulsing operational indicator for a "live system" feel.
 */

const Footer = () => {
  const styles = {
    container: {
      width: '100%',
      padding: '12px 25px',
      borderTop: '1px solid #1a1a1a',
      background: 'rgba(5, 5, 5, 0.95)', // Slight transparency for modern feel
      backdropFilter: 'blur(5px)', // Blurs content behind for high-end UI
      color: '#666',
      fontSize: '11px',
      fontFamily: 'var(--cyber-font)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      position: 'fixed',
      bottom: 0,
      left: 0,
      zIndex: 1000,
      letterSpacing: '1px'
    },
    brand: { 
      color: '#fff', 
      fontWeight: '700', 
      letterSpacing: '1.5px' 
    },
    status: { 
      display: 'flex', 
      alignItems: 'center', 
      color: 'var(--cyber-red)', 
      fontWeight: '800',
      fontSize: '10px'
    }
  };

  return (
    <footer style={styles.container}>
      {/* Attribution Section */}
      <div>
        <span style={{ color: '#444' }}>ENGINEERED BY </span>
        <span style={styles.brand}> OSAMAH AMER</span>
        <span style={{ color: 'var(--cyber-red)', opacity: 0.8 }}> // 2026</span>
      </div>

      {/* System Status Section */}
      <div style={styles.status}>
        {/* The pulse-dot class is defined in main.css */}
        <span className="pulse-dot"></span>
        <span style={{ marginLeft: '8px' }}>SYSTEM OPERATIONAL</span>
      </div>
    </footer>
  );
};

export default Footer;