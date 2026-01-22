import React from 'react';

/**
 * Button Component (BEM Architecture)
 * Relies on main.css for styling and hover states.
 * Supports: variant (primary/secondary/danger), fullWidth, and custom classes.
 */
const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  type = 'button', 
  disabled = false, 
  fullWidth = false,
  className = ''
}) => {
  // Construct BEM class string matching main.css
  const baseClass = 'btn';
  const variantClass = `btn--${variant}`; // e.g. btn--primary, btn--danger
  const widthClass = fullWidth ? 'btn--full' : '';
  
  return (
    <button 
      type={type}
      onClick={disabled ? null : onClick} 
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${widthClass} ${className}`.trim()}
    >
      {children}
    </button>
  );
};

export default Button;