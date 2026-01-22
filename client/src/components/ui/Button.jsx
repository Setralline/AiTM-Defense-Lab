import React from 'react';

const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  type = 'button', 
  disabled = false, 
  fullWidth = false,
  className = '',
  style = {} // Added style prop support for custom overrides like Gold button
}) => {
  const baseClass = 'btn';
  const variantClass = `btn--${variant}`;
  const widthClass = fullWidth ? 'btn--full' : '';
  
  return (
    <button 
      type={type}
      onClick={disabled ? null : onClick} 
      disabled={disabled}
      className={`${baseClass} ${variantClass} ${widthClass} ${className}`.trim()}
      style={style}
    >
      {children}
    </button>
  );
};

export default Button;