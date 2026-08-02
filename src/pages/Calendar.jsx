import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { CheckCircle2, Circle, Clock, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Calendar() {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [doseLogs, setDoseLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  const loadData = () => {
    try {
      const activeUid = user?.uid || 'demo_user';
      const medsRaw = localStorage.getItem('medications') || localStorage.getItem(`meds_${activeUid}`);
      const logsRaw = localStorage.getItem('dose_logs') || localStorage.getItem(`dose_logs_${activeUid}`);

      const meds = medsRaw ? JSON.parse(medsRaw) : [];
      const logs = logsRaw ? JSON.parse(logsRaw) : [];

      setMedications(Array.isArray(meds) ? meds.filter(m => m && m.id) : []);
      setDoseLogs(Array.isArray(logs) ? logs.filter(l => l && (l.id || l.medicationId || l.medId)) : []);
    } catch (e) {
      console.warn('Error loading local data in Calendar:', e);
      setMedications([]);
      setDoseLogs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleUpdate = () => loadData();
    window.addEventListener('local_meds_updated', handleUpdate);
    window.addEventListener('dose_logs_updated', handleUpdate);
    window.addEventListener('calendar_updated', handleUpdate);

    return () => {
      window.removeEventListener('local_meds_updated', handleUpdate);
      window.removeEventListener('dose_logs_updated', handleUpdate);
      window.removeEventListener('calendar_updated', handleUpdate);
    };
  }, [user]);

  // Generate 14 days calendar starting from start of current week
  const today = new Date();
  const startDate = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 14 }).map((_, i) => addDays(startDate, i));

  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd');
  const todayStr = format(today, 'yyyy-MM-dd');

  // Filter medications strictly active or logged on selectedDate
  const medsForSelectedDate = useMemo(() => {
    const safeMeds = Array.isArray(medications) ? medications : [];
    const safeLogs = Array.isArray(doseLogs) ? doseLogs : [];

    return safeMeds.filter(med => {
      if (!med || !med.id) return false;

      // Medication creation/start date
      const medDate = med.scheduledDate || med.startDate || (med.createdAt ? String(med.createdAt).split('T')[0] : '');

      // Strict date check: if selected date is BEFORE medication creation/start date, do NOT show
      if (medDate && selectedDateStr < medDate) {
        return false;
      }

      // End date check if specified
      if (med.endDate && selectedDateStr > med.endDate) {
        return false;
      }

      // Check frequency rules
      if (med.frequency === 'Daily' || !med.frequency) {
        return true;
      }
      if (med.scheduledDate && med.scheduledDate === selectedDateStr) {
        return true;
      }

      // Also check if there's an explicit log recorded for this date
      const hasLogForDate = safeLogs.some(l => 
        (l.medicationId === med.id || l.medId === med.id) && 
        (l.date === selectedDateStr || l.dateStr === selectedDateStr)
      );

      return hasLogForDate || medDate === selectedDateStr;
    }).map(med => {
      // Determine if taken on selectedDateStr
      const log = safeLogs.find(l => 
        (l.medicationId === med.id || l.medId === med.id) && 
        (l.date === selectedDateStr || l.dateStr === selectedDateStr) &&
        (l.status === 'TAKEN' || l.status === 'taken' || l.status === 'completed' || l.status === 'COMPLETED')
      );

      const isTaken = !!log || (selectedDateStr === todayStr && (med.taken || med.status === 'TAKEN'));
      return {
        ...med,
        isTakenOnSelectedDate: isTaken
      };
    });
  }, [medications, doseLogs, selectedDateStr, todayStr]);

  if (loading) return <div className="p-12 flex justify-center"><Loader size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader title="Medication Calendar" description="Track your past, present, and upcoming schedule." />

      <Card className="overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-4">
          {(Array.isArray(days) ? days : []).map(day => {
            const isToday = isSameDay(day, today);
            const isSelected = isSameDay(day, selectedDate);
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={`flex flex-col items-center justify-center p-3.5 rounded-2xl min-w-[70px] transition-all relative ${
                  isSelected
                    ? 'bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-500 text-slate-950 font-bold shadow-md shadow-teal-500/20 scale-105'
                    : 'bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
                }`}
              >
                <span className="text-xs font-medium uppercase mb-1">{format(day, 'EEE')}</span>
                <span className="text-xl font-bold">{format(day, 'd')}</span>
                {isToday && (
                  <span className={`text-[9px] font-extrabold px-1.5 py-0.5 rounded-full mt-1 ${isSelected ? 'bg-slate-950 text-teal-400' : 'bg-teal-500/20 text-teal-600 dark:text-teal-400'}`}>
                    Today
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </Card>

      <div className="space-y-4 mt-8">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CalendarIcon size={20} className="text-teal-500" />
            Schedule for {format(selectedDate, 'MMMM d, yyyy')}
          </h3>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {medsForSelectedDate.length} Medication{medsForSelectedDate.length === 1 ? '' : 's'}
          </span>
        </div>
        
        {medsForSelectedDate.length === 0 ? (
          <Card className="text-center p-12 text-slate-500 dark:text-slate-400 font-medium">
            No medications scheduled for this date.
          </Card>
        ) : (
          medsForSelectedDate.map((med, i) => (
            <motion.div
              key={med.id || i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  {med.isTakenOnSelectedDate ? (
                    <CheckCircle2 size={26} className="text-emerald-500 fill-emerald-500/20 shrink-0" />
                  ) : (
                    <Circle size={26} className="text-slate-400 shrink-0" />
                  )}
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <span>{med.name}</span>
                      {med.dosage && <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">({med.dosage})</span>}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-2">
                      <Clock size={12} className="text-teal-500" />
                      <span>{Array.isArray(med.reminderTime) ? med.reminderTime.join(', ') : (med.reminderTime || 'Anytime')}</span>
                      {med.mealTiming && med.mealTiming !== 'none' && (
                        <span>• {String(med.mealTiming).replace('_', ' ')}</span>
                      )}
                    </p>
                  </div>
                </div>

                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                  med.isTakenOnSelectedDate
                    ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                }`}>
                  {med.isTakenOnSelectedDate ? 'Taken' : 'Scheduled'}
                </span>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
