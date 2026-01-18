import React, { useId } from 'react';

/**
 * Checkbox Component (BEM)
 * Uses .checkbox block.
 */
const Checkbox = ({ label, checked, onChange, name }) => {
  const uniqueId = useId();

  return (
    <div className="checkbox">
      <input 
        className="checkbox__input"
        type="checkbox" 
        id={uniqueId}
        name={name}
        checked={checked} 
        onChange={onChange} 
      />
      <label htmlFor={uniqueId} className="checkbox__label">
        {label}
      </label>
    </div>
  );
};

export default Checkbox;