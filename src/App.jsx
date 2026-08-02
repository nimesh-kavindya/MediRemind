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
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  const [logs, setLogs] = useState(() => {
    try {
      const saved = localStorage.getItem('dose_logs');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
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
                <Route path="/dashboard" element={<Dashboard medications={medications} setMedications={setMedications} doseLogs={logs} setDoseLogs={setLogs} />} />
                <Route path="/add-medication" element={<AddMedication medications={medications} setMedications={setMedications} setLogs={setLogs} />} />
                <Route path="/scanner" element={<Scanner />} />
                <Route path="/calendar" element={<Calendar />} />
                <Route path="/history" element={<MedicationHistory logs={logs} setLogs={setLogs} />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/health-tips" element={<HealthTips />} />
                <Route path="/settings" element={<Settings />} />
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

