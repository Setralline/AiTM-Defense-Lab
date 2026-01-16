import React from 'react';

/**
 * Button Component (BEM)
 * Uses .btn block with modifiers --primary, --secondary, --danger, --full.
 */
const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  type = 'button', 
  disabled, 
  fullWidth = false,
  className = ''
}) => {
  // Construct BEM class string
  const baseClass = 'btn';
  const variantClass = `btn--${variant}`; // btn--primary, btn--danger
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