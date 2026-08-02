import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  History, CheckCircle2, XCircle, AlertCircle, Calendar as CalendarIcon, 
  Search, Plus, Download, Trash2, Clock, Pill, FileText 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';

import { 
  getDoseLogs, 
  logBatchDoseEvents,
  deleteDoseLog
} from '../services/historyService';

export default function MedicationHistory() {
  const { user } = useAuth();
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState('all');
  const [selectedMed, setSelectedMed] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);
  const [isLogging, setIsLogging] = useState(false);

  // Manual Log Form State
  const [manualForm, setManualForm] = useState({
    medName: '',
    dosage: '',
    category: 'Daily',
    scheduledTime: '08:00',
    status: 'taken',
    dateStr: new Date().toISOString().split('T')[0],
    notes: 'Logged manually',
    totalDosesCount: 1
  });

  const loadLogs = async () => {
    setLoading(true);
    try {
      const data = await getDoseLogs(user?.uid);
      setLogs(data);
    } catch (err) {
      console.error('Error loading dose logs:', err);
      toast.error('Failed to load history logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();

    const handleUpdate = () => loadLogs();
    window.addEventListener('dose_logs_updated', handleUpdate);
    window.addEventListener('local_meds_updated', handleUpdate);
    return () => {
      window.removeEventListener('dose_logs_updated', handleUpdate);
      window.removeEventListener('local_meds_updated', handleUpdate);
    };
  }, [user]);

  // Unique list of medications for filter dropdown
  const medicationOptions = useMemo(() => {
    const safeLogs = Array.isArray(logs) ? logs : [];
    const names = new Set(safeLogs.map(l => l && l.medName).filter(Boolean));
    return Array.from(names);
  }, [logs]);

  // Unique list of categories for filter dropdown
  const categoryOptions = useMemo(() => {
    const safeLogs = Array.isArray(logs) ? logs : [];
    const categories = new Set(safeLogs.map(l => l && (l.category || 'Daily')).filter(Boolean));
    return Array.from(categories);
  }, [logs]);

  // Unique list of months for filter dropdown
  const monthOptions = useMemo(() => {
    const safeLogs = Array.isArray(logs) ? logs : [];
    const months = new Set();
    safeLogs.forEach(l => {
      if (l && (l.dateStr || l.timestamp || l.createdAt)) {
        const dateObj = new Date(l.dateStr || l.timestamp || l.createdAt);
        if (!isNaN(dateObj.getTime())) {
          // e.g. "August 2026"
          const monthYear = dateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
          months.add(monthYear);
        }
      }
    });
    // Sort months descending (very basic sort assuming string works or we can just parse)
    return Array.from(months).sort((a, b) => new Date(b) - new Date(a));
  }, [logs]);

  // Filtered logs for the table/timeline list
  const filteredLogs = useMemo(() => {
    return logs.filter(log => {
      const logDateObj = log.dateStr ? new Date(log.dateStr) : new Date(log.timestamp || log.createdAt);
      const logMonthYear = !isNaN(logDateObj.getTime()) ? logDateObj.toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : '';

      const matchesMonth = selectedMonth === 'all' || logMonthYear === selectedMonth;
      const matchesSearch = 
        log.medName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.dosage?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.category?.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMed = selectedMed === 'all' || log.medName === selectedMed;
      const matchesCategory = selectedCategory === 'all' || (log.category || 'Daily') === selectedCategory;
      const matchesStatus = selectedStatus === 'all' || log.status === selectedStatus;

      return matchesMonth && matchesSearch && matchesMed && matchesCategory && matchesStatus;
    });
  }, [logs, searchTerm, selectedMed, selectedCategory, selectedStatus, selectedMonth]);

  const handleDeleteLog = async (e, logId) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!window.confirm('Are you sure you want to delete this dose record?')) return;
    try {
      await deleteDoseLog(user?.uid, logId);
      setLogs(prev => prev.filter(l => l.id !== logId));
      toast.success('Dose record removed');
    } catch (err) {
      console.error(err);
      toast.error('Failed to delete log');
    }
  };

  const handleManualSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!manualForm.medName.trim()) {
      toast.error('Please enter a medication name');
      return;
    }

    const count = parseInt(manualForm.totalDosesCount, 10);
    if (isNaN(count) || count < 1) {
      toast.error('Please enter a valid count of at least 1');
      return;
    }

    setIsLogging(true);
    try {
      const createdLogs = await logBatchDoseEvents(user?.uid, {
        medName: manualForm.medName,
        dosage: manualForm.dosage || '1 dose',
        category: manualForm.category || 'Daily',
        scheduledTime: manualForm.scheduledTime,
        status: manualForm.status,
        dateStr: manualForm.dateStr,
        notes: manualForm.notes
      }, count);

      // Append all generated log items to state instantly
      setLogs(prev => [...createdLogs, ...prev]);

      toast.success(count > 1 ? `${count} doses logged successfully! 🎉` : 'Dose logged successfully! 🎉');
      setShowLogModal(false);
      setManualForm({
        medName: '',
        dosage: '',
        category: 'Daily',
        scheduledTime: '08:00',
        status: 'taken',
        dateStr: new Date().toISOString().split('T')[0],
        notes: 'Logged manually',
        totalDosesCount: 1
      });
      loadLogs();
    } catch (err) {
      console.error('Error logging dose batch:', err);
      toast.error('Error logging dose');
    } finally {
      setIsLogging(false);
    }
  };

  const handleExportPDF = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (logs.length === 0) {
      toast.error('No logs available to export');
      return;
    }
    window.print();
    toast.success('Preparing PDF export...');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      <style>
        {`
          @media print {
            body * {
              visibility: hidden;
            }
            .print-area, .print-area * {
              visibility: visible;
            }
            .print-area {
              position: absolute;
              left: 0;
              top: 0;
              width: 100%;
            }
            .no-print {
              display: none !important;
            }
            /* Hide the PageHeader since it might be outside print-area or too complex */
            .print-header {
              display: block !important;
              text-align: center;
              margin-bottom: 20px;
            }
          }
          .print-header { display: none; }
        `}
      </style>
      <div className="no-print">
        <PageHeader 
          title="Medication History & Adherence" 
          subtitle="Track every completed dose and view your history logs."
        />
      </div>

      <div className="print-area">
        <div className="print-header">
          <h2>Dose History Report</h2>
          <p>Generated on: {new Date().toLocaleDateString()}</p>
        </div>

      {/* Filters & Log History Table */}
      <Card>
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5 no-print">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileText size={19} className="text-teal-500" /> Detailed Dose History Records
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing {filteredLogs.length} of {logs.length} logged doses
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-end md:self-auto">
            <button
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLogModal(true); }}
              className="px-3.5 py-2 rounded-xl bg-teal-600 dark:bg-teal-500 hover:bg-teal-700 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-md shadow-teal-500/20 active:scale-95 transition-all"
            >
              <Plus size={16} /> Log Manual Dose
            </button>

            <button
              onClick={(e) => handleExportPDF(e)}
              className="px-3 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
              title="Export PDF Report"
            >
              <Download size={15} /> Export PDF
            </button>

            {logs.length > 0 && (
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  if (window.confirm("Are you sure you want to clear your dose history? This will NOT delete your medications.")) {
                    const activeUid = user?.uid || 'demo_user';
                    localStorage.removeItem('dose_logs');
                    localStorage.removeItem(`dose_logs_${activeUid}`);
                    try { setLogs([]); } catch (e) {}
                    window.dispatchEvent(new Event('dose_logs_updated'));
                    toast.success('Dose history cleared');
                  }
                }}
                className="px-3 py-2 text-xs font-semibold text-rose-500 hover:text-rose-600 dark:text-rose-400 dark:hover:text-rose-300 flex items-center gap-1 transition-colors"
              >
                <Trash2 size={15} /> Clear History
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 mb-4 no-print">
          {/* Search Input */}
          <Input
            icon={Search}
            placeholder="Search med, notes, category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />

          {/* Month Filter */}
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
            >
              <option value="all">All Months</option>
              {(Array.isArray(monthOptions) ? monthOptions : []).map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>
          </div>

          {/* Medication Filter */}
          <div>
            <select
              value={selectedMed}
              onChange={(e) => setSelectedMed(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
            >
              <option value="all">All Medications ({(Array.isArray(medicationOptions) ? medicationOptions : []).length})</option>
              {(Array.isArray(medicationOptions) ? medicationOptions : []).map(name => (
                <option key={name} value={name}>{name}</option>
              ))}
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
            >
              <option value="all">All Categories ({(Array.isArray(categoryOptions) ? categoryOptions : []).length})</option>
              {(Array.isArray(categoryOptions) ? categoryOptions : []).map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800 px-3.5 py-2.5 text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
            >
              <option value="all">All Statuses</option>
              <option value="taken">✓ Taken Only</option>
              <option value="missed">✗ Missed Only</option>
              <option value="skipped">⏭ Skipped Only</option>
            </select>
          </div>
        </div>

        {/* Logs List */}
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader />
          </div>
        ) : filteredLogs.length === 0 ? (
          <EmptyState
            title="No history records match your filters"
            description="Try adjusting your search criteria or log a manual dose."
          />
        ) : (
          <div className="space-y-2.5">
            {(Array.isArray(filteredLogs) ? filteredLogs : []).slice(0, 50).map((log) => {
              const isTaken = log.status === 'taken';
              const isMissed = log.status === 'missed';
              const isSkipped = log.status === 'skipped';

              return (
                <div 
                  key={log.id}
                  className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 dark:bg-slate-800/50 border border-slate-200/70 dark:border-slate-700/60 hover:border-teal-500/40 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start sm:items-center gap-3">
                    {/* Status Icon */}
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      isTaken 
                        ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30' 
                        : (isMissed 
                            ? 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30' 
                            : 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30')
                    }`}>
                      {isTaken && <CheckCircle2 size={20} />}
                      {isMissed && <XCircle size={20} />}
                      {isSkipped && <AlertCircle size={20} />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {log.medName}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                          {log.dosage}
                        </span>
                        <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                          {log.category || 'Daily'}
                        </span>
                        <span className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isTaken 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : (isMissed ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400')
                        }`}>
                          {log.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1 flex-wrap">
                        <span className="flex items-center gap-1">
                          <CalendarIcon size={13} className="text-teal-500" />
                          {log.dateStr}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={13} className="text-teal-500" />
                          {log.scheduledTime}
                        </span>
                        {log.notes && (
                          <span className="text-slate-600 dark:text-slate-300 italic">
                            "{log.notes}"
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={(e) => handleDeleteLog(e, log.id)}
                    className="text-slate-400 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-rose-50 dark:hover:bg-rose-950/30 self-end sm:self-center"
                    title="Delete entry"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      </div>

      {/* Manual Log Modal */}
      <AnimatePresence>
        {showLogModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Plus size={20} className="text-teal-500" /> Log Dose Record
                </h3>
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLogModal(false); }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleManualSubmit} className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Medication Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Amoxicillin"
                    value={manualForm.medName}
                    onChange={(e) => setManualForm(prev => ({ ...prev, medName: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Dosage
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 500mg"
                      value={manualForm.dosage}
                      onChange={(e) => setManualForm(prev => ({ ...prev, dosage: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Category
                    </label>
                    <select
                      value={manualForm.category}
                      onChange={(e) => setManualForm(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="Daily">Daily</option>
                      <option value="As Needed">As Needed</option>
                      <option value="Vitamins">Vitamins</option>
                      <option value="Pain Relief">Pain Relief</option>
                      <option value="Antibiotics">Antibiotics</option>
                      <option value="Chronic Care">Chronic Care</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Time
                    </label>
                    <input
                      type="time"
                      value={manualForm.scheduledTime}
                      onChange={(e) => setManualForm(prev => ({ ...prev, scheduledTime: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Date
                    </label>
                    <input
                      type="date"
                      value={manualForm.dateStr}
                      onChange={(e) => setManualForm(prev => ({ ...prev, dateStr: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Status
                    </label>
                    <select
                      value={manualForm.status}
                      onChange={(e) => setManualForm(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2 py-2 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="taken">Taken</option>
                      <option value="missed">Missed</option>
                      <option value="skipped">Skipped</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Total Doses / Logs Count *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={manualForm.totalDosesCount === undefined ? '' : manualForm.totalDosesCount}
                    onChange={(e) => setManualForm(prev => ({ ...prev, totalDosesCount: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Notes / Comments
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Taken after lunch with meal"
                    value={manualForm.notes}
                    onChange={(e) => setManualForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setShowLogModal(false); }}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isLogging} className="bg-teal-500 text-slate-950 font-bold">
                    Save Record
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
