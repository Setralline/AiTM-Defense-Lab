import React from 'react';
import logo from '../../assets/logo.svg'; 

/**
 * Card Component
 * The primary container for all authentication and dashboard views.
 * Designed with a high-contrast dark theme for a Red Team aesthetic.
 */

const styles = {
  container: {
    width: '400px',
    backgroundColor: '#0f0f0f', 
    border: '1px solid #333',
    borderRadius: '12px',
    padding: '35px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.8)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    transition: 'transform 0.3s ease', // Adding subtle hover capability
  },
  header: { 
    textAlign: 'center', 
    width: '100%', 
    marginBottom: '10px' 
  },
  logo: { 
    width: '80px', 
    marginBottom: '20px',
    filter: 'drop-shadow(0 0 5px rgba(255, 26, 26, 0.3))' // Optional glow for logo
  },
  title: {
    textTransform: 'uppercase',
    fontWeight: '700',
    fontSize: '1.4rem',
    marginBottom: '25px',
    letterSpacing: '2px',
    color: '#ffffff',
    fontFamily: 'var(--cyber-font)',
  },
  contentContainer: {
    width: '100%',
    flex: 1
  },
  footer: {
    marginTop: '20px',
    color: '#ff4444', 
    textAlign: 'center',
    fontSize: '0.85rem',
    fontWeight: '600',
    minHeight: '20px',
    letterSpacing: '1px',
    textTransform: 'uppercase'
  },
};

const Card = ({ title, children, footer }) => {
  return (
    <div style={styles.container}>
      {/* Brand Header */}
      <div style={styles.header}>
        <img src={logo} alt="Cyber Lab Logo" style={styles.logo} />
        <h2 style={styles.title}>{title}</h2>
      </div>

      {/* Dynamic Content Slot */}
      <div style={styles.contentContainer}>
        {children}
      </div>

      {/* Conditional Error/Status Footer */}
      {footer && (
        <div style={styles.footer}>
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;