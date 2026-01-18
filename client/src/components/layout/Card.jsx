import React from 'react';
import logo from '../../assets/logo.svg'; 

/**
 * Card Component (BEM)
 * Uses .card block structure.
 */
const Card = ({ title, children, footer, className = '' }) => {
  return (
    <div className={`card ${className}`}>
      {/* Header */}
      <div className="card__header">
        <img src={logo} alt="Cyber Lab Logo" className="card__logo" />
        {title && <h2 className="card__title">{title}</h2>}
      </div>

      {/* Content */}
      <div className="card__body">
        {children}
      </div>

      {/* Footer */}
      {footer && (
        <div className="card__footer">
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;