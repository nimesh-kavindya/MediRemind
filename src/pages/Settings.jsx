import { useRef } from 'react';
import { LogOut, Globe, Moon, Sun, Monitor, Bell, Download, Upload, Volume2, FileText } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { clsx } from '../utils';
import { requestNotificationPermission, scheduleLocalNotification } from '../services/notificationService';
import { collection, getDocs, writeBatch, doc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import Papa from 'papaparse';
import toast from 'react-hot-toast';

export default function Settings() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef(null);

  const handleTestNotification = async () => {
    const granted = await requestNotificationPermission();
    if (granted) {
      scheduleLocalNotification("Test Notification", { body: "Your notifications are working!" });
    } else {
      toast.error("Notification permission denied");
    }
  };

  const fetchUserMedications = async () => {
    const snapshot = await getDocs(collection(db, `users/${user.uid}/medications`));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  };

  const handleExportJSON = async () => {
    const data = await fetchUserMedications();
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    downloadFile(dataStr, "mediremind_export.json");
  };

  const handleExportCSV = async () => {
    const data = await fetchUserMedications();
    const csv = Papa.unparse(data);
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    downloadFile(dataStr, "mediremind_export.csv");
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
        const importedData = JSON.parse(event.target.result);
        if (!Array.isArray(importedData)) throw new Error('Invalid format');
        
        const batch = writeBatch(db);
        importedData.forEach(med => {
          // Remove old ID, generate new one to avoid conflicts
          const { id, ...medData } = med;
          const newRef = doc(collection(db, `users/${user.uid}/medications`));
          batch.set(newRef, medData);
        });
        
        await batch.commit();
        toast.success(`Imported ${importedData.length} medications!`);
      } catch (err) {
        toast.error('Failed to parse JSON file.');
      }
    };
    reader.readAsText(file);
    // reset input
    if(fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Settings" />

      <Card>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <Monitor size={20} className="text-primary" /> Appearance
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
                "flex flex-col items-center justify-center p-4 rounded-xl border-2 transition-all",
                theme === t.id ? "border-primary bg-primary/5 text-primary" : "border-gray-200 dark:border-gray-700 text-gray-500"
              )}
            >
              <t.icon size={24} className="mb-2" />
              <span className="text-sm font-medium">{t.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <Bell size={20} className="text-primary" /> Notifications & Sound
        </h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Browser Notifications</p>
              <p className="text-sm text-gray-500">Receive reminders even when the app is closed</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleTestNotification}>Enable / Test</Button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800/50 rounded-xl">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">Reminder Sound</p>
              <p className="text-sm text-gray-500">Play a sound when a reminder triggers</p>
            </div>
            <Volume2 className="text-gray-400" />
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-gray-900 dark:text-white">
          <Download size={20} className="text-primary" /> Data Management
        </h3>
        <div className="flex flex-col gap-4">
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={handleExportJSON}>
              <Download size={16} className="mr-2" /> Export JSON
            </Button>
            <Button variant="outline" className="flex-1" onClick={handleExportCSV}>
              <FileText size={16} className="mr-2" /> Export CSV
            </Button>
          </div>
          
          <div className="relative">
            <input 
              type="file" 
              accept=".json" 
              ref={fileInputRef}
              onChange={handleImportJSON} 
              className="hidden" 
              id="import-json"
            />
            <label htmlFor="import-json" className="flex-1">
              <Button variant="outline" className="w-full pointer-events-none" as="div">
                <Upload size={16} className="mr-2" /> Import JSON
              </Button>
            </label>
          </div>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold mb-4 text-gray-900 dark:text-white">About MediRemind</h3>
        <p className="text-gray-500 dark:text-gray-400 mb-6">Version 2.0.0 (Phase 4)<br/>AI-Powered Medication Reminder.</p>
        <Button variant="danger" className="w-full sm:w-auto" onClick={logout}>
          <LogOut size={20} className="mr-2" /> Logout
        </Button>
      </Card>
    </div>
  );
}
