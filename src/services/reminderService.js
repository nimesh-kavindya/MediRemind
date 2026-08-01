import { parse, isAfter, isBefore, format, addDays, parseISO } from 'date-fns';

export const calculateNextReminder = (medications) => {
  const now = new Date();
  
  // Sort medications by their next upcoming reminder time for today
  const upcomingMeds = medications
    .filter(m => !m.taken)
    .filter(m => m.reminderTime)
    .map(m => {
      const reminderDate = parse(m.reminderTime, 'HH:mm', now);
      return {
        ...m,
        reminderDate
      };
    })
    .filter(m => isAfter(m.reminderDate, now))
    .sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime());

  if (upcomingMeds.length > 0) {
    const next = upcomingMeds[0];
    return {
      medication: next,
      time: next.reminderTime,
      isMissed: false
    };
  }
  
  // Check for missed ones today
  const missedMeds = medications
    .filter(m => !m.taken && m.reminderTime)
    .map(m => {
      const reminderDate = parse(m.reminderTime, 'HH:mm', now);
      return { ...m, reminderDate };
    })
    .filter(m => isBefore(m.reminderDate, now))
    .sort((a, b) => b.reminderDate.getTime() - a.reminderDate.getTime()); // Most recently missed first

  if (missedMeds.length > 0) {
    const lastMissed = missedMeds[0];
    return {
      medication: lastMissed,
      time: lastMissed.reminderTime,
      isMissed: true
    };
  }

  return null; // All caught up!
};
