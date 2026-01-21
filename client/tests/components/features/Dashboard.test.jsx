import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import Dashboard from '../../../src/components/features/Dashboard';
import { BrowserRouter } from 'react-router-dom';

// Mock dependencies to isolate UI logic
vi.mock('../../../src/hooks/useMFA', () => ({
  default: () => ({
    isMfaEnabled: true, // Pretend user has MFA active
    qrCode: null,
    enableMFA: vi.fn(),
    disableMFA: vi.fn(),
    loading: false
  })
}));

const renderDashboard = (props) => {
  return render(
    <BrowserRouter>
      <Dashboard 
        user={{ name: 'Test Agent', email: 'test@lab.com' }} 
        setUser={vi.fn()} 
        onLogout={vi.fn()}
        {...props} 
      />
    </BrowserRouter>
  );
};

describe('Dashboard Security Logic', () => {

  it('STANDARD MODE: Should show MFA controls when MFA is enabled', () => {
    renderDashboard({ isFidoMode: false });
    // In standard mode, the button should exist
    expect(screen.getByText(/DEACTIVATE MFA/i)).toBeInTheDocument();
    expect(screen.getByText(/LEVEL 5 CLEARANCE/i)).toBeInTheDocument();
  });

  it('FIDO MODE (THE FIX): Should HIDE MFA controls even if user has MFA', () => {
    renderDashboard({ isFidoMode: true });
    
    // 1. Verify Badge Change
    expect(screen.getByText(/FIDO2 HARDWARE VERIFIED/i)).toBeInTheDocument();
    
    // 2. Critical: Verify MFA Button is GONE
    expect(screen.queryByText(/DEACTIVATE MFA/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/ACTIVATE MFA/i)).not.toBeInTheDocument();
  });

});