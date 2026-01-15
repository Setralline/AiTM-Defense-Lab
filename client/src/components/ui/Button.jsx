import React from 'react';

/**
 * Button Component
 * Styled specifically for the Cyber Lab terminal environment.
 * Supports variants: primary (red glow), secondary (gray), and danger (outlined red).
 */
const Button = ({ 
  children, 
  onClick, 
  variant = 'primary', 
  type = 'button', 
  disabled, 
  fullWidth = false,
  style = {} 
}) => {

  // Configuration for specialized visual themes
  const variants = {
    primary: {
      background: 'var(--cyber-red)',
      color: '#000',
      border: '1px solid var(--cyber-red)',
      boxShadow: 'var(--cyber-glow)'
    },
    secondary: {
      background: 'var(--cyber-gray)',
      color: '#e0e0e0',
      border: '1px solid #333'
    },
    danger: {
      background: 'transparent',
      color: 'var(--cyber-red)',
      border: '1px solid var(--cyber-red)',
      boxShadow: '0 0 10px rgba(255, 26, 26, 0.2)'
    }
  };

  // Centralized base architecture for the button
  const baseStyle = {
    padding: '0 25px',
    height: '48px',
    width: fullWidth ? '100%' : 'auto',
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: '900',
    fontFamily: 'var(--cyber-font)',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease-in-out',
    outline: 'none',
    ...variants[variant],
    ...style 
  };

  return (
    <button 
      type={type}
      onClick={disabled ? null : onClick} 
      disabled={disabled}
      className="btn-cyber" 
      style={baseStyle}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        {children}
      </span>
    </button>
  );
};

export default Button;