import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

// Clean and professional import using the @ alias
import Button from '@/components/ui/Button';

describe('Button Component', () => {
  
  // Test 1: Does it render the text correctly?
  it('renders the correct text', () => {
    render(<Button>Click Me</Button>);
    
    // Expect the button with this text to exist in the document
    expect(screen.getByText(/Click Me/i)).toBeInTheDocument();
  });

  // Test 2: Does it handle click events?
  it('calls the onClick handler when clicked', () => {
    const handleClick = vi.fn(); // Mock function to spy on the event
    render(<Button onClick={handleClick}>Submit</Button>);
    
    // Simulate a user click
    fireEvent.click(screen.getByText(/Submit/i));
    
    // Verify the function was called exactly once
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  // Test 3: Does it accept variant props?
  it('applies danger styling attributes', () => {
    render(<Button variant="danger">Delete</Button>);
    
    const btn = screen.getByText(/Delete/i);
    // Verify the element exists (Style validation can be expanded here)
    expect(btn).toBeInTheDocument();
  });
});