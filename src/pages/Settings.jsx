import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LogOut, Moon, Sun, Monitor, Bell, Download, Upload, Volume2, VolumeX, 
  FileText, CheckCircle, AlertCircle, BellRing, Sparkles, Printer, Github, 
  Code, ExternalLink, RefreshCw, Trash2, AlertTriangle, X, Database 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useNotifications } from '../context/NotificationContext';
import { clsx } from '../utils';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import { generateMedicationReportPDF } from '../services/pdfReportService';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

export function Settings({ onClearAllData }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { permission, soundEnabled, setSoundEnabled, enableBrowserNotifications, sendTestNotification } = useNotifications();
  const fileInputRef = useRef(null);

  const fetchUserMedications = async () => {
    try {
      const snapshot = await getDocs(collection(db, `users/${user.uid}/medications`));
      const firebaseMeds = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (firebaseMeds.length > 0) return firebaseMeds;
    } catch (e) {
      console.warn('Firestore fetch failed, reading local storage:', e);
    }
    return JSON.parse(localStorage.getItem(`meds_${user?.uid || 'demo_user'}`) || '[]');
  };

  const handleExportPDF = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const activeUid = user?.uid || 'demo_user';
      let data = await fetchUserMedications();
      if (!data || data.length === 0) {
        data = JSON.parse(localStorage.getItem('medications') || localStorage.getItem(`meds_${activeUid}`) || '[]');
      }
      const logs = JSON.parse(localStorage.getItem('dose_logs') || localStorage.getItem(`dose_logs_${activeUid}`) || '[]');
      generateMedicationReportPDF(user, data, logs);
      toast.success('Professional PDF Report generated!');
    } catch (e) {
      console.error('PDF Generation failed:', e);
      toast.error('Failed to generate PDF report');
    }
  };

  const handleExportJSON = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const activeUid = user?.uid || 'demo_user';
      let meds = await fetchUserMedications();
      if (!meds || meds.length === 0) {
        meds = JSON.parse(localStorage.getItem('medications') || localStorage.getItem(`meds_${activeUid}`) || '[]');
      }

      let logs = [];
      try {
        if (user?.uid) {
          const logSnap = await getDocs(collection(db, `users/${user.uid}/dose_logs`));
          logs = logSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        }
      } catch (e) {
        logs = JSON.parse(localStorage.getItem('dose_logs') || localStorage.getItem(`dose_logs_${activeUid}`) || '[]');
      }
      if (!logs || logs.length === 0) {
        logs = JSON.parse(localStorage.getItem('dose_logs') || localStorage.getItem(`dose_logs_${activeUid}`) || '[]');
      }

      const calendarEvents = JSON.parse(localStorage.getItem('calendar_events') || localStorage.getItem('medication_calendar') || '[]');

      const exportPayload = {
        app: 'MediRemind',
        exportedAt: new Date().toISOString(),
        user: { 
          name: user?.name || user?.displayName || 'User', 
          email: user?.email || 'Unknown', 
          photoURL: user?.photoURL || '' 
        },
        medications: meds,
        dose_logs: logs,
        doseLogs: logs,
        calendar_data: logs.length > 0 ? logs : calendarEvents
      };

      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
      downloadFile(dataStr, `mediremind_backup_${new Date().toISOString().slice(0, 10)}.json`);
    } catch (err) {
      console.error('JSON Export failed:', err);
      toast.error('Failed to export JSON backup');
    }
  };

  const handleExportCSV = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    try {
      const data = await fetchUserMedications();
      const csv = Papa.unparse(data);
      const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
      downloadFile(dataStr, "mediremind_export.csv");
    } catch (err) {
      console.error('CSV Export failed:', err);
      toast.error('Failed to export CSV');
    }
  };

  const downloadFile = (dataStr, filename) => {
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    toast.success(`${filename} exported successfully`);
  };

  const handleImportJSON = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const activeUid = user?.uid || 'demo_user';
        const parsed = JSON.parse(event.target.result);

        let importedMeds = [];
        let importedLogs = [];

        if (Array.isArray(parsed)) {
          importedMeds = parsed;
        } else if (typeof parsed === 'object' && parsed !== null) {
          importedMeds = parsed.medications || parsed.meds || [];
          importedLogs = parsed.dose_logs || parsed.doseLogs || parsed.calendar_data || parsed.logs || [];
        }

        if (!Array.isArray(importedMeds)) {
          throw new Error('Invalid JSON backup file format');
        }

        // 1. Local storage update for Medications with Map deduplication
        const currentLocalMeds = JSON.parse(localStorage.getItem('medications') || localStorage.getItem(`meds_${activeUid}`) || '[]');
        const combinedMeds = [...importedMeds, ...currentLocalMeds];
        const deduplicatedMeds = Array.from(
          new Map(combinedMeds.map(item => [item.id || item.name, item])).values()
        );
        localStorage.setItem('medications', JSON.stringify(deduplicatedMeds));
        localStorage.setItem(`meds_${activeUid}`, JSON.stringify(deduplicatedMeds));

        // 2. Local storage update for Dose Logs & Calendar Data with Map deduplication
        if (Array.isArray(importedLogs) && importedLogs.length > 0) {
          const currentLocalLogs = JSON.parse(localStorage.getItem('dose_logs') || localStorage.getItem(`dose_logs_${activeUid}`) || '[]');
          const combinedLogs = [...importedLogs, ...currentLocalLogs];
          const deduplicatedLogs = Array.from(
            new Map(combinedLogs.map(log => [log.id || (log.medicationId + '_' + log.timestamp), log])).values()
          );
          localStorage.setItem('dose_logs', JSON.stringify(deduplicatedLogs));
          localStorage.setItem(`dose_logs_${activeUid}`, JSON.stringify(deduplicatedLogs));
          localStorage.setItem('calendar_events', JSON.stringify(deduplicatedLogs));
        }

        // 3. Batch sync to Firestore
        if (user?.uid) {
          try {
            if (importedMeds.length > 0) {
              const batch = writeBatch(db);
              importedMeds.forEach(med => {
                const { id, ...medData } = med;
                const newRef = doc(collection(db, `users/${user.uid}/medications`));
                batch.set(newRef, medData);
              });
              await batch.commit();
            }

            if (importedLogs.length > 0) {
              const logBatch = writeBatch(db);
              importedLogs.forEach(log => {
                const { id, ...logData } = log;
                const newRef = doc(collection(db, `users/${user.uid}/dose_logs`));
                logBatch.set(newRef, logData);
              });
              await logBatch.commit();
            }
          } catch (dbErr) {
            console.warn('Firestore import sync warning:', dbErr);
          }
        }

        // 4. Dispatch events so all tabs refresh immediately
        window.dispatchEvent(new Event('local_meds_updated'));
        window.dispatchEvent(new Event('dose_logs_updated'));
        window.dispatchEvent(new Event('scan_logs_updated'));
        window.dispatchEvent(new Event('calendar_updated'));

        toast.success(`Imported ${importedMeds.length} medications & ${importedLogs.length} logs/calendar entries! 🎉`);
      } catch (err) {
        console.error('Import error:', err);
        toast.error('Failed to parse or import JSON backup file.');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Settings" />

      {/* Appearance */}
      <Card>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
          <Monitor size={20} className="text-teal-600 dark:text-teal-400" /> Appearance Theme
        </h3>
        <div className="grid grid-cols-3 gap-4">
          {[
            { id: 'light', icon: Sun, label: 'Light' },
            { id: 'dark', icon: Moon, label: 'Dark' },
            { id: 'system', icon: Monitor, label: 'System' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setTheme(t.id)}
              className={clsx(
                "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all font-medium text-sm",
                theme === t.id 
                  ? "border-teal-500 bg-teal-500/10 text-teal-700 dark:text-teal-300 font-bold shadow-sm" 
                  : "border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50"
              )}
            >
              <t.icon size={22} className="mb-2" />
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      </Card>

      {/* Browser Notifications & Audio */}
      <Card>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold flex items-center gap-2 text-slate-900 dark:text-white">
            <Bell size={20} className="text-teal-600 dark:text-teal-400" /> Browser Medication Notifications
          </h3>
          <span className={clsx(
            "text-xs font-bold px-2.5 py-1 rounded-full flex items-center gap-1.5 border",
            permission === 'granted' 
              ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" 
              : permission === 'denied'
                ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20"
                : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
          )}>
            {permission === 'granted' && <CheckCircle size={14} />}
            {permission === 'denied' && <AlertCircle size={14} />}
            {permission === 'default' && <BellRing size={14} />}
            {permission === 'granted' ? 'Active' : permission === 'denied' ? 'Permission Denied' : 'Action Required'}
          </span>
        </div>

        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl">
            <div>
              <p className="font-semibold text-slate-900 dark:text-white text-sm">Scheduled Reminders</p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Automatically triggers browser desktop popups at your scheduled medication times.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button 
                variant={permission === 'granted' ? "outline" : "primary"} 
                size="sm" 
                onClick={enableBrowserNotifications}
                className={permission !== 'granted' ? "bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold" : ""}
              >
                {permission === 'granted' ? 'Re-authorize' : 'Enable Notifications'}
              </Button>
              <Button variant="secondary" size="sm" onClick={sendTestNotification} className="gap-1.5">
                <Sparkles size={14} /> Test
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-teal-500/10 text-teal-600 dark:text-teal-400 flex items-center justify-center">
                {soundEnabled ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </div>
              <div>
                <p className="font-semibold text-slate-900 dark:text-white text-sm">Audio Chime Sound</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Play a pleasant sound when a medication reminder triggers</p>
              </div>
            </div>
            
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={clsx(
                "relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none",
                soundEnabled ? "bg-teal-500" : "bg-slate-300 dark:bg-slate-700"
              )}
            >
              <span className={clsx(
                "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                soundEnabled ? "translate-x-6" : "translate-x-1"
              )} />
            </button>
          </div>
        </div>
      </Card>

      {/* Data Management */}
      <Card>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-slate-900 dark:text-white">
          <Database size={20} className="text-teal-600 dark:text-teal-400" /> Data Management & Medical Reports
        </h3>
        <div className="flex flex-col gap-3">
          <Button 
            variant="primary" 
            className="w-full bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 text-slate-950 font-bold py-3 shadow-md shadow-teal-500/20" 
            onClick={handleExportPDF}
          >
            <Printer size={18} className="mr-2" /> Download Professional Medical PDF Report
          </Button>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-1">
            <Button variant="outline" className="w-full" onClick={handleExportJSON}>
              <Download size={16} className="mr-2" /> Export JSON
            </Button>
            <Button variant="outline" className="w-full" onClick={handleExportCSV}>
              <FileText size={16} className="mr-2" /> Export CSV
            </Button>
          </div>
          
          <div className="relative mt-1">
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef}
              onChange={handleImportJSON} 
              className="hidden" 
              id="import-json"
            />
            <label htmlFor="import-json" className="block w-full cursor-pointer">
              <Button variant="outline" className="w-full pointer-events-none" as="div">
                <Upload size={16} className="mr-2 text-teal-500" /> Import JSON Backup
              </Button>
            </label>
          </div>

        </div>
      </Card>

      {/* Danger Zone: Emergency Reset */}
      <Card className="border border-rose-500/30 bg-rose-500/5 dark:bg-rose-950/10">
        <h3 className="text-lg font-bold mb-2 flex items-center gap-2 text-rose-600 dark:text-rose-400">
          <AlertTriangle size={20} /> Danger Zone
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mb-4 leading-relaxed">
          Resetting all app data will permanently wipe all local medications, dose history logs, and local caches. This action cannot be undone.
        </p>
        <Button 
          variant="danger"
          className="w-full bg-rose-600 hover:bg-rose-700 text-white font-bold py-2.5 shadow-md flex items-center justify-center gap-2"
          onClick={() => {
            if (window.confirm("Are you sure you want to clear all medications and logs? This cannot be undone.")) {
              if (onClearAllData) {
                onClearAllData();
              } else {
                localStorage.clear();
                localStorage.removeItem('medications');
                localStorage.removeItem('dose_logs');
                localStorage.removeItem('medi_counts_backup');
                localStorage.removeItem('calendar_events');
                localStorage.removeItem('medication_calendar');
                localStorage.removeItem('calendar_data');
                window.dispatchEvent(new Event('local_meds_updated'));
                window.dispatchEvent(new Event('dose_logs_updated'));
                window.dispatchEvent(new Event('calendar_updated'));
                toast.success("All app data cleared successfully");
                setTimeout(() => {
                  window.location.reload();
                }, 300);
              }
            }
          }}
        >
          <Trash2 size={16} /> Reset All App Data (Clear Data)
        </Button>
      </Card>

      {/* About & Developer Info */}
      <Card>
        <div className="flex flex-col gap-5">
          <div>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">About MediRemind</h3>
              <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                v1.01
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
              Smart Personal Medication & Health Reminder Portal. Designed for seamless prescription tracking, schedule notifications, and emergency data access.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-teal-500/5 dark:from-slate-800/80 dark:to-slate-800/40 border border-slate-200/90 dark:border-slate-700/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200/60 dark:border-slate-700/60 pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 flex items-center gap-1.5 bg-teal-500/10 dark:bg-teal-400/10 px-3 py-1 rounded-full border border-teal-500/20">
                <Code size={14} /> Lead Developer
              </span>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Author & Maintainer
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 text-center sm:text-left">
              <div className="relative shrink-0">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 blur-sm opacity-50"></div>
                <img 
                  src="https://i.postimg.cc/G8gVR1nx/image.png" 
                  alt="Nimesh Kavindya" 
                  referrerPolicy="no-referrer"
                  className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full object-cover border-2 border-white dark:border-slate-800 shadow-md"
                />
              </div>

              <div className="flex-1 space-y-1">
                <h4 className="font-extrabold text-slate-900 dark:text-white text-lg sm:text-xl">
                  Nimesh Kavindya
                </h4>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 font-medium leading-relaxed max-w-md">
                  BSc (Hons) Information Systems Undergraduate At SUSL
                </p>
                <div className="pt-2">
                  <a 
                    href="https://github.com/nimesh-kavindya" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 dark:bg-slate-950 text-white hover:bg-teal-600 dark:hover:bg-teal-500 transition-all text-xs font-bold shadow-sm group"
                  >
                    <Github size={15} className="group-hover:scale-110 transition-transform" />
                    <span>Connect on GitHub</span>
                    <ExternalLink size={13} className="opacity-70 group-hover:translate-x-0.5 transition-transform" />
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-500 dark:text-slate-400">
            <p className="font-medium text-center sm:text-left">
              © 2026 MediRemind. All rights reserved.
            </p>
            <Button variant="danger" size="sm" onClick={logout} className="w-full sm:w-auto">
              <LogOut size={16} className="mr-1.5" /> Logout
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

export default Settings;
