export const calculateAdherenceStats = (medications) => {
  const totalMeds = medications.length;
  const takenMeds = medications.filter(m => m.taken).length;
  const pendingMeds = totalMeds - takenMeds;
  const adherence = totalMeds === 0 ? 0 : Math.round((takenMeds / totalMeds) * 100);

  // Group by type for pie chart
  const typeDistribution = medications.reduce((acc, med) => {
    const type = med.type || 'unknown';
    acc[type] = (acc[type] || 0) + 1;
    return acc;
  }, {});

  const typeChartData = Object.keys(typeDistribution).map(key => ({
    name: key,
    value: typeDistribution[key]
  }));

  // Dummy weekly data based on today's adherence
  const weeklyData = [
    { day: 'Mon', adherence: Math.min(100, adherence + Math.floor(Math.random() * 20 - 10)) },
    { day: 'Tue', adherence: Math.min(100, adherence + Math.floor(Math.random() * 20 - 10)) },
    { day: 'Wed', adherence: Math.min(100, adherence + Math.floor(Math.random() * 20 - 10)) },
    { day: 'Thu', adherence: Math.min(100, adherence + Math.floor(Math.random() * 20 - 10)) },
    { day: 'Fri', adherence: Math.min(100, adherence + Math.floor(Math.random() * 20 - 10)) },
    { day: 'Sat', adherence: Math.min(100, adherence + Math.floor(Math.random() * 20 - 10)) },
    { day: 'Sun', adherence }
  ];

  return {
    totalMeds,
    takenMeds,
    pendingMeds,
    adherence,
    typeChartData,
    weeklyData,
    currentStreak: adherence > 80 ? 5 : (adherence > 50 ? 2 : 0),
    longestStreak: 12
  };
};
