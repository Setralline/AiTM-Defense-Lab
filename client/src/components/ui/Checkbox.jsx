import React from 'react';

const Checkbox = ({ label, checked, onChange, name }) => {
  return (
    <label className="checkbox">
      <input 
        type="checkbox" 
        name={name}
        checked={checked} 
        onChange={onChange} 
        className="checkbox__input"
      />
      <span className="checkbox__label">{label}</span>
    </label>
  );
};

export default Checkbox;