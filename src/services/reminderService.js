import { parse, isAfter, isBefore, format, addDays, parseISO } from 'date-fns';

export const parseTimeToMinutes = (timeStr) => {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const cleaned = timeStr.trim().toUpperCase();
  const isPM = cleaned.includes('PM');
  const isAM = cleaned.includes('AM');
  const numericPart = cleaned.replace(/[^\d:]/g, '');
  const parts = numericPart.split(':');
  let hours = parseInt(parts[0], 10);
  let minutes = parseInt(parts[1], 10) || 0;
  if (isNaN(hours)) return null;

  if (isPM && hours < 12) {
    hours += 12;
  } else if (isAM && hours === 12) {
    hours = 0;
  }
  return hours * 60 + minutes;
};

export const calculateNextReminder = (medications = [], doseLogs = []) => {
  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const todayStr = now.toISOString().split('T')[0];
  const safeMeds = Array.isArray(medications) ? medications.filter(Boolean) : [];
  const safeLogs = Array.isArray(doseLogs) ? doseLogs.filter(Boolean) : [];

  const isTaken = (med) => {
    if (med.taken || med.status === 'TAKEN' || med.status === 'completed') return true;
    return safeLogs.some(l => 
      (l.medicationId === med.id || l.medId === med.id || l.medicationName?.toLowerCase() === med.name?.toLowerCase()) &&
      (l.dateStr === todayStr || l.date === todayStr || (l.timestamp && l.timestamp.startsWith(todayStr))) &&
      (l.status?.toLowerCase() === 'taken' || l.status?.toLowerCase() === 'completed')
    );
  };

  const candidateReminders = [];
  safeMeds.forEach(m => {
    if (!m || !m.reminderTime) return;
    if (isTaken(m)) return;
    const times = Array.isArray(m.reminderTime) ? m.reminderTime : [m.reminderTime].filter(Boolean);
    times.forEach(timeStr => {
      const schedMins = parseTimeToMinutes(timeStr);
      if (schedMins === null) return;

      candidateReminders.push({
        medication: m,
        time: timeStr,
        schedMins
      });
    });
  });

  // 1. Check for Upcoming (schedMins >= currentMinutes)
  const upcoming = candidateReminders
    .filter(r => r.schedMins >= currentMinutes)
    .sort((a, b) => a.schedMins - b.schedMins);

  if (upcoming.length > 0) {
    return {
      medication: upcoming[0].medication,
      time: upcoming[0].time,
      isMissed: false
    };
  }

  // 2. Check for Missed with 60-minute grace period buffer (currentMinutes > schedMins + 60)
  const missed = candidateReminders
    .filter(r => currentMinutes > r.schedMins + 60)
    .sort((a, b) => b.schedMins - a.schedMins);

  if (missed.length > 0) {
    return {
      medication: missed[0].medication,
      time: missed[0].time,
      isMissed: true
    };
  }

  return null;
};
