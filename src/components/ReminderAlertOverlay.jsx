import { motion, AnimatePresence } from 'framer-motion';
import { Pill, CheckCircle2, Clock, X, BellRing } from 'lucide-react';
import Button from './Button';

export default function ReminderAlertOverlay({ alerts = [], onMarkTaken, onSnooze, onDismiss }) {
  if (!alerts || alerts.length === 0) return null;

  return (
    <div className="fixed top-5 right-5 z-50 flex flex-col gap-3 max-w-sm w-full px-4 pointer-events-none">
      <AnimatePresence>
        {alerts.map((alert) => (
          <motion.div
            key={alert.id + '_' + alert.triggerTime}
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="pointer-events-auto bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border-2 border-teal-500/80 shadow-[0_20px_50px_rgba(20,184,166,0.25)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.8)] rounded-2xl p-4 text-slate-900 dark:text-white"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500/10 dark:bg-teal-400/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0 animate-bounce">
                  <Pill size={22} />
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-400/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <BellRing size={12} className="animate-pulse" /> Reminder • {alert.triggerTime || 'Now'}
                    </span>
                  </div>
                  <h4 className="font-bold text-base leading-tight mt-1">{alert.name}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300">
                    Dosage: <span className="font-semibold">{alert.dosage}</span>
                    {alert.mealTiming && alert.mealTiming !== 'none' && (
                      <span className="ml-1 text-slate-500">({alert.mealTiming.replace('_', ' ')})</span>
                    )}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onDismiss(alert.id)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg transition-colors"
                title="Dismiss"
              >
                <X size={18} />
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                className="flex-1 text-xs py-2 gap-1.5 bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold"
                onClick={() => onMarkTaken(alert.id)}
              >
                <CheckCircle2 size={16} /> Take Dose
              </Button>
              
              <Button
                variant="secondary"
                size="sm"
                className="text-xs py-2 px-3 gap-1"
                onClick={() => onSnooze(alert.id, 10)}
                title="Remind in 10 minutes"
              >
                <Clock size={15} /> 10m Snooze
              </Button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
