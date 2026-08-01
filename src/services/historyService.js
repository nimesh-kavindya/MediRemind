import { 
  collection, 
  addDoc, 
  getDocs, 
  deleteDoc, 
  doc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../utils/firebase';

const getLocalStorageLogs = (userId) => {
  try {
    const activeUser = userId || 'demo_user';
    const saved = localStorage.getItem(`dose_logs_${activeUser}`);
    return saved ? JSON.parse(saved) : null;
  } catch (err) {
    console.warn('Failed to read dose logs from localStorage:', err);
    return null;
  }
};

const saveLocalStorageLogs = (userId, logs) => {
  try {
    const activeUser = userId || 'demo_user';
    localStorage.setItem(`dose_logs_${activeUser}`, JSON.stringify(logs));
    window.dispatchEvent(new Event('dose_logs_updated'));
  } catch (err) {
    console.warn('Failed to write dose logs to localStorage:', err);
  }
};

// Generate realistic mock 30-day dose history if user has no history yet
export const generateDefault30DayHistory = (userId) => {
  try {
    const activeUser = userId || 'demo_user';
    let localMeds = [];
    try {
      localMeds = JSON.parse(localStorage.getItem(`meds_${activeUser}`) || '[]');
    } catch (err) {
      console.warn('Failed to parse meds in generateDefault30DayHistory:', err);
    }
    const medList = localMeds.length > 0 ? localMeds : [
      { name: 'Amoxicillin', dosage: '500mg', type: 'capsule', scheduledTime: '08:00' },
      { name: 'Vitamin D3', dosage: '1000 IU', type: 'pill', scheduledTime: '13:00' },
      { name: 'Omeprazole', dosage: '20mg', type: 'pill', scheduledTime: '20:00' }
    ];

  const mockLogs = [];
  const now = new Date();

  // Loop back 30 days
  for (let i = 29; i >= 0; i--) {
    const logDate = new Date(now);
    logDate.setDate(now.getDate() - i);
    const dateStr = logDate.toISOString().split('T')[0];

    medList.forEach((med, idx) => {
      // Create high compliance rate (~88% taken, ~8% missed, ~4% skipped)
      const rand = Math.random();
      let status = 'taken';
      if (rand > 0.92) status = 'missed';
      else if (rand > 0.86) status = 'skipped';

      const timeParts = (med.reminderTime || med.scheduledTime || '09:00').split(':');
      const scheduledDateTime = new Date(logDate);
      scheduledDateTime.setHours(parseInt(timeParts[0], 10) || 9, parseInt(timeParts[1], 10) || 0, 0, 0);

      mockLogs.push({
        id: `log_${dateStr}_${med.id || idx}_${Math.random().toString(36).substring(7)}`,
        medId: med.id || `m_${idx}`,
        medName: med.name,
        dosage: med.dosage || '1 dose',
        type: med.type || 'pill',
        scheduledTime: med.reminderTime || med.scheduledTime || '09:00',
        timestamp: scheduledDateTime.toISOString(),
        dateStr: dateStr,
        status: status,
        notes: status === 'taken' ? 'Taken on schedule with water' : (status === 'skipped' ? 'Skipped per doctor advice' : 'Missed morning alert'),
        createdAt: scheduledDateTime.toISOString()
      });
    });
  }

  saveLocalStorageLogs(activeUser, mockLogs);
  return mockLogs;
  } catch (err) {
    console.error('generateDefault30DayHistory failed:', err);
    return [];
  }
};

// Log a single dose event
export const logDoseEvent = async (userId, doseData) => {
  const activeUser = userId || 'demo_user';
  const timestamp = new Date();
  const dateStr = timestamp.toISOString().split('T')[0];

  const newLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substring(7)}`,
    medId: doseData.medId || 'custom',
    medName: doseData.medName || 'Medication',
    dosage: doseData.dosage || '1 dose',
    type: doseData.type || 'pill',
    category: doseData.category || 'Daily',
    scheduledTime: doseData.scheduledTime || timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    timestamp: timestamp.toISOString(),
    dateStr: dateStr,
    status: doseData.status || 'taken', // 'taken', 'missed', 'skipped'
    notes: doseData.notes || '',
    createdAt: timestamp.toISOString()
  };

  // 1. Update LocalStorage immediately
  const existing = getLocalStorageLogs(activeUser) || [];
  const updated = [newLog, ...existing];
  saveLocalStorageLogs(activeUser, updated);

  // 2. Try Firestore background sync
  try {
    const logsRef = collection(db, `users/${activeUser}/dose_logs`);
    await addDoc(logsRef, {
      ...newLog,
      createdAt: serverTimestamp()
    });
  } catch (err) {
    console.warn('Firestore dose_logs sync skipped, saved locally:', err);
  }

  return newLog;
};

// Log a batch of dose events sequentially
export const logBatchDoseEvents = async (userId, doseData, count = 1) => {
  const activeUser = userId || 'demo_user';
  const newLogs = [];

  const baseTimeStr = doseData.scheduledTime || '08:00';
  const baseDateStr = doseData.dateStr || new Date().toISOString().split('T')[0];

  for (let i = 0; i < count; i++) {
    const baseDateTime = new Date(`${baseDateStr}T${baseTimeStr}:00`);
    // Sequential offset (add i hours to make them sequential and ordered)
    const offsetMs = i * 60 * 60 * 1000;
    const d = new Date(baseDateTime.getTime() + offsetMs);
    const dateStr = d.toISOString().split('T')[0];
    const scheduledTime = d.toTimeString().substring(0, 5);

    const notesStr = count > 1 
      ? `${doseData.notes || 'Logged manually'} (Batch ${i + 1}/${count})` 
      : (doseData.notes || '');

    const newLog = {
      id: `log_${Date.now()}_${i}_${Math.random().toString(36).substring(7)}`,
      medId: doseData.medId || 'custom',
      medName: doseData.medName || 'Medication',
      dosage: doseData.dosage || '1 dose',
      type: doseData.type || 'pill',
      category: doseData.category || 'Daily',
      scheduledTime: scheduledTime,
      timestamp: d.toISOString(),
      dateStr: dateStr,
      status: doseData.status || 'taken',
      notes: notesStr,
      createdAt: d.toISOString()
    };
    newLogs.push(newLog);
  }

  // 1. Update LocalStorage immediately
  const existing = getLocalStorageLogs(activeUser) || [];
  const updated = [...newLogs, ...existing];
  saveLocalStorageLogs(activeUser, updated);

  // 2. Try Firestore background sync for each doc
  try {
    const logsRef = collection(db, `users/${activeUser}/dose_logs`);
    for (const log of newLogs) {
      await addDoc(logsRef, {
        ...log,
        createdAt: serverTimestamp()
      });
    }
  } catch (err) {
    console.warn('Firestore dose_logs batch sync skipped, saved locally:', err);
  }

  return newLogs;
};

// Get all logs for a user
export const getDoseLogs = async (userId) => {
  const activeUser = userId || 'demo_user';
  let localLogs = getLocalStorageLogs(activeUser) || [];

  // Try fetching from Firestore asynchronously
  try {
    const q = query(
      collection(db, `users/${activeUser}/dose_logs`),
      orderBy('createdAt', 'desc'),
      limit(200)
    );
    const snapshot = await getDocs(q);
    if (!snapshot.empty) {
      const firestoreLogs = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          ...data,
          id: data.id || doc.id
        };
      });

      // Intelligently merge local logs to avoid wiping out recently added ones that are still syncing
      const firestoreIds = new Set(firestoreLogs.map(l => l.id));
      const firestoreKeys = new Set(firestoreLogs.map(l => `${l.medName}_${l.timestamp}`));

      const mergedLogs = [...firestoreLogs];
      for (const localLog of localLogs) {
        const key = `${localLog.medName}_${localLog.timestamp}`;
        if (!firestoreIds.has(localLog.id) && !firestoreKeys.has(key)) {
          mergedLogs.push(localLog);
        }
      }

      // Sort merged logs by timestamp descending
      mergedLogs.sort((a, b) => new Date(b.timestamp || b.createdAt || 0) - new Date(a.timestamp || a.createdAt || 0));

      saveLocalStorageLogs(activeUser, mergedLogs);
      return mergedLogs;
    }
  } catch (err) {
    console.warn('Firestore dose_logs fetch fallback to local logs:', err);
  }

  return localLogs;
};

// Clear all logs for a user
export const clearAllDoseLogs = async (userId) => {
  const activeUser = userId || 'demo_user';
  saveLocalStorageLogs(activeUser, []);
};

// Delete a dose log entry
export const deleteDoseLog = async (userId, logId) => {
  const activeUser = userId || 'demo_user';
  const existing = getLocalStorageLogs(activeUser) || [];
  const filtered = existing.filter(l => l.id !== logId);
  saveLocalStorageLogs(activeUser, filtered);

  try {
    const logRef = doc(db, `users/${activeUser}/dose_logs`, logId);
    await deleteDoc(logRef);
  } catch (err) {
    console.warn('Firestore delete log failed, removed locally:', err);
  }
};

// Calculate 30-day adherence statistics & daily trend
export const calculate30DayAdherence = (logs = [], daysCount = 30) => {
  if (!logs || logs.length === 0) {
    return {
      totalDoses: 0,
      takenCount: 0,
      missedCount: 0,
      skippedCount: 0,
      overallAdherence: 0,
      dailyTrend: [],
      medicationCompliance: [],
      currentStreak: 0
    };
  }

  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - (daysCount - 1));
  startDate.setHours(0, 0, 0, 0);

  // Filter logs within requested days range
  const filteredLogs = logs.filter(log => {
    const logDate = new Date(log.timestamp || log.createdAt || log.dateStr);
    return logDate >= startDate;
  });

  const totalDoses = filteredLogs.length;
  const takenCount = filteredLogs.filter(l => l.status === 'taken').length;
  const missedCount = filteredLogs.filter(l => l.status === 'missed').length;
  const skippedCount = filteredLogs.filter(l => l.status === 'skipped').length;

  const overallAdherence = totalDoses > 0 ? Math.round((takenCount / totalDoses) * 100) : 0;

  // Build daily trend map
  const dailyMap = {};
  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayLabel = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    dailyMap[dateStr] = { dateStr, dayLabel, total: 0, taken: 0, missed: 0, skipped: 0 };
  }

  filteredLogs.forEach(log => {
    const logDateStr = log.dateStr || new Date(log.timestamp).toISOString().split('T')[0];
    if (dailyMap[logDateStr]) {
      dailyMap[logDateStr].total += 1;
      if (log.status === 'taken') dailyMap[logDateStr].taken += 1;
      else if (log.status === 'missed') dailyMap[logDateStr].missed += 1;
      else if (log.status === 'skipped') dailyMap[logDateStr].skipped += 1;
    }
  });

  const dailyTrend = Object.values(dailyMap).map(day => ({
    date: day.dayLabel,
    dateStr: day.dateStr,
    adherence: day.total > 0 ? Math.round((day.taken / day.total) * 100) : 100,
    taken: day.taken,
    missed: day.missed,
    skipped: day.skipped,
    total: day.total
  }));

  // Per medication compliance
  const medGroup = {};
  filteredLogs.forEach(log => {
    const medName = log.medName || 'Unknown';
    if (!medGroup[medName]) {
      medGroup[medName] = { name: medName, total: 0, taken: 0 };
    }
    medGroup[medName].total += 1;
    if (log.status === 'taken') medGroup[medName].taken += 1;
  });

  const medicationCompliance = Object.values(medGroup).map(med => ({
    name: med.name,
    total: med.total,
    taken: med.taken,
    rate: Math.round((med.taken / med.total) * 100)
  })).sort((a, b) => b.rate - a.rate);

  // Calculate current streak
  let currentStreak = 0;
  const sortedDays = Object.values(dailyMap).reverse();
  for (const day of sortedDays) {
    if (day.total > 0 && day.taken === day.total) {
      currentStreak += 1;
    } else if (day.total > 0 && day.taken < day.total) {
      break;
    }
  }

  return {
    totalDoses,
    takenCount,
    missedCount,
    skippedCount,
    overallAdherence,
    dailyTrend,
    medicationCompliance,
    currentStreak
  };
};
