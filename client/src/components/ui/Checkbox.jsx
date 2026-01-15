import React, { useId } from 'react';
import { cyberStyles } from '../../utils/themeStyles';

/**
 * Checkbox Component
 * Stylized for "Remember Me" and administrative toggles.
 * Fully optimized for React 19 accessibility standards.
 */
const Checkbox = ({ label, checked, onChange, name }) => {
  const uniqueId = useId();

  // نستخدم التنسيقات من الملف المركزي مع إضافة خصائص فريدة للمكون
  const styles = {
    wrapper: { 
      ...cyberStyles.checkboxContainer, // استخدام الستايل المركزي
      width: '100%',
      userSelect: 'none',
      margin: '15px 0' 
    },
    input: { 
      width: '16px', 
      height: '16px', 
      marginRight: '10px', 
      accentColor: 'var(--cyber-red)', 
      cursor: 'pointer'
    },
    label: { 
      cursor: 'pointer', 
      fontSize: '0.85rem',
      fontFamily: 'var(--cyber-font)'
    }
  };

  return (
    <div style={styles.wrapper}>
      <input 
        type="checkbox" 
        id={uniqueId}
        name={name}
        checked={checked} 
        onChange={onChange} 
        style={styles.input} 
      />
      <label htmlFor={uniqueId} style={styles.label}>
        {label}
      </label>
    </div>
  );
};

export default Checkbox;