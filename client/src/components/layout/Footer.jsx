import React from 'react';

/**
 * Footer Component (BEM)
 * Uses .footer block.
 */
const Footer = () => {
  return (
    <footer className="footer">
      <div>
        <span>ENGINEERED BY </span>
        <strong style={{ color: '#fff', letterSpacing: '1.5px' }}>OSAMAH AMER</strong>
        <span style={{ color: 'var(--cyber-red)', opacity: 0.8 }}> // 2026</span>
      </div>

      <div className="footer__status">
        <span className="pulse-dot"></span>
        <span>SYSTEM OPERATIONAL</span>
      </div>
    </footer>
  );
};

export default Footer;