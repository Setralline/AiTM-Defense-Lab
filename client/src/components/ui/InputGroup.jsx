import React from 'react';

const InputGroup = ({ icon, highlight, ...props }) => {
  return (
    <div className="input-group">
      <input 
        className={`input-group__field ${highlight ? 'input-group__field--highlight' : ''}`} 
        {...props} 
      />
      <div className="input-group__icon">
        {icon}
      </div>
    </div>
  );
};

export default InputGroup;