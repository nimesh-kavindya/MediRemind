import { Suspense, useEffect } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from '../components/Sidebar';
import BottomNavigation from '../components/BottomNavigation';
import TopAppBar from '../components/TopAppBar';
import SplashScreen from '../components/SplashScreen';
import Loader from '../components/Loader';
import { calculateAdherenceStats } from '../services/analyticsService';
import { safeGetItem, safeSetItem } from '../utils';

export default function ProtectedLayout() {
  const { user, isAuthenticated, loading } = useAuth();

  if (loading) {
    return <SplashScreen subtitle="Opening your health portal..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  // Global Sync for Aggregate Counts
  useEffect(() => {
    if (!user?.uid) return;

    const syncMetrics = () => {
      try {
        const medsRaw = localStorage.getItem('medications') || safeGetItem(`meds_${user.uid}`, '[]');
        const logsRaw = localStorage.getItem('dose_logs') || safeGetItem(`dose_logs_${user.uid}`, '[]');
        
        const meds = JSON.parse(medsRaw);
        const logs = JSON.parse(logsRaw);

        const stats = calculateAdherenceStats(
          Array.isArray(meds) ? meds : [], 
          Array.isArray(logs) ? logs : []
        );

        const backupData = {
          totalMedications: stats.totalMeds,
          dosesCompleted: stats.takenMeds,
          dosesMissed: stats.pendingMeds, // or calculate differently if needed
          activeStreak: stats.currentStreak,
          adherence: stats.adherence,
          lastUpdated: new Date().toISOString()
        };

        localStorage.setItem('medi_counts_backup', JSON.stringify(backupData));
      } catch (err) {
        console.warn('Failed to sync aggregate counts:', err);
      }
    };

    // Run initially
    syncMetrics();

    window.addEventListener('local_meds_updated', syncMetrics);
    window.addEventListener('dose_logs_updated', syncMetrics);

    return () => {
      window.removeEventListener('local_meds_updated', syncMetrics);
      window.removeEventListener('dose_logs_updated', syncMetrics);
    };
  }, [user]);

  return (
    <div className="flex h-screen bg-slate-100/90 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar />
      </div>

      <div className="flex flex-col flex-1 w-full relative">
        <TopAppBar />
        
        <main className="flex-1 overflow-y-auto p-4 md:p-8 pb-36 md:pb-8">
          <div className="max-w-7xl mx-auto h-full">
            <Suspense fallback={
              <div className="flex flex-col items-center justify-center h-64 space-y-3">
                <Loader size="lg" className="text-teal-500" />
                <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Loading page...</p>
              </div>
            }>
              <Outlet />
            </Suspense>
          </div>
        </main>

        {/* Mobile Bottom Navigation */}
        <div className="md:hidden">
          <BottomNavigation />
        </div>
      </div>
    </div>
  );
}
