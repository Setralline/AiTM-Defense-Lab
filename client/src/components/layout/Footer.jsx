import React from 'react';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer__credits">
        <span>ENGINEERED BY </span>
        <strong>OSAMAH AMER</strong>
        <span className="footer__year"> // 2026</span>
      </div>

      <div className="footer__status">
        <span className="pulse-dot"></span>
        <span>SYSTEM OPERATIONAL</span>
      </div>
    </footer>
  );
};

export default Footer;