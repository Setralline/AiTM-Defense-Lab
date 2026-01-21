import { render } from '@testing-library/react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import DomainGuard from '../../../src/components/features/DomainGuard';

describe('DomainGuard Security Defense', () => {
  const originalLocation = window.location;

  afterEach(() => {
    // Restore the real window.location after each test so we don't break other tests
    Object.defineProperty(window, 'location', {
      writable: true,
      value: originalLocation,
    });
    document.body.innerHTML = ''; // Clean up the "Kill Switch" HTML
  });

  it('should ALLOW execution on trusted domains (localhost)', () => {
    // 1. Mock the URL to be safe
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { hostname: 'localhost' },
    });

    // 2. Render the component
    const { container } = render(<DomainGuard />);

    // 3. Expect NO Red Screen of Death
    expect(document.body.innerHTML).not.toContain('SECURITY ALERT');
    expect(container.firstChild).toBeNull(); // It should render nothing
  });

  it('should BLOCK execution on unauthorized domains (phishing)', () => {
    // 1. Mock the URL to be malicious
    Object.defineProperty(window, 'location', {
      writable: true,
      value: { hostname: 'evil-phishing-site.com' },
    });

    // 2. Expect it to throw the Kill Switch Error
    expect(() => render(<DomainGuard />)).toThrow('Security Kill Switch Activated');

    // 3. Expect the Red Screen of Death to replace the body
    expect(document.body.innerHTML).toContain('SECURITY ALERT');
    expect(document.body.innerHTML).toContain('evil-phishing-site.com');
  });
});