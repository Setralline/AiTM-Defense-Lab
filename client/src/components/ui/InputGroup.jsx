import React from 'react';

/**
 * InputGroup Component (BEM)
 * Uses .input-group block.
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
  return (
    <div className="input-group">
      <input 
        className={`input-group__field ${highlight ? 'input-group__field--highlight' : ''}`}
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
      {/* Icon is rendered after input to allow CSS sibling selector (+) to work on focus */}
      {icon && !highlight && (
        <span className="input-group__icon">
          {icon}
        </span>
      )}
    </div>
  );
};

export default InputGroup;