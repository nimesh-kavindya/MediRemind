import { motion } from 'framer-motion';
import { HeartPulse, ShieldCheck, Sparkles } from 'lucide-react';

export default function SplashScreen({ subtitle = "Initializing MediRemind..." }) {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white overflow-hidden select-none transition-colors duration-300">
      {/* Background Liquid Glass Glow Blobs */}
      <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-teal-400/20 dark:bg-teal-500/20 rounded-full blur-[120px] animate-pulse pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/3 w-96 h-96 bg-cyan-400/20 dark:bg-cyan-500/20 rounded-full blur-[120px] animate-pulse pointer-events-none delay-1000" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-400/10 dark:bg-emerald-500/10 rounded-full blur-[140px] pointer-events-none" />

      {/* Main Glass Card Content */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex flex-col items-center p-6 sm:p-10 max-w-[300px] sm:max-w-sm w-full mx-4 rounded-3xl bg-white/80 dark:bg-slate-900/80 border border-slate-200/80 dark:border-white/15 backdrop-blur-2xl shadow-2xl dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.7)] text-center"
      >
        {/* Animated Branded Logo Icon */}
        <div className="relative mb-4 sm:mb-6">
          <div className="absolute -inset-3 rounded-2xl bg-gradient-to-r from-teal-400 to-cyan-500 opacity-40 blur-xl animate-pulse" />
          <motion.div 
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
            className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-gradient-to-tr from-teal-500 via-emerald-500 to-cyan-400 p-0.5 shadow-2xl flex items-center justify-center"
          >
            <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-950/90 backdrop-blur-md flex items-center justify-center text-teal-600 dark:text-teal-400">
              <HeartPulse className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
            </div>
          </motion.div>
        </div>

        {/* Brand Name */}
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-600 via-emerald-600 to-cyan-600 dark:from-white dark:via-teal-100 dark:to-teal-300 bg-clip-text text-transparent mb-1.5 sm:mb-2">
          MediRemind
        </h1>

        {/* Tagline / Inspiring Words */}
        <p className="text-xs sm:text-sm font-medium text-slate-600 dark:text-teal-200/80 mb-4 sm:mb-6 max-w-xs leading-relaxed">
          Your Smart Personal Health & Medication Companion
        </p>

        {/* Pill Tag Chips */}
        <div className="flex flex-wrap justify-center items-center gap-1.5 sm:gap-2 mb-6 sm:mb-8 text-[10px] sm:text-[11px] font-semibold text-teal-700 dark:text-teal-300">
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-teal-500/10 border border-teal-500/20 flex items-center gap-1">
            <ShieldCheck size={12} /> Secure
          </span>
          <span className="px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center gap-1">
            <Sparkles size={12} /> Smart Reminders
          </span>
        </div>

        {/* Loading Progress Shimmer Bar */}
        <div className="w-full bg-slate-200 dark:bg-white/10 h-1.5 rounded-full overflow-hidden relative">
          <motion.div 
            className="h-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 rounded-full"
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
          />
        </div>

        {/* Status text */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-medium tracking-wide">
          {subtitle}
        </p>
      </motion.div>
    </div>
  );
}
