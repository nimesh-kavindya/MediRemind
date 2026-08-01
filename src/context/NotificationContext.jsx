import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from './AuthContext';
import { 
  getNotificationPermissionStatus, 
  requestNotificationPermission, 
  scheduleLocalNotification, 
  playNotificationSound 
} from '../services/notificationService';
import { collection, query, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import ReminderAlertOverlay from '../components/ReminderAlertOverlay';

const NotificationContext = createContext();

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth();
  const [permission, setPermission] = useState(getNotificationPermissionStatus());
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem('med_sound_enabled') !== 'false';
  });
  const [medications, setMedications] = useState([]);
  const [activeAlerts, setActiveAlerts] = useState([]);
  const [snoozedMeds, setSnoozedMeds] = useState({}); // { [medId]: timestampMs }

  const notifiedKeysRef = useRef(new Set());

  // Save sound setting
  useEffect(() => {
    localStorage.setItem('med_sound_enabled', soundEnabled ? 'true' : 'false');
  }, [soundEnabled]);

  // Sync notification permission status
  useEffect(() => {
    setPermission(getNotificationPermissionStatus());
  }, []);

  // Subscribe to user medications
  useEffect(() => {
    const activeUid = user?.uid || 'demo_user';

    let unsubscribe = () => {};

    const loadLocalMeds = () => {
      const saved = JSON.parse(localStorage.getItem(`meds_${activeUid}`) || '[]');
      setMedications(saved);
    };

    loadLocalMeds();

    if (user?.uid) {
      try {
        const q = query(collection(db, `users/${user.uid}/medications`));
        unsubscribe = onSnapshot(q, (snapshot) => {
          const meds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          if (meds.length > 0) {
            setMedications(meds);
            localStorage.setItem(`meds_${user.uid}`, JSON.stringify(meds));
          } else {
            loadLocalMeds();
          }
        }, (err) => {
          console.warn('Firestore fallback to local storage:', err);
          loadLocalMeds();
        });
      } catch (e) {
        loadLocalMeds();
      }
    }

    const handleLocalUpdate = () => loadLocalMeds();
    window.addEventListener('local_meds_updated', handleLocalUpdate);

    return () => {
      unsubscribe();
      window.removeEventListener('local_meds_updated', handleLocalUpdate);
    };
  }, [user]);

  // Request browser permission
  const enableBrowserNotifications = async () => {
    const granted = await requestNotificationPermission();
    const status = getNotificationPermissionStatus();
    setPermission(status);
    if (granted) {
      toast.success('Browser notifications enabled!');
      scheduleLocalNotification('MediRemind Notifications Active', {
        body: 'You will receive reminders when it is time to take your medication.'
      }, soundEnabled);
    } else {
      toast.error('Notification permission denied by browser.');
    }
    return granted;
  };

  // Mark medication taken helper
  const markMedicationTaken = useCallback(async (medId) => {
    if (!user?.uid) return;

    // Remove from active alerts
    setActiveAlerts(prev => prev.filter(a => a.id !== medId));

    try {
      const medRef = doc(db, `users/${user.uid}/medications`, medId);
      await updateDoc(medRef, { taken: true, lastTakenAt: new Date().toISOString() });
    } catch (err) {
      // Local fallback
      const local = JSON.parse(localStorage.getItem(`meds_${user.uid}`) || '[]');
      const updated = local.map(m => m.id === medId ? { ...m, taken: true, lastTakenAt: new Date().toISOString() } : m);
      localStorage.setItem(`meds_${user.uid}`, JSON.stringify(updated));
      setMedications(updated);
    }

    toast.success('Medication marked as taken! Great job keeping up 🎉');
  }, [user]);

  // Snooze medication helper
  const snoozeMedication = useCallback((medId, minutes = 10) => {
    const snoozeUntil = Date.now() + minutes * 60 * 1000;
    setSnoozedMeds(prev => ({ ...prev, [medId]: snoozeUntil }));
    setActiveAlerts(prev => prev.filter(a => a.id !== medId));
    toast(`Reminder snoozed for ${minutes} minutes ⏰`, { icon: '💤' });
  }, []);

  // Dismiss alert
  const dismissAlert = useCallback((medId) => {
    setActiveAlerts(prev => prev.filter(a => a.id !== medId));
  }, []);

  // Send Test Notification
  const sendTestNotification = () => {
    if (soundEnabled) playNotificationSound();
    
    scheduleLocalNotification('💊 Test Medication Reminder', {
      body: 'Take 1 Capsule of Amoxicillin 500mg (After Meal)'
    }, false);

    const testAlert = {
      id: 'test_' + Date.now(),
      name: 'Amoxicillin (Test)',
      dosage: '500mg',
      mealTiming: 'after_meal',
      triggerTime: format(new Date(), 'HH:mm')
    };

    setActiveAlerts(prev => [...prev, testAlert]);
    toast.success('Test reminder dispatched!');
  };

  // Background reminder scheduler loop
  useEffect(() => {
    if (!medications || medications.length === 0) return;

    const checkReminders = () => {
      const now = new Date();
      const currentHHMM = format(now, 'HH:mm');
      const todayStr = format(now, 'yyyy-MM-dd');
      const nowMs = Date.now();

      medications.forEach((med) => {
        // Skip if already taken today
        if (med.taken) return;

        // Skip if snoozed
        if (snoozedMeds[med.id] && snoozedMeds[med.id] > nowMs) return;

        // Get reminder times (supports string '08:00' or arrays)
        const times = Array.isArray(med.reminderTime) ? med.reminderTime : [med.reminderTime].filter(Boolean);

        times.forEach((timeStr) => {
          if (timeStr === currentHHMM) {
            const key = `${todayStr}_${med.id}_${timeStr}`;

            if (!notifiedKeysRef.current.has(key)) {
              notifiedKeysRef.current.add(key);

              // 1. Browser HTML5 Notification
              scheduleLocalNotification(`💊 Time for ${med.name}`, {
                body: `Take ${med.dosage}${med.mealTiming ? ` (${med.mealTiming.replace('_', ' ')})` : ''}`,
                tag: med.id,
                requireInteraction: true
              }, soundEnabled);

              // 2. Add to active floating overlay alerts
              setActiveAlerts(prev => {
                if (prev.some(a => a.id === med.id)) return prev;
                return [...prev, { ...med, triggerTime: timeStr }];
              });
            }
          }
        });
      });
    };

    // Run check immediately on load/update
    checkReminders();

    // Run check every 10 seconds
    const timerId = setInterval(checkReminders, 10000);

    return () => clearInterval(timerId);
  }, [medications, snoozedMeds, soundEnabled]);

  return (
    <NotificationContext.Provider
      value={{
        permission,
        soundEnabled,
        setSoundEnabled,
        activeAlerts,
        enableBrowserNotifications,
        sendTestNotification,
        markMedicationTaken,
        snoozeMedication,
        dismissAlert
      }}
    >
      {children}
      <ReminderAlertOverlay
        alerts={activeAlerts}
        onMarkTaken={markMedicationTaken}
        onSnooze={snoozeMedication}
        onDismiss={dismissAlert}
      />
    </NotificationContext.Provider>
  );
};
