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
      const q = query(collection(db, `users/${user.uid}/medications`));
      const snapshot = await getDocs(q);
      const meds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedications(meds);
      setLoading(false);
    };
    if (user?.uid) fetchMeds();
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
              className={`flex flex-col items-center justify-center p-3 rounded-2xl min-w-[70px] transition-colors ${
                isSameDay(day, selectedDate)
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
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
