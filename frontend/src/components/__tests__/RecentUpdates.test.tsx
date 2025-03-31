import React from 'react';
import { render, screen, act } from '@testing-library/react';
import RecentUpdates from '../RecentUpdates';
import { useWebSocket } from '../../hooks/useWebSocket';

// Mock the useWebSocket hook
jest.mock('../../hooks/useWebSocket');

describe('RecentUpdates', () => {
  const mockUpdates = [
    {
      id: '1',
      itemName: 'Test Item',
      action: 'add' as const,
      quantity: 5,
      unit: 'kg',
      timestamp: '2024-03-20T10:00:00Z',
      userId: 'user1',
      userName: 'Test User'
    }
  ];

  beforeEach(() => {
    // Reset all mocks before each test
    jest.clearAllMocks();
  });

  test('renders with initial updates', () => {
    render(<RecentUpdates updates={mockUpdates} />);
    
    expect(screen.getByText('Recent Updates')).toBeInTheDocument();
    expect(screen.getByText('Added 5 kg of Test Item')).toBeInTheDocument();
  });

  test('displays real-time transcription when received', () => {
    // Mock the useWebSocket hook to simulate receiving transcription
    (useWebSocket as jest.Mock).mockImplementation((url, handlers) => {
      // Simulate receiving a transcription message
      act(() => {
        handlers.onMessage({
          data: JSON.stringify({
            type: 'transcript',
            text: 'Current transcription text'
          })
        });
      });
    });

    render(<RecentUpdates updates={mockUpdates} />);
    
    expect(screen.getByText('Current transcription text')).toBeInTheDocument();
  });

  test('displays feedback updates when received', () => {
    const feedbackMessage = 'New feedback update';
    
    // Mock the useWebSocket hook to simulate receiving feedback
    (useWebSocket as jest.Mock).mockImplementation((url, handlers) => {
      // Simulate receiving a feedback message
      act(() => {
        handlers.onMessage({
          data: JSON.stringify({
            type: 'feedback',
            data: { text: feedbackMessage }
          })
        });
      });
    });

    render(<RecentUpdates updates={mockUpdates} />);
    
    expect(screen.getByText(feedbackMessage)).toBeInTheDocument();
  });

  test('handles empty updates array', () => {
    render(<RecentUpdates updates={[]} />);
    
    expect(screen.getByText('No recent updates')).toBeInTheDocument();
  });

  test('respects maxItems prop', () => {
    const manyUpdates = Array.from({ length: 10 }, (_, i) => ({
      id: String(i),
      itemName: `Item ${i}`,
      action: 'add' as const,
      quantity: 1,
      unit: 'kg',
      timestamp: new Date(Date.now() - i * 1000).toISOString(),
      userId: 'user1',
      userName: 'Test User'
    }));

    render(<RecentUpdates updates={manyUpdates} maxItems={3} />);
    
    // Should only show 3 items
    const items = screen.getAllByRole('listitem');
    expect(items).toHaveLength(3);
  });
}); 