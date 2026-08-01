import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, User, X, Clock, Info, Check, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';

const DEFAULT_SYSTEM_ALERTS = [
  {
    id: 'sys-update-v1',
    title: 'MediRemind updated to v1.0.0',
    description: 'Enjoy our brand new dashboard, local storage sync, and dynamic medication progress tracking.',
    time: 'System update',
    type: 'system'
  },
  {
    id: 'sys-sync',
    title: 'Offline storage synced',
    description: 'Your medication lists and logged dose histories are automatically synchronised with local storage backup.',
    time: 'Always synced',
    type: 'system'
  }
];

export default function TopAppBar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [overdueMeds, setOverdueMeds] = useState([]);
  const dropdownRef = useRef(null);

  const activeUid = user?.uid || 'demo_user';

  const [readIds, setReadIds] = useState(() => {
    try {
      const saved = localStorage.getItem(`read_notification_ids_${activeUid}`);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  // Keep readIds synced with active user
  useEffect(() => {
    try {
      const saved = localStorage.getItem(`read_notification_ids_${activeUid}`);
      setReadIds(saved ? JSON.parse(saved) : []);
    } catch (e) {
      setReadIds([]);
    }
  }, [activeUid]);

  // Save readIds when changed
  useEffect(() => {
    localStorage.setItem(`read_notification_ids_${activeUid}`, JSON.stringify(readIds));
  }, [readIds, activeUid]);

  const fetchNotifications = () => {
    const medsRaw = localStorage.getItem(`meds_${activeUid}`);
    let meds = [];
    if (medsRaw) {
      try {
        meds = JSON.parse(medsRaw);
      } catch (e) {
        console.error('Failed to parse meds', e);
      }
    }

    const overdue = [];
    const now = new Date();
    if (Array.isArray(meds)) {
      meds.forEach(med => {
        if (med.taken) return; // already taken today
        const times = Array.isArray(med.reminderTime) 
          ? med.reminderTime 
          : [med.reminderTime].filter(Boolean);
        
        times.forEach(timeStr => {
          try {
            const [hours, minutes] = timeStr.split(':').map(Number);
            const reminderTimeToday = new Date();
            reminderTimeToday.setHours(hours, minutes, 0, 0);
            
            if (reminderTimeToday < now) {
              overdue.push({
                id: `overdue-${med.id}-${timeStr}`,
                medId: med.id,
                name: med.name,
                dosage: med.dosage || '',
                time: timeStr,
                type: 'overdue'
              });
            }
          } catch (e) {
            console.warn('Invalid time format:', timeStr);
          }
        });
      });
    }

    setOverdueMeds(overdue);
  };

  useEffect(() => {
    fetchNotifications();

    window.addEventListener('local_meds_updated', fetchNotifications);
    return () => {
      window.removeEventListener('local_meds_updated', fetchNotifications);
    };
  }, [activeUid]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const unreadOverdue = overdueMeds.filter(item => !readIds.includes(item.id));
  const unreadSystem = DEFAULT_SYSTEM_ALERTS.filter(item => !readIds.includes(item.id));
  const unreadCount = unreadOverdue.length + unreadSystem.length;

  const handleMarkAllRead = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const allIds = [
      ...overdueMeds.map(item => item.id),
      ...DEFAULT_SYSTEM_ALERTS.map(item => item.id)
    ];
    setReadIds(allIds);
  };

  const handleNotificationClick = (e, item) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    // Mark as read
    if (!readIds.includes(item.id)) {
      setReadIds(prev => [...prev, item.id]);
    }

    setIsOpen(false);

    // If it's a medication overdue alert, jump directly to medication search on Dashboard
    if (item.type === 'overdue') {
      navigate(`/dashboard?search=${encodeURIComponent(item.name)}`);
    }
  };

  return (
    <header className="h-14 sm:h-16 md:h-20 bg-white/80 dark:bg-slate-950/80 backdrop-blur-xl border-b border-slate-200/80 dark:border-slate-800/80 sticky top-0 z-40 flex items-center justify-between px-3 sm:px-6 md:px-8 text-slate-800 dark:text-white transition-colors">
      <div className="md:hidden shrink-0 pr-2">
        <Logo size="sm" showText={true} />
      </div>
      <div className="hidden md:flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-emerald-500 dark:bg-emerald-400 animate-pulse"></span>
        <span className="text-xs font-semibold uppercase tracking-wider text-teal-700 dark:text-teal-300/80">Health Portal Live</span>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        <ThemeToggle />
        
        {/* Notification Bell with Dropdown Container */}
        <div className="relative" ref={dropdownRef}>
          <button 
            onClick={(e) => { e.preventDefault(); setIsOpen(!isOpen); }}
            className="relative p-1.5 sm:p-2 rounded-xl text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5 transition-colors focus:outline-none"
            aria-label="Notification Center"
          >
            <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white font-black text-[9px] rounded-full flex items-center justify-center border-2 border-white dark:border-slate-950 shadow-sm animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Premium Dropdown Overlay */}
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2.5 w-80 sm:w-96 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl shadow-slate-200/50 dark:shadow-slate-950/50 overflow-hidden z-50 text-slate-800 dark:text-slate-100"
              >
                {/* Dropdown Header */}
                <div className="p-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm tracking-tight text-slate-900 dark:text-white">Notifications</span>
                    {unreadCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 font-bold text-[10px]">
                        {unreadCount} new
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {unreadCount > 0 && (
                      <button 
                        onClick={handleMarkAllRead}
                        className="text-[11px] font-bold text-teal-600 dark:text-teal-400 hover:underline hover:text-teal-700 dark:hover:text-teal-300 transition-colors"
                      >
                        Mark all read
                      </button>
                    )}
                    <button 
                      onClick={() => setIsOpen(false)}
                      className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    >
                      <X size={14} />
                    </button>
                  </div>
                </div>

                {/* Dropdown Scrollable Body */}
                <div className="max-h-[360px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80">
                  
                  {/* Category: Overdue / Missed Doses */}
                  {overdueMeds.length > 0 && (
                    <div className="bg-rose-50/20 dark:bg-rose-950/5">
                      <div className="px-4 py-2 bg-rose-50/40 dark:bg-rose-950/10 text-[10px] font-bold uppercase tracking-wider text-rose-600 dark:text-rose-400 border-b border-slate-100 dark:border-slate-800/80">
                        Overdue / Missed Doses
                      </div>
                      {overdueMeds.map((item) => {
                        const isUnread = !readIds.includes(item.id);
                        return (
                          <div
                            key={item.id}
                            onClick={(e) => handleNotificationClick(e, item)}
                            className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-all ${
                              isUnread ? 'bg-amber-500/[0.04] dark:bg-amber-400/[0.02]' : ''
                            }`}
                          >
                            <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400 shrink-0 h-9 w-9 flex items-center justify-center">
                              <Clock size={18} className="animate-pulse" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-start justify-between gap-2">
                                <h4 className={`text-xs font-bold leading-tight ${isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                  {item.name} {item.dosage && <span className="font-normal opacity-85">({item.dosage})</span>}
                                </h4>
                                {isUnread && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1"></span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-snug">
                                Scheduled for <span className="font-semibold text-rose-600 dark:text-rose-400">{item.time}</span> today but not logged yet.
                              </p>
                              <span className="text-[9px] font-semibold text-teal-600 dark:text-teal-400 hover:underline mt-1.5 inline-block">
                                Click to resolve &rarr;
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Category: App Updates & Status */}
                  <div>
                    <div className="px-4 py-2 bg-slate-50/50 dark:bg-slate-900/20 text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800/80">
                      App Updates & Status
                    </div>
                    {DEFAULT_SYSTEM_ALERTS.map((item) => {
                      const isUnread = !readIds.includes(item.id);
                      return (
                        <div
                          key={item.id}
                          onClick={(e) => handleNotificationClick(e, item)}
                          className={`p-4 flex gap-3 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors ${
                            isUnread ? 'bg-teal-500/[0.02] dark:bg-teal-400/[0.01]' : ''
                          }`}
                        >
                          <div className="p-2 rounded-xl bg-teal-50 dark:bg-teal-950/30 text-teal-600 dark:text-teal-400 shrink-0 h-9 w-9 flex items-center justify-center">
                            <Info size={18} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <h4 className={`text-xs font-bold leading-tight ${isUnread ? 'text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}>
                                {item.title}
                              </h4>
                              {isUnread && (
                                <span className="w-1.5 h-1.5 rounded-full bg-teal-500 shrink-0 mt-1"></span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                              {item.description}
                            </p>
                            <span className="text-[9px] font-medium text-slate-400 mt-1.5 inline-block">
                              {item.time}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {overdueMeds.length === 0 && DEFAULT_SYSTEM_ALERTS.length === 0 && (
                    <div className="p-8 text-center flex flex-col items-center justify-center">
                      <CheckCircle2 size={32} className="text-teal-500 mb-2" />
                      <p className="font-bold text-xs text-slate-700 dark:text-slate-300">All caught up!</p>
                      <p className="text-[10px] text-slate-400 mt-1">No pending notifications or overdue doses today.</p>
                    </div>
                  )}

                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 pl-1.5 sm:pl-3 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-teal-500 to-cyan-500 p-0.5 flex items-center justify-center overflow-hidden shadow-md shrink-0">
            <div className="w-full h-full rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center text-teal-700 dark:text-teal-300 font-bold overflow-hidden text-xs sm:text-sm">
              {user?.photoURL ? (
                <img src={user.photoURL} alt={user.name} className="w-full h-full object-cover" />
              ) : (
                user?.name?.charAt(0).toUpperCase() || <User size={14} />
              )}
            </div>
          </div>
          <div className="hidden sm:flex flex-col">
            <span className="text-xs font-semibold text-slate-900 dark:text-white leading-tight">
              {user?.name || 'Patient'}
            </span>
            <span className="text-[10px] font-medium text-teal-700 dark:text-teal-300/80">
              {user?.email || 'Active Session'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
