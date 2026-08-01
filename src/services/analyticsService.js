/**
 * Calculates real active streak and longest streak from actual user logs and current medication status.
 */
function computeStreaks(medications = [], logs = []) {
  const takenDateSet = new Set();

  // 1. Collect dates from historical logs where status === 'taken'
  if (Array.isArray(logs)) {
    logs.forEach(log => {
      if (log.status === 'taken') {
        const dateStr = log.dateStr || (log.timestamp ? log.timestamp.split('T')[0] : null);
        if (dateStr) {
          takenDateSet.add(dateStr);
        }
      }
    });
  }

  // 2. Check if any current medication is marked taken today
  const todayStr = new Date().toISOString().split('T')[0];
  const hasTakenToday = medications.some(m => m.taken);
  if (hasTakenToday) {
    takenDateSet.add(todayStr);
  }

  if (takenDateSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Convert dates YYYY-MM-DD to midnight timestamps (in days since epoch)
  const sortedDayIndices = Array.from(takenDateSet)
    .map(dateStr => {
      const [y, m, d] = dateStr.split('-').map(Number);
      return Math.floor(Date.UTC(y, m - 1, d) / (1000 * 60 * 60 * 24));
    })
    .filter(n => !isNaN(n))
    .sort((a, b) => a - b);

  // Remove duplicates
  const uniqueDays = Array.from(new Set(sortedDayIndices));

  if (uniqueDays.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  // Calculate longest streak across history
  let longestStreak = 1;
  let currentRun = 1;

  for (let i = 1; i < uniqueDays.length; i++) {
    if (uniqueDays[i] === uniqueDays[i - 1] + 1) {
      currentRun += 1;
    } else if (uniqueDays[i] > uniqueDays[i - 1] + 1) {
      currentRun = 1;
    }
    if (currentRun > longestStreak) {
      longestStreak = currentRun;
    }
  }

  // Calculate current active streak ending today or yesterday
  const now = new Date();
  const todayIndex = Math.floor(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()) / (1000 * 60 * 60 * 24));
  const yesterdayIndex = todayIndex - 1;

  const lastTakenDay = uniqueDays[uniqueDays.length - 1];

  let currentStreak = 0;
  // Active streak counts if user took dose today OR yesterday (so streak doesn't drop to 0 before taking today's dose)
  if (lastTakenDay === todayIndex || lastTakenDay === yesterdayIndex) {
    currentStreak = 1;
    for (let i = uniqueDays.length - 1; i > 0; i--) {
      if (uniqueDays[i] === uniqueDays[i - 1] + 1) {
        currentStreak += 1;
      } else {
        break;
      }
    }
  }

  return {
    currentStreak,
    longestStreak: Math.max(longestStreak, currentStreak)
  };
}

function computeWeeklyData(medications = [], logs = [], currentAdherence = 0) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const now = new Date();
  const result = [];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayName = days[d.getDay()];

    if (i === 0) {
      result.push({ day: dayName, adherence: currentAdherence });
    } else {
      const dayLogs = (logs || []).filter(l => (l.dateStr === dateStr || (l.timestamp && l.timestamp.startsWith(dateStr))));
      if (dayLogs.length > 0) {
        const taken = dayLogs.filter(l => l.status === 'taken').length;
        const adh = Math.round((taken / dayLogs.length) * 100);
        result.push({ day: dayName, adherence: adh });
      } else {
        result.push({ day: dayName, adherence: medications.length > 0 ? 0 : 100 });
      }
    }
  }

  return result;
}

export const calculateAdherenceStats = (medications = [], logs = []) => {
  const safeMeds = Array.isArray(medications) ? medications : [];
  const safeLogs = Array.isArray(logs) ? logs : [];
  const totalMeds = safeMeds.length;
  const takenMeds = safeMeds.filter(m => m && m.taken).length;
  const pendingMeds = totalMeds - takenMeds;
  const adherence = totalMeds === 0 ? 0 : Math.round((takenMeds / totalMeds) * 100);

  // Group by type for pie chart
  const typeDistribution = safeMeds.reduce((acc, med) => {
    if (!med) return acc;
    const type = med.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeChartData = Object.keys(typeDistribution).map(key => ({
    name: key,
    value: typeDistribution[key]
  }));

  const { currentStreak, longestStreak } = computeStreaks(safeMeds, safeLogs);
  const weeklyData = computeWeeklyData(safeMeds, safeLogs, adherence);

  return {
    totalMeds,
    takenMeds,
    pendingMeds,
    adherence,
    typeChartData,
    weeklyData,
    currentStreak,
    longestStreak
  };
};

