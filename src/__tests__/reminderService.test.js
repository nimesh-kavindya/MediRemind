import { describe, it, expect, vi } from 'vitest';
import { calculateNextReminder } from '../services/reminderService';
import { setSystemTime } from 'date-fns';

describe('reminderService', () => {
  it('should identify the next upcoming reminder', () => {
    const mockMeds = [
      { id: '1', name: 'A', reminderTime: '08:00', taken: false },
      { id: '2', name: 'B', reminderTime: '14:00', taken: false },
    ];
    
    // Mock current time to 10:00
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 1, 10, 0, 0)); 
    
    const result = calculateNextReminder(mockMeds);
    
    expect(result).not.toBeNull();
    expect(result.medication.name).toBe('B');
    expect(result.isMissed).toBe(false);
    
    vi.useRealTimers();
  });

  it('should identify a missed reminder', () => {
    const mockMeds = [
      { id: '1', name: 'A', reminderTime: '08:00', taken: false },
      { id: '2', name: 'B', reminderTime: '20:00', taken: false },
    ];
    
    // Mock current time to 10:00
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 7, 1, 10, 0, 0)); 
    
    const result = calculateNextReminder(mockMeds);
    
    // A was at 08:00, it's 10:00 now, and it's not taken -> missed
    expect(result).not.toBeNull();
    expect(result.medication.name).toBe('A');
    expect(result.isMissed).toBe(true);
    
    vi.useRealTimers();
  });
});
