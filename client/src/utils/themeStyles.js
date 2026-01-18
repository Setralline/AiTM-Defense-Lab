/**
 * Global Configuration
 * Refactored to remove inline styles in favor of BEM CSS (src/styles/main.css).
 * Only library configurations remain here.
 */

/**
 * React-Hot-Toast Global Configuration
 * Defines the look and feel of the notification system.
 */
export const toasterOptions = {
  duration: 4000,
  position: 'top-right',
  style: {
    background: '#0a0a0a',
    color: '#fff',
    border: '1px solid #333',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: "'Courier New', Courier, monospace",
    boxShadow: '0 4px 15px rgba(0,0,0,0.8)'
  },
  success: {
    iconTheme: { primary: '#2ecc71', secondary: '#000' },
    style: { border: '1px solid #2ecc71' }
  },
  error: {
    iconTheme: { primary: '#ff4444', secondary: '#000' },
    style: { border: '1px solid #ff4444' }
  },
  loading: {
    style: { border: '1px solid #ff4444' },
    iconTheme: { primary: '#ff4444', secondary: '#000' }
  }
};