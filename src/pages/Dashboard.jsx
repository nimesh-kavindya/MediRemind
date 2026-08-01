import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar, Activity, Pill, AlertCircle, CheckCircle2, Circle, Search, BellRing, Trophy, Flame } from 'lucide-react';
import { collection, query, onSnapshot, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';

// Services
import { calculateNextReminder } from '../services/reminderService';
import { calculateAdherenceStats } from '../services/analyticsService';
import { scheduleLocalNotification } from '../services/notificationService';

// Charts
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const [medications, setMedications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    if (!user?.uid) return;
    
    const q = query(collection(db, `users/${user.uid}/medications`), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const meds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setMedications(meds);
      setLoading(false);
      
      // Schedule notifications for upcoming
      const nextReminder = calculateNextReminder(meds);
      if (nextReminder && !nextReminder.isMissed) {
        // Just a mock scheduling demo, in real life we'd use a service worker for exact timing
        scheduleLocalNotification(`Upcoming Dose: ${nextReminder.medication.name}`, {
          body: `Time to take your ${nextReminder.medication.dosage} at ${nextReminder.time}.`
        });
      }
    });

    return () => unsubscribe();
  }, [user]);

  const toggleTakenStatus = async (med) => {
    try {
      const medRef = doc(db, `users/${user.uid}/medications`, med.id);
      await updateDoc(medRef, { taken: !med.taken });
      toast.success(`Marked as ${!med.taken ? 'taken' : 'pending'}`);
    } catch (error) {
      toast.error('Failed to update status');
    }
  };

  const { totalMeds, takenMeds, pendingMeds, adherence, typeChartData, weeklyData, currentStreak, longestStreak } = calculateAdherenceStats(medications);
  const nextReminder = calculateNextReminder(medications);

  const filteredMeds = medications.filter(m => {
    const match = m.name?.toLowerCase().includes(searchTerm.toLowerCase());
    if (filterType === 'taken') return match && m.taken;
    if (filterType === 'pending') return match && !m.taken;
    return match;
  });

  const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

  if (loading) return <div className="flex justify-center p-12"><Loader size="lg" /></div>;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pb-12">
      <PageHeader title={`Welcome back, ${user?.name} 👋`} description="Here is your health overview." />

      {/* Next Reminder Highlight */}
      {nextReminder && (
        <Card className={`border-2 ${nextReminder.isMissed ? 'border-danger bg-red-50 dark:bg-red-900/10' : 'border-primary bg-blue-50 dark:bg-blue-900/10'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-full ${nextReminder.isMissed ? 'bg-danger/20 text-danger' : 'bg-primary/20 text-primary'}`}>
                <BellRing size={24} className={!nextReminder.isMissed ? 'animate-bounce' : ''} />
              </div>
              <div>
                <h4 className={`text-sm font-bold uppercase ${nextReminder.isMissed ? 'text-danger' : 'text-primary'}`}>
                  {nextReminder.isMissed ? 'Missed Dose' : 'Next Reminder'}
                </h4>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {nextReminder.time} - {nextReminder.medication.name}
                </p>
              </div>
            </div>
            <Button onClick={() => toggleTakenStatus(nextReminder.medication)}>Mark Taken</Button>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Adherence', value: `${adherence}%`, icon: Activity, color: 'text-primary' },
          { label: 'Taken', value: takenMeds, icon: CheckCircle2, color: 'text-success' },
          { label: 'Current Streak', value: `${currentStreak} Days`, icon: Flame, color: 'text-warning' },
          { label: 'Best Streak', value: `${longestStreak} Days`, icon: Trophy, color: 'text-purple-500' }
        ].map((stat, i) => (
          <Card key={i} className="flex flex-col items-center justify-center p-4 text-center">
            <stat.icon size={28} className={`${stat.color} mb-2`} />
            <h4 className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</h4>
            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">{stat.label}</span>
          </Card>
        ))}
      </div>

      {/* Analytics Charts */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="h-[300px] flex flex-col">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Weekly Adherence</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyData}>
                <XAxis dataKey="day" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                <Line type="monotone" dataKey="adherence" stroke="#2563EB" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card className="h-[300px] flex flex-col">
          <h3 className="font-bold text-gray-900 dark:text-white mb-4">Medicine Types</h3>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={typeChartData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                  {typeChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {typeChartData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-2 text-xs text-gray-500 capitalize">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                {entry.name}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Schedule */}
      <Card>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">Today's Schedule</h3>
          <div className="flex items-center gap-3">
            <Input placeholder="Search..." icon={Search} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
            <select 
              className="rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2 text-gray-900 dark:text-gray-100"
              value={filterType} onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All</option>
              <option value="pending">Pending</option>
              <option value="taken">Taken</option>
            </select>
          </div>
        </div>

        {filteredMeds.length === 0 ? (
          <EmptyState icon={Pill} title="No medications found" description="Nothing matches your criteria." />
        ) : (
          <div className="space-y-3">
            {filteredMeds.map((med) => (
              <div key={med.id} className="flex items-center justify-between p-4 rounded-xl border border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-4">
                  <button onClick={() => toggleTakenStatus(med)}>
                    {med.taken ? <CheckCircle2 size={28} className="text-success fill-success/20" /> : <Circle size={28} className="text-gray-400" />}
                  </button>
                  <div>
                    <h4 className={`font-semibold text-gray-900 dark:text-white ${med.taken ? 'line-through opacity-70' : ''}`}>
                      {med.name} - {med.dosage}
                    </h4>
                    <p className="text-sm text-gray-500"><Calendar size={12} className="inline mr-1" />{med.reminderTime || 'Anytime'} • {med.mealTiming}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </motion.div>
  );
}
