import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import InkwellTourOverlay from '../InkwellTourOverlay';

describe('InkwellTourOverlay', () => {
  const defaultProps = {
    isActive: true,
    targetEl: null,
    title: 'Welcome to Inkwell',
    content: 'This is a test step',
    onNext: vi.fn(),
    onPrev: vi.fn(),
    onClose: vi.fn(),
    stepIndex: 0,
    totalSteps: 5,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    test('renders popover when active', () => {
      render(<InkwellTourOverlay {...defaultProps} />);

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Welcome to Inkwell')).toBeInTheDocument();
      expect(screen.getByText('This is a test step')).toBeInTheDocument();
    });

    test('does not render when inactive', () => {
      render(<InkwellTourOverlay {...defaultProps} isActive={false} />);

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    test('displays correct step progress', () => {
      render(<InkwellTourOverlay {...defaultProps} stepIndex={2} totalSteps={5} />);

      expect(screen.getByText('Step 3 of 5')).toBeInTheDocument();
    });

    test('shows progress indicators', () => {
      render(<InkwellTourOverlay {...defaultProps} stepIndex={2} totalSteps={5} />);

      // Query from document.body since component uses createPortal
      const indicators = document.body.querySelectorAll('[class*="h-1"][class*="w-6"]');
      expect(indicators).toHaveLength(5);

      // First 3 should be highlighted (indices 0, 1, 2)
      expect(indicators[0]?.className).toContain('bg-blue-500');
      expect(indicators[1]?.className).toContain('bg-blue-500');
      expect(indicators[2]?.className).toContain('bg-blue-500');
      expect(indicators[3]?.className).not.toContain('bg-blue-500');
      expect(indicators[4]?.className).not.toContain('bg-blue-500');
    });
  });

  describe('Navigation', () => {
    test('calls onNext when Next button clicked', () => {
      render(<InkwellTourOverlay {...defaultProps} />);

      fireEvent.click(screen.getByText('Next →'));
      expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
    });

    test('calls onPrev when Back button clicked', () => {
      render(<InkwellTourOverlay {...defaultProps} stepIndex={2} totalSteps={5} />);

      fireEvent.click(screen.getByText('← Back'));
      expect(defaultProps.onPrev).toHaveBeenCalledTimes(1);
    });

    test('does not show Back button on first step', () => {
      render(<InkwellTourOverlay {...defaultProps} stepIndex={0} totalSteps={5} />);

      expect(screen.queryByText('← Back')).not.toBeInTheDocument();
    });

    test('shows Finish Tour button on last step', () => {
      render(<InkwellTourOverlay {...defaultProps} stepIndex={4} totalSteps={5} />);

      expect(screen.getByText('Finish Tour')).toBeInTheDocument();
      expect(screen.queryByText('Next →')).not.toBeInTheDocument();
    });

    test('calls onClose when Finish Tour clicked on last step', () => {
      render(<InkwellTourOverlay {...defaultProps} stepIndex={4} totalSteps={5} />);

      fireEvent.click(screen.getByText('Finish Tour'));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when Skip Tour clicked', () => {
      render(<InkwellTourOverlay {...defaultProps} />);

      fireEvent.click(screen.getByText('Skip Tour'));
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when backdrop clicked', () => {
      render(<InkwellTourOverlay {...defaultProps} />);

      // Query from document.body since component uses createPortal
      const backdrop = document.body.querySelector('[aria-hidden][class*="bg-black"]');
      expect(backdrop).toBeInTheDocument();

      fireEvent.click(backdrop!);
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('Keyboard Navigation', () => {
    test('calls onNext when ArrowRight pressed', () => {
      render(<InkwellTourOverlay {...defaultProps} stepIndex={0} />);

      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(defaultProps.onNext).toHaveBeenCalledTimes(1);
    });

    test('does not call onNext on last step when ArrowRight pressed', () => {
      render(<InkwellTourOverlay {...defaultProps} stepIndex={4} totalSteps={5} />);

      fireEvent.keyDown(window, { key: 'ArrowRight' });
      expect(defaultProps.onNext).not.toHaveBeenCalled();
    });

    test('calls onPrev when ArrowLeft pressed', () => {
      render(<InkwellTourOverlay {...defaultProps} stepIndex={2} totalSteps={5} />);

      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      expect(defaultProps.onPrev).toHaveBeenCalledTimes(1);
    });

    test('does not call onPrev on first step when ArrowLeft pressed', () => {
      render(<InkwellTourOverlay {...defaultProps} stepIndex={0} />);

      fireEvent.keyDown(window, { key: 'ArrowLeft' });
      expect(defaultProps.onPrev).not.toHaveBeenCalled();
    });

    test('calls onClose when Escape pressed', () => {
      render(<InkwellTourOverlay {...defaultProps} />);

      fireEvent.keyDown(window, { key: 'Escape' });
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });

    test('prevents default behavior on keyboard events', () => {
      render(<InkwellTourOverlay {...defaultProps} />);

      const event = new KeyboardEvent('keydown', {
        key: 'Escape',
        bubbles: true,
        cancelable: true,
      });
      const spy = vi.spyOn(event, 'preventDefault');

      window.dispatchEvent(event);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('Actions', () => {
    test('renders action buttons when provided', () => {
      const actions = [
        { label: 'Open Settings', onClick: vi.fn() },
        { label: 'Start Writing', onClick: vi.fn() },
      ];

      render(<InkwellTourOverlay {...defaultProps} actions={actions} />);

      expect(screen.getByText('Open Settings')).toBeInTheDocument();
      expect(screen.getByText('Start Writing')).toBeInTheDocument();
    });

    test('calls action onClick handler when clicked', () => {
      const actionHandler = vi.fn();
      const actions = [{ label: 'Open Settings', onClick: actionHandler }];

      render(<InkwellTourOverlay {...defaultProps} actions={actions} />);

      fireEvent.click(screen.getByText('Open Settings'));
      expect(actionHandler).toHaveBeenCalledTimes(1);
    });
  });

  describe('Target Element Handling', () => {
    test('shows fallback message when targetEl is null', () => {
      render(<InkwellTourOverlay {...defaultProps} targetEl={null} />);

      expect(screen.getByText(/Cannot find this element?/i)).toBeInTheDocument();
    });

    test('does not show fallback message when targetEl is provided', () => {
      const targetEl = document.createElement('div');
      targetEl.scrollIntoView = vi.fn();
      document.body.appendChild(targetEl);

      render(<InkwellTourOverlay {...defaultProps} targetEl={targetEl} />);

      expect(screen.queryByText(/Cannot find this element?/i)).not.toBeInTheDocument();

      document.body.removeChild(targetEl);
    });

    test('scrolls target into view when active', async () => {
      const targetEl = document.createElement('div');
      targetEl.scrollIntoView = vi.fn();
      document.body.appendChild(targetEl);

      render(<InkwellTourOverlay {...defaultProps} targetEl={targetEl} />);

      await waitFor(() => {
        expect(targetEl.scrollIntoView).toHaveBeenCalledWith({
          behavior: 'smooth',
          block: 'center',
        });
      });

      document.body.removeChild(targetEl);
    });
  });

  describe('Accessibility', () => {
    test('has correct ARIA attributes', () => {
      render(<InkwellTourOverlay {...defaultProps} />);

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby', 'tour-title');
    });

    test('focuses primary button on mount', async () => {
      render(<InkwellTourOverlay {...defaultProps} />);

      await waitFor(() => {
        const nextButton = screen.getByText('Next →');
        expect(nextButton).toHaveFocus();
      });
    });

    test('focuses Finish button on last step', async () => {
      render(<InkwellTourOverlay {...defaultProps} stepIndex={4} totalSteps={5} />);

      await waitFor(() => {
        const finishButton = screen.getByText('Finish Tour');
        expect(finishButton).toHaveFocus();
      });
    });
  });

  describe('Highlight Pulse', () => {
    test('renders pulse ring when highlightPulse is true and targetEl exists', () => {
      const targetEl = document.createElement('div');
      targetEl.scrollIntoView = vi.fn();
      Object.defineProperty(targetEl, 'getBoundingClientRect', {
        value: () => ({
          top: 100,
          left: 100,
          width: 200,
          height: 50,
        }),
      });
      document.body.appendChild(targetEl);

      render(<InkwellTourOverlay {...defaultProps} targetEl={targetEl} highlightPulse={true} />);

      // Query from document.body since component uses createPortal
      const pulseRing = document.body.querySelector('.animate-inkwell-pulse');
      expect(pulseRing).toBeInTheDocument();

      document.body.removeChild(targetEl);
    });

    test('does not render pulse ring when highlightPulse is false', () => {
      const targetEl = document.createElement('div');
      targetEl.scrollIntoView = vi.fn();
      document.body.appendChild(targetEl);

      const { container } = render(
        <InkwellTourOverlay {...defaultProps} targetEl={targetEl} highlightPulse={false} />,
      );

      const pulseRing = container.querySelector('.animate-inkwell-pulse');
      expect(pulseRing).not.toBeInTheDocument();

      document.body.removeChild(targetEl);
    });
  });

  describe('Cleanup', () => {
    test('removes event listeners on unmount', () => {
      const removeEventListenerSpy = vi.spyOn(window, 'removeEventListener');

      const { unmount } = render(<InkwellTourOverlay {...defaultProps} />);

      unmount();

      expect(removeEventListenerSpy).toHaveBeenCalledWith('keydown', expect.any(Function));
    });
  });
});
