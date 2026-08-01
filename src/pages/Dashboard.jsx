import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Activity, Pill, AlertCircle, CheckCircle2, Circle, 
  Search, BellRing, Trophy, Flame, Package, AlertTriangle, RefreshCw, Boxes, Bot, Sparkles, ArrowRight, MessageSquare
} from 'lucide-react';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { useAuth } from '../context/AuthContext';
import { safeGetItem, safeSetItem } from '../utils';
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
import { logDoseEvent, getDoseLogs } from '../services/historyService';

// Charts
import { LineChart, Line, XAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [medications, setMedications] = useState([]);
  const [doseLogs, setDoseLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(() => {
    return searchParams.get('search') || '';
  });
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) {
      setSearchTerm(q);
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user?.uid) return;
    
    let unsubscribe = () => {};

    const loadLocalMeds = () => {
      const savedRaw = localStorage.getItem('medications') || safeGetItem(`meds_${user.uid}`, null);
      if (savedRaw === null || savedRaw === '[]') {
        // First initialization for new user
        const sampleMeds = [
          { id: 'm1', name: 'Amoxicillin', dosage: '500mg', type: 'capsule', frequency: 'Daily', mealTiming: 'after_meal', reminderTime: '08:00', taken: false, totalSupply: 30, remainingSupply: 4, dosesLeft: 4, remainingDoses: 4, lowSupplyThreshold: 5, createdAt: new Date().toISOString() },
          { id: 'm2', name: 'Vitamin D3', dosage: '1000 IU', type: 'pill', frequency: 'Daily', mealTiming: 'before_meal', reminderTime: '13:00', taken: true, totalSupply: 60, remainingSupply: 42, dosesLeft: 42, remainingDoses: 42, lowSupplyThreshold: 10, createdAt: new Date().toISOString() },
          { id: 'm3', name: 'Omeprazole', dosage: '20mg', type: 'pill', frequency: 'Daily', mealTiming: 'before_meal', reminderTime: '20:00', taken: false, totalSupply: 30, remainingSupply: 18, dosesLeft: 18, remainingDoses: 18, lowSupplyThreshold: 5, createdAt: new Date().toISOString() }
        ];
        localStorage.setItem('medications', JSON.stringify(sampleMeds));
        safeSetItem(`meds_${user.uid}`, JSON.stringify(sampleMeds));
        setMedications(sampleMeds);
      } else {
        try {
          const saved = JSON.parse(savedRaw);
          setMedications(Array.isArray(saved) ? saved : []);
        } catch (e) {
          console.error('Failed to parse meds from local storage', e);
          setMedications([]);
        }
      }
      setLoading(false);
    };

    // Fast initial load from local cache for instant zero-latency UI
    loadLocalMeds();

    const fetchDoseLogs = async () => {
      try {
        const logs = await getDoseLogs(user.uid);
        setDoseLogs(Array.isArray(logs) ? logs : []);
      } catch (err) {
        console.warn('Error fetching dose logs for streaks:', err);
      }
    };

    fetchDoseLogs();

    // Removed onSnapshot to prevent remote data from overwriting local state and causing checkmark reset bug.
    // Dashboard now strictly reads updated status from localStorage via loadLocalMeds() and local_meds_updated event.

    const handleLocalUpdate = () => {
      loadLocalMeds();
      fetchDoseLogs();
    };
    window.addEventListener('local_meds_updated', handleLocalUpdate);
    window.addEventListener('dose_logs_updated', fetchDoseLogs);

    return () => {
      unsubscribe();
      window.removeEventListener('local_meds_updated', handleLocalUpdate);
      window.removeEventListener('dose_logs_updated', fetchDoseLogs);
    };
  }, [user]);

  const handleRefill = async (e, med) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const total = parseInt(med.totalSupply, 10) || 30;
    
    // Exact, synchronous update of state and localStorage first (optimistic)
    const updatedMeds = medications.map(m => {
      if (m.id === med.id) {
        return {
          ...m,
          remainingSupply: total,
          dosesLeft: total,
          remainingDoses: total
        };
      }
      return m;
    });

    setMedications(updatedMeds);
    const activeUid = user?.uid || 'demo_user';
    safeSetItem(`meds_${activeUid}`, JSON.stringify(updatedMeds));
    window.dispatchEvent(new Event('local_meds_updated'));
    toast.success(`Refilled ${med.name}! Supply reset to ${total} doses.`, { icon: '📦' });

    if (user?.uid) {
      try {
        const medRef = doc(db, `users/${user.uid}/medications`, med.id);
        await updateDoc(medRef, { 
          remainingSupply: total,
          dosesLeft: total,
          remainingDoses: total
        });
      } catch (error) {
        console.warn('Firestore refill background failed:', error);
      }
    }
  };

  const toggleTakenStatus = async (e, med) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const updatedTaken = !med.taken;
    const total = parseInt(med.totalSupply, 10) || 30;
    const currentSupply = med.remainingSupply !== undefined ? parseInt(med.remainingSupply, 10) : total;
    const threshold = parseInt(med.lowSupplyThreshold, 10) || 5;

    let newSupply = currentSupply;
    if (updatedTaken) {
      newSupply = Math.max(0, currentSupply - 1);
    } else {
      newSupply = currentSupply + 1;
    }

    // Exact, synchronous update of state and localStorage first (optimistic)
    const updatedMeds = medications.map(m => {
      if (m.id === med.id) {
        return {
          ...m,
          taken: updatedTaken,
          remainingSupply: newSupply,
          dosesLeft: newSupply,
          remainingDoses: newSupply
        };
      }
      return m;
    });

    try {
      setMedications(updatedMeds);
      const activeUid = user?.uid || 'demo_user';
      localStorage.setItem('medications', JSON.stringify(updatedMeds));
      safeSetItem(`meds_${activeUid}`, JSON.stringify(updatedMeds));
      window.dispatchEvent(new Event('local_meds_updated'));
      toast.success(`Marked as ${updatedTaken ? 'taken' : 'pending'}`);
    } catch (err) {
      console.warn('Local state update failed:', err);
    }

    // Update in Firestore in background
    if (user?.uid) {
      try {
        const medRef = doc(db, `users/${user.uid}/medications`, med.id);
        await updateDoc(medRef, { 
          taken: updatedTaken,
          remainingSupply: newSupply,
          dosesLeft: newSupply,
          remainingDoses: newSupply
        });
      } catch (error) {
        console.warn('Firestore update background failed:', error);
      }
    }

    // Check low supply threshold alert when taking a dose
    if (updatedTaken && newSupply <= threshold) {
      scheduleLocalNotification(`⚠️ Low Supply Alert: ${med.name}`, {
        body: `Only ${newSupply} dose${newSupply === 1 ? '' : 's'} remaining of ${med.name} (${med.dosage}). Please order a refill soon!`,
        tag: `low_supply_${med.id}`
      });
      toast.error(`⚠️ Low Supply Alert: ${med.name} has only ${newSupply} doses left!`, { duration: 6000 });
    }

    // Automatically log dose history record and force append to dose_logs
    if (updatedTaken) {
      const activeUid = user?.uid || 'demo_user';
      const newLog = {
        id: `log_${Date.now()}_${med.id}`,
        medId: med.id,
        medName: med.name,
        dosage: med.dosage,
        type: med.type,
        category: med.category || 'Daily',
        scheduledTime: Array.isArray(med.reminderTime) ? med.reminderTime.join(', ') : (med.reminderTime || 'Now'),
        status: 'taken',
        notes: 'Logged via Dashboard',
        dateStr: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString()
      };
      
      // Append completion timestamp to dose_logs in localStorage so it remains checked
      try {
        const existingRaw = localStorage.getItem('dose_logs') || safeGetItem(`dose_logs_${activeUid}`, '[]');
        const existingLogs = JSON.parse(existingRaw);
        const updatedLogs = [newLog, ...existingLogs];
        localStorage.setItem('dose_logs', JSON.stringify(updatedLogs));
        safeSetItem(`dose_logs_${activeUid}`, JSON.stringify(updatedLogs));
        setDoseLogs(updatedLogs);
        window.dispatchEvent(new Event('dose_logs_updated'));
      } catch (e) {
        console.warn('Failed to append dose_logs to localStorage:', e);
      }

      logDoseEvent(activeUid, newLog).catch(() => {});
    }


  const { totalMeds, takenMeds, pendingMeds, adherence, typeChartData, weeklyData, currentStreak, longestStreak } = calculateAdherenceStats(medications, doseLogs);
  const nextReminder = calculateNextReminder(medications);

  const lowSupplyMeds = medications.filter(m => {
    const total = parseInt(m.totalSupply, 10) || 30;
    const remaining = m.remainingSupply !== undefined ? parseInt(m.remainingSupply, 10) : total;
    const threshold = parseInt(m.lowSupplyThreshold, 10) || 5;
    return remaining <= threshold;
  });

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

      {/* Low Supply Alert Banner */}
      {lowSupplyMeds.length > 0 && (
        <Card className="border border-amber-500/40 bg-gradient-to-r from-amber-500/15 via-orange-500/10 to-transparent p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="p-3 rounded-2xl bg-amber-500/20 text-amber-500 dark:text-amber-400 shrink-0">
                <AlertTriangle size={24} className="animate-bounce" />
              </div>
              <div>
                <h4 className="font-extrabold text-base text-slate-900 dark:text-white flex items-center gap-2 flex-wrap">
                  <span>Low Supply Alert</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-extrabold border border-amber-500/30">
                    {lowSupplyMeds.length} Medication{lowSupplyMeds.length > 1 ? 's' : ''} Need Refill
                  </span>
                </h4>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {(Array.isArray(lowSupplyMeds) ? lowSupplyMeds : []).map(m => {
                    const rem = m.remainingSupply !== undefined ? parseInt(m.remainingSupply, 10) : (parseInt(m.totalSupply, 10) || 30);
                    return (
                      <span key={m.id} className="text-xs font-medium text-amber-900 dark:text-amber-200 bg-amber-500/15 px-2.5 py-1 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                        <span>{m.name}:</span>
                        <strong className="text-amber-700 dark:text-amber-300 font-bold">{rem} dose{rem === 1 ? '' : 's'} remaining</strong>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto flex-wrap">
              {(Array.isArray(lowSupplyMeds) ? lowSupplyMeds : []).map(m => (
                <Button
                  key={m.id}
                  onClick={(e) => handleRefill(e, m)}
                  size="sm"
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs shadow-sm flex items-center gap-1"
                >
                  <RefreshCw size={12} /> Refill {m.name}
                </Button>
              ))}
            </div>
          </div>
        </Card>
      )}

      {/* Next Reminder Highlight */}
      {nextReminder && (
        <Card className={`relative overflow-hidden border ${nextReminder.isMissed ? 'border-red-500/50 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent' : 'border-teal-500/50 bg-gradient-to-r from-teal-500/15 via-emerald-500/10 to-transparent'}`}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`p-3.5 rounded-2xl ${nextReminder.isMissed ? 'bg-red-500/20 text-red-400' : 'bg-teal-500/20 text-teal-400'} shadow-inner`}>
                <BellRing size={26} className={!nextReminder.isMissed ? 'animate-bounce' : ''} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className={`text-[11px] font-extrabold uppercase tracking-widest px-2.5 py-0.5 rounded-full ${nextReminder.isMissed ? 'bg-red-500/20 text-red-400' : 'bg-teal-500/20 text-teal-300'}`}>
                    {nextReminder.isMissed ? 'Missed Dose' : 'Next Dose Reminder'}
                  </span>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">{nextReminder.time}</span>
                </div>
                <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">
                  {nextReminder.medication.name} <span className="text-sm font-semibold text-slate-500 dark:text-teal-300/80">({nextReminder.medication.dosage})</span>
                </p>
              </div>
            </div>
            <Button onClick={(e) => toggleTakenStatus(e, nextReminder.medication)} className="bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold border-none shadow-md">
              Mark as Taken
            </Button>
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Adherence Rate', value: `${adherence}%`, icon: Activity, bg: 'from-teal-500/10 to-emerald-500/5', color: 'text-teal-500 dark:text-teal-400' },
          { label: 'Doses Taken', value: takenMeds, icon: CheckCircle2, bg: 'from-emerald-500/10 to-teal-500/5', color: 'text-emerald-500 dark:text-emerald-400' },
          { label: 'Active Streak', value: `${currentStreak} Days`, icon: Flame, bg: 'from-amber-500/10 to-orange-500/5', color: 'text-amber-500 dark:text-amber-400' },
          { label: 'Best Record', value: `${longestStreak} Days`, icon: Trophy, bg: 'from-purple-500/10 to-indigo-500/5', color: 'text-purple-500 dark:text-purple-400' }
        ].map((stat, i) => (
          <Card key={i} className={`flex flex-col items-center justify-center p-5 text-center bg-gradient-to-br ${stat.bg} relative group hover:scale-[1.02] transition-transform`}>
            <div className={`p-3 rounded-xl bg-white dark:bg-slate-800 shadow-sm ${stat.color} mb-3`}>
              <stat.icon size={24} />
            </div>
            <h4 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">{stat.value}</h4>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 uppercase tracking-wider font-bold mt-1">{stat.label}</span>
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
                  {(Array.isArray(typeChartData) ? typeChartData : []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4 mt-2">
            {(Array.isArray(typeChartData) ? typeChartData : []).map((entry, index) => (
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white shrink-0">Today's Schedule</h3>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <Input 
              placeholder="Search medications..." 
              icon={Search} 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              className="w-full sm:w-60"
            />
            <select 
              className="rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all"
              value={filterType} 
              onChange={(e) => setFilterType(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="taken">Taken</option>
            </select>
          </div>
        </div>

        {filteredMeds.length === 0 ? (
          <EmptyState icon={Pill} title="No medications found" description="Nothing matches your current search or filter." />
        ) : (
          <div className="space-y-3">
            <AnimatePresence mode="popLayout">
              {(Array.isArray(filteredMeds) ? filteredMeds : []).map((med) => (
                <motion.div 
                  key={med.id}
                  layout
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.96 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/80 dark:bg-slate-800/40 hover:bg-white dark:hover:bg-slate-800/80 transition-colors shadow-xs"
                >
                  <div className="flex items-center gap-3 sm:gap-4">
                    <button onClick={(e) => toggleTakenStatus(e, med)} className="shrink-0 transition-transform active:scale-90">
                      {med.taken ? <CheckCircle2 size={26} className="text-emerald-500 fill-emerald-500/20" /> : <Circle size={26} className="text-slate-400 hover:text-teal-500" />}
                    </button>
                    <div className="min-w-0 flex-1">
                      <h4 className={`font-bold text-sm sm:text-base text-slate-900 dark:text-white flex items-center gap-2 flex-wrap ${med.taken ? 'line-through text-slate-400 dark:text-slate-500' : ''}`}>
                        <span>{med.name}</span>
                        <span className="font-medium text-slate-500 dark:text-slate-400 text-xs sm:text-sm">({med.dosage})</span>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                          {med.category || 'Daily'}
                        </span>
                      </h4>
                      <div className="flex items-center gap-3 flex-wrap text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Calendar size={12} className="shrink-0" />
                          <span>{Array.isArray(med.reminderTime) ? med.reminderTime.join(', ') : (med.reminderTime || 'Anytime')}</span>
                          {med.mealTiming && med.mealTiming !== 'none' && (
                            <span>• {med.mealTiming.replace('_', ' ')}</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 ml-2">
                    <span className={`text-[10px] sm:text-xs font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${med.taken ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400'}`}>
                      {med.taken ? 'Done' : 'Pending'}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
