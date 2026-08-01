import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ThemeToggle from '../components/ThemeToggle';
import SplashScreen from '../components/SplashScreen';

export default function PublicLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return <SplashScreen subtitle="Connecting to MediRemind..." />;
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen relative flex flex-col justify-center items-center overflow-hidden bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 selection:bg-teal-500 selection:text-white transition-colors duration-300">
      {/* Liquid Ambient Glowing Background Blobs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-gradient-to-tr from-teal-400/20 to-cyan-400/20 dark:from-teal-500/30 dark:to-cyan-500/20 rounded-full blur-[100px] animate-pulse pointer-events-none" />
      <div className="absolute top-1/2 -right-32 w-[30rem] h-[30rem] bg-gradient-to-br from-emerald-400/15 via-teal-400/15 to-blue-400/15 dark:from-emerald-500/20 dark:via-teal-600/20 dark:to-blue-600/20 rounded-full blur-[130px] animate-pulse pointer-events-none delay-1000" />
      <div className="absolute -bottom-32 left-1/4 w-96 h-96 bg-gradient-to-tr from-cyan-400/15 to-teal-300/15 dark:from-cyan-600/20 dark:to-teal-400/20 rounded-full blur-[120px] pointer-events-none" />

      {/* Glass Top Bar Controls */}
      <div className="absolute top-5 right-5 z-20">
        <div className="p-1 rounded-full bg-white/80 dark:bg-white/10 backdrop-blur-md border border-slate-200 dark:border-white/20 shadow-md">
          <ThemeToggle />
        </div>
      </div>

      <main className="w-full flex-1 flex items-center justify-center p-4 sm:p-6 z-10 my-6">
        <Outlet />
      </main>
    </div>
  );
}

