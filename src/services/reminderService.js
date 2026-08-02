import { parse, isAfter, isBefore, format, addDays, parseISO } from 'date-fns';

export const calculateNextReminder = (medications = []) => {
  const now = new Date();
  const safeMeds = Array.isArray(medications) ? medications.filter(Boolean) : [];
  
  // Sort medications by their next upcoming reminder time for today
  const upcomingMeds = [];
  safeMeds
    .filter(m => m && !m.taken)
    .filter(m => m && m.reminderTime)
    .forEach(m => {
      const times = Array.isArray(m.reminderTime) ? m.reminderTime : [m.reminderTime].filter(Boolean);
      times.forEach(timeStr => {
        try {
          const reminderDate = parse(timeStr, 'HH:mm', now);
          upcomingMeds.push({
            ...m,
            reminderTime: timeStr, // track the active time
            reminderDate
          });
        } catch (e) {
          // ignore invalid times
        }
      });
    });

  const activeUpcoming = upcomingMeds
    .filter(m => isAfter(m.reminderDate, now))
    .sort((a, b) => a.reminderDate.getTime() - b.reminderDate.getTime());

  if (activeUpcoming.length > 0) {
    const next = activeUpcoming[0];
    return {
      medication: next,
      time: next.reminderTime,
      isMissed: false
    };
  }
  
  // Check for missed ones today
  const missedMeds = [];
  medications
    .filter(m => !m.taken && m.reminderTime)
    .forEach(m => {
      const times = Array.isArray(m.reminderTime) ? m.reminderTime : [m.reminderTime].filter(Boolean);
      times.forEach(timeStr => {
        try {
          const reminderDate = parse(timeStr, 'HH:mm', now);
          missedMeds.push({
            ...m,
            reminderTime: timeStr,
            reminderDate
          });
        } catch (e) {
          // ignore
        }
      });
    });

  const activeMissed = missedMeds
    .filter(m => isBefore(m.reminderDate, now))
    .sort((a, b) => b.reminderDate.getTime() - a.reminderDate.getTime()); // Most recently missed first

  if (activeMissed.length > 0) {
    const lastMissed = activeMissed[0];
    return {
      medication: lastMissed,
      time: lastMissed.reminderTime,
      isMissed: true
    };
  }

  return null; // All caught up!
};
