/**
 * Global Cyber-Lab Theme Styles
 * Centralized configuration for consistent UI/UX across all components.
 * Build by: Osamah Amer (2026)
 */

export const cyberStyles = {
  // --- Dashboard & Info Panels ---
  infoPanel: {
    background: '#0a0a0a',
    border: '1px solid #1a1a1a',
    borderRadius: '4px',
    padding: '20px',
    marginBottom: '20px',
    position: 'relative',
    overflow: 'hidden'
  },
  row: {
    display: 'flex',
    alignItems: 'center',
    marginBottom: '15px',
    fontWeight: '500',
    color: '#ccc',
    fontSize: '14px'
  },
  icon: {
    color: 'var(--cyber-red)',
    marginRight: '15px',
    fontSize: '1.2rem',
    width: '24px',
    textAlign: 'center'
  },
  qrContainer: {
    textAlign: 'center',
    marginBottom: '1.5rem',
    background: '#fff',
    padding: '15px',
    borderRadius: '4px',
    color: '#000'
  },
  clearanceBadge: (isSecure) => ({
    position: 'absolute',
    top: 0,
    right: 0,
    padding: '5px 12px',
    background: isSecure ? '#2ecc71' : '#333',
    color: '#fff',
    fontSize: '10px',
    fontWeight: 'bold',
    letterSpacing: '1px'
  }),

  // --- Admin Panel Specific ---
  adminContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    alignItems: 'center',
    padding: '40px 20px 100px 20px'
  },
  toolbar: {
    width: '400px',
    display: 'flex',
    gap: '10px'
  },
  userItem: (isAdmin) => ({
    display: 'flex',
    justifyContent: 'space-between',
    padding: '12px',
    borderBottom: '1px solid #1a1a1a',
    alignItems: 'center',
    background: isAdmin ? 'rgba(231, 76, 60, 0.05)' : 'transparent'
  }),

  // --- Home & Mission Selection ---
  homeContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '15px'
  },
homeDescription: {
    textAlign: 'center',
    color: '#aaa',
    marginBottom: '25px',
    fontSize: '0.95rem',
    lineHeight: '1.6',
    fontFamily: "'JetBrains Mono', monospace", 
  },
  homeIcon: {
    marginRight: '12px',
    fontSize: '1.1rem'
  },
systemStatus: {
    marginTop: '20px', 
    textAlign: 'center', 
    fontSize: '11px', 
    color: '#00ff41',
    letterSpacing: '3px',
    fontFamily: "'JetBrains Mono', monospace",
    textShadow: '0 0 5px rgba(0, 255, 65, 0.5)'
  },

  // --- Common UI Elements ---
  actions: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px'
  },
  checkboxContainer: {
    display: 'flex',
    alignItems: 'center',
    margin: '15px 0',
    fontSize: '0.85rem',
    color: '#666'
  },
  returnBtn: {
    fontSize: '12px'
  }
};

/**
 * Global Layout Configuration
 */
export const layoutStyle = {
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  minHeight: '100vh',
  padding: '20px',
  position: 'relative',
  backgroundColor: 'var(--cyber-dark)'
};

/**
 * React-Hot-Toast Global Configuration
 */
export const toasterOptions = {
  duration: 4000,
  style: {
    background: '#0a0a0a',
    color: '#fff',
    border: '1px solid #1a1a1a',
    borderRadius: '4px',
    fontSize: '13px',
    fontFamily: 'monospace',
    boxShadow: '0 4px 15px rgba(0,0,0,0.5)'
  },
  success: {
    iconTheme: { primary: '#2ecc71', secondary: '#000' },
  },
  error: {
    iconTheme: { primary: '#ff4444', secondary: '#000' },
  },
  loading: {
    style: { border: '1px solid var(--cyber-red)' }
  }
};