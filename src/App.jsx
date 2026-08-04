import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useState, useEffect } from 'react';
import PublicLayout from './layouts/PublicLayout';
import ProtectedLayout from './layouts/ProtectedLayout';
import { Toaster } from 'react-hot-toast';
import Loader from './components/Loader';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './context/NotificationContext';
import { ref, set, get } from 'firebase/database';
import { db as realtimeDb } from './firebase';

import SplashScreen from './components/SplashScreen';
import UpdateNotification from './components/UpdateNotification';

const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const Dashboard = lazy(() => import('./pages/Dashboard'));
const AddMedication = lazy(() => import('./pages/AddMedication'));
const Scanner = lazy(() => import('./pages/Scanner'));
const Calendar = lazy(() => import('./pages/Calendar'));
const Profile = lazy(() => import('./pages/Profile'));
const HealthTips = lazy(() => import('./pages/HealthTips'));
const Settings = lazy(() => import('./pages/Settings'));
const MedicationHistory = lazy(() => import('./pages/MedicationHistory'));
const NotFound = lazy(() => import('./pages/NotFound'));
function App() {
  const [medications, setMedications] = useState(() => {
    try {
      const saved = localStorage.getItem('medications');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter(m => m && typeof m === 'object' && m.id) : [];
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('dose_logs');
      if (saved !== null) {
        const parsed = JSON.parse(saved);
        return Array.isArray(parsed) ? parsed.filter(l => l && typeof l === 'object' && (l.id || l.medicationId || l.medId)) : [];
      }
      return [];
    } catch (e) {
      return [];
    }
  });

  // 1. Boot & Midnight Reset & Cloud Restore Handler
  useEffect(() => {
    const handleBootAndReset = async () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const lastActiveDate = localStorage.getItem('last_active_date');

      if (lastActiveDate && lastActiveDate !== todayStr) {
        // STEP A: Clear local medications array and today's schedule on midnight reset
        setMedications([]);
        localStorage.setItem('medications', JSON.stringify([]));
        localStorage.setItem('last_active_date', todayStr);

        // STEP B & C: Explicitly wipe active medications path in Firebase RTDB while preserving dose_logs
        try {
          if (realtimeDb) {
            const logsRaw = localStorage.getItem('dose_logs');
            const currentLogs = logsRaw ? JSON.parse(logsRaw) : [];
            await set(ref(realtimeDb, 'user_app_data'), {
              medications: [],
              dose_logs: Array.isArray(currentLogs) ? currentLogs : [],
              lastActiveDate: todayStr,
              lastSynced: new Date().toISOString()
            });
          }
        } catch (e) {
          console.warn('Realtime DB midnight reset purge warning:', e);
        }

        window.dispatchEvent(new Event('local_meds_updated'));
      } else {
        if (!lastActiveDate) {
          localStorage.setItem('last_active_date', todayStr);
        }

        // STEP D: Prevent resurrection - restore from cloud ONLY if local is empty and cloud is on todayStr
        try {
          const localMeds = localStorage.getItem('medications');
          const localLogs = localStorage.getItem('dose_logs');
          
          const isMedsEmpty = !localMeds || JSON.parse(localMeds).length === 0;
          const isLogsEmpty = !localLogs || JSON.parse(localLogs).length === 0;

          if ((isMedsEmpty || isLogsEmpty) && realtimeDb) {
            const appDataRef = ref(realtimeDb, 'user_app_data');
            const snapshot = await get(appDataRef);
            if (snapshot.exists()) {
              const data = snapshot.val();
              if (isMedsEmpty && data?.lastActiveDate === todayStr && data?.medications && Array.isArray(data.medications)) {
                localStorage.setItem('medications', JSON.stringify(data.medications));
                setMedications(data.medications);
              }
              if (isLogsEmpty && data?.dose_logs && Array.isArray(data.dose_logs) && data.dose_logs.length > 0) {
                localStorage.setItem('dose_logs', JSON.stringify(data.dose_logs));
                setLogs(data.dose_logs);
              }
              window.dispatchEvent(new Event('local_meds_updated'));
              window.dispatchEvent(new Event('dose_logs_updated'));
              window.dispatchEvent(new Event('calendar_updated'));
            }
          }
        } catch (err) {
          console.warn('Realtime Database restore failed:', err);
        }
      }
    };

    handleBootAndReset();
  }, []);

  // 3. Background Cloud Sync on State / LocalStorage Changes
  useEffect(() => {
    const syncToRealtimeDb = async () => {
      try {
        if (!realtimeDb) return;
        const medsRaw = localStorage.getItem('medications');
        const logsRaw = localStorage.getItem('dose_logs');
        const currentMeds = medsRaw ? JSON.parse(medsRaw) : medications;
        const currentLogs = logsRaw ? JSON.parse(logsRaw) : logs;

        if ((!currentMeds || currentMeds.length === 0) && (!currentLogs || currentLogs.length === 0)) {
          return;
        }

        const appDataRef = ref(realtimeDb, 'user_app_data');
        await set(appDataRef, {
          medications: Array.isArray(currentMeds) ? currentMeds : [],
          dose_logs: Array.isArray(currentLogs) ? currentLogs : [],
          lastActiveDate: new Date().toISOString().split('T')[0],
          lastSynced: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Realtime Database background sync warning:', err);
      }
    };

    const handleSync = () => {
      syncToRealtimeDb();
    };

    window.addEventListener('local_meds_updated', handleSync);
    window.addEventListener('dose_logs_updated', handleSync);

    if (medications.length > 0 || logs.length > 0) {
      syncToRealtimeDb();
    }

    return () => {
      window.removeEventListener('local_meds_updated', handleSync);
      window.removeEventListener('dose_logs_updated', handleSync);
    };
  }, [medications, logs]);

  // Centralized Master Deletion Handler
  const handleDeleteMedication = (id) => {
    const targetMed = medications.find(m => m.id === id);
    const targetName = targetMed?.name?.trim().toLowerCase();

    setMedications(prevMeds => {
      const updated = prevMeds.filter(m => m.id !== id);
      localStorage.setItem('medications', JSON.stringify(updated));
      return updated;
    });

    setLogs(prevLogs => {
      const updatedLogs = prevLogs.filter(l => {
        if (!l) return false;
        const matchesId = l.medicationId === id || l.medId === id;
        const matchesName = targetName && (
          l.medicationName?.trim().toLowerCase() === targetName || 
          l.medName?.trim().toLowerCase() === targetName
        );
        return !matchesId && !matchesName;
      });
      localStorage.setItem('dose_logs', JSON.stringify(updatedLogs));
      return updatedLogs;
    });

    localStorage.removeItem('medi_counts_backup');
    window.dispatchEvent(new Event('local_meds_updated'));
    window.dispatchEvent(new Event('dose_logs_updated'));
  };

  // Centralized Hard Reset / Clear All Data
  const handleClearAllData = async () => {
    localStorage.clear();
    localStorage.removeItem('medications');
    localStorage.removeItem('dose_logs');
    localStorage.removeItem('medi_counts_backup');
    localStorage.removeItem('calendar_events');
    localStorage.removeItem('medication_calendar');
    localStorage.removeItem('calendar_data');
    setMedications([]);
    setLogs([]);
    try {
      if (realtimeDb) {
        await set(ref(realtimeDb, 'user_app_data'), null);
      }
    } catch (e) {
      console.warn('Realtime DB clear warning:', e);
    }
    window.dispatchEvent(new Event('local_meds_updated'));
    window.dispatchEvent(new Event('dose_logs_updated'));
    window.dispatchEvent(new Event('calendar_updated'));
    window.location.reload();
  };
  return (
    <ErrorBoundary>
      <NotificationProvider>
        <Router>
          <Toaster position="top-right" />
          <UpdateNotification />
          <Suspense fallback={<SplashScreen subtitle="Loading MediRemind..." />}>
            <Routes>
              {/* Public Routes */}
              <Route element={<PublicLayout />}>
                <Route path="/" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>

              {/* Protected Routes */}
              <Route element={<ProtectedLayout />}>
                <Route path="/dashboard" element={<Dashboard medications={medications} setMedications={setMedications} doseLogs={logs} setDoseLogs={setLogs} onDeleteMedication={handleDeleteMedication} />} />
                <Route path="/add-medication" element={<AddMedication medications={medications} setMedications={setMedications} setLogs={setLogs} onDeleteMedication={handleDeleteMedication} />} />
                <Route path="/scanner" element={<Scanner />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/history" element={<MedicationHistory logs={logs} setLogs={setLogs} />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/health-tips" element={<HealthTips />} />
                <Route path="/settings" element={<Settings onClearAllData={handleClearAllData} />} />
              </Route>

              {/* Catch all */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </Router>
      </NotificationProvider>
    </ErrorBoundary>
  );
}

export default App;

