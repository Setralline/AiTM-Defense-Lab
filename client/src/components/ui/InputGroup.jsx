import React from 'react';

/**
 * InputGroup Component
 * A cyber-styled input field with icon integration.
 * Optimized for terminal-like aesthetic with high-contrast feedback.
 */
const InputGroup = ({ 
  icon, 
  type, 
  name, 
  placeholder, 
  value, 
  onChange, 
  required, 
  autoFocus, 
  maxLength, 
  highlight 
}) => {
  
  const styles = {
    wrapper: { 
      position: 'relative', 
      marginBottom: '20px', 
      width: '100%', 
      boxSizing: 'border-box' 
    },
    iconContainer: { 
      position: 'absolute', 
      left: '15px', 
      top: '50%', 
      transform: 'translateY(-50%)', 
      color: highlight ? 'var(--cyber-red)' : '#666', 
      fontSize: '1.2rem', 
      display: 'flex', 
      alignItems: 'center', 
      pointerEvents: 'none', 
      zIndex: 2 
    },
    input: { 
      width: '100%', 
      padding: '14px 15px 14px 45px', 
      background: '#0a0a0a', 
      border: highlight ? '1px solid var(--cyber-red)' : '1px solid #333', 
      borderRadius: '4px', 
      color: '#fff', 
      fontSize: '14px', 
      fontFamily: 'var(--cyber-font)', 
      outline: 'none', 
      transition: 'all 0.3s ease', 
      boxShadow: highlight ? 'var(--cyber-glow)' : 'none', 
      boxSizing: 'border-box' 
    }
  };

  return (
    <div style={styles.wrapper}>
      <div style={styles.iconContainer}>
        {icon}
      </div>
      
      <input 
        style={styles.input} 
        type={type} 
        name={name} 
        placeholder={placeholder} 
        value={value} 
        onChange={onChange} 
        required={required} 
        autoFocus={autoFocus} 
        maxLength={maxLength} 
        autoComplete="off" 
      />
    </div>
  );
};

export default InputGroup;