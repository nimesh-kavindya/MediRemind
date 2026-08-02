import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Suspense, lazy, useState } from 'react';
import PublicLayout from './layouts/PublicLayout';
import ProtectedLayout from './layouts/ProtectedLayout';
import { Toaster } from 'react-hot-toast';
import Loader from './components/Loader';
import ErrorBoundary from './components/ErrorBoundary';
import { NotificationProvider } from './context/NotificationContext';

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
  const handleClearAllData = () => {
    localStorage.clear();
    localStorage.removeItem('medications');
    localStorage.removeItem('dose_logs');
    localStorage.removeItem('medi_counts_backup');
    localStorage.removeItem('calendar_events');
    localStorage.removeItem('medication_calendar');
    localStorage.removeItem('calendar_data');
    setMedications([]);
    setLogs([]);
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

