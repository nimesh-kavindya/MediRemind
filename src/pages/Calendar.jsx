import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, query, getDocs } from 'firebase/firestore';
import { db } from '../utils/firebase';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Loader from '../components/Loader';
import { format, startOfWeek, addDays, isSameDay } from 'date-fns';
import { Pill, CheckCircle2, Circle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Calendar() {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const fetchMeds = async () => {
      try {
        const q = query(collection(db, `users/${user.uid}/medications`));
        const snapshot = await getDocs(q);
        const meds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (meds.length > 0) {
          setMedications(meds);
        } else {
          const saved = JSON.parse(localStorage.getItem(`meds_${user.uid}`) || '[]');
          setMedications(saved);
        }
      } catch (e) {
        console.warn('Firestore fetch failed in Calendar, using local storage:', e);
        const saved = JSON.parse(localStorage.getItem(`meds_${user.uid}`) || '[]');
        setMedications(saved);
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) fetchMeds();

    const handleUpdate = () => fetchMeds();
    window.addEventListener('local_meds_updated', handleUpdate);
    window.addEventListener('calendar_updated', handleUpdate);

    return () => {
      window.removeEventListener('local_meds_updated', handleUpdate);
      window.removeEventListener('calendar_updated', handleUpdate);
    };
  }, [user]);


  // Generate 14 days calendar starting from start of current week
  const startDate = startOfWeek(new Date(), { weekStartsOn: 1 });
  const days = Array.from({ length: 14 }).map((_, i) => addDays(startDate, i));

  // Dummy filter logic: In a real app, you'd check history subcollections per medication.
  // Here we just display them.
  const medsForSelectedDate = medications; 

  if (loading) return <div className="p-12 flex justify-center"><Loader size="lg" /></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12">
      <PageHeader title="Medication Calendar" description="Track your past and future schedule." />

      <Card className="overflow-x-auto">
        <div className="flex gap-2 min-w-max pb-4">
          {days.map(day => (
            <button
              key={day.toISOString()}
              onClick={() => setSelectedDate(day)}
              className={`flex flex-col items-center justify-center p-3.5 rounded-2xl min-w-[70px] transition-all ${
                isSameDay(day, selectedDate)
                  ? 'bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-500 text-slate-950 font-bold shadow-md shadow-teal-500/20 scale-105'
                  : 'bg-slate-100/80 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300 hover:bg-slate-200/80 dark:hover:bg-slate-700/80'
              }`}
            >
              <span className="text-xs font-medium uppercase mb-1">{format(day, 'EEE')}</span>
              <span className="text-xl font-bold">{format(day, 'd')}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="space-y-4 mt-8">
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          Schedule for {format(selectedDate, 'MMMM d, yyyy')}
        </h3>
        
        {medsForSelectedDate.length === 0 ? (
          <Card className="text-center p-12 text-gray-500">
            No medications scheduled for this date.
          </Card>
        ) : (
          medsForSelectedDate.map((med, i) => (
            <motion.div
              key={med.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="flex items-center gap-4">
                {med.taken ? (
                  <CheckCircle2 size={24} className="text-success fill-success/20" />
                ) : (
                  <Circle size={24} className="text-gray-400" />
                )}
                <div>
                  <h4 className="font-bold text-gray-900 dark:text-white">{med.name} - {med.dosage}</h4>
                  <p className="text-sm text-gray-500">
                    <span className="font-medium">{med.reminderTime || 'Anytime'}</span> • {med.mealTiming}
                  </p>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
}
