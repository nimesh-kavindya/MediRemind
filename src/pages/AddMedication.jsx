import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Pill, Clock, Calendar, Edit2, Trash2, Plus, 
  CheckCircle2, AlertCircle, Info, Sparkles, Search,
  Package, RefreshCw, AlertTriangle, Boxes
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addMedication, updateMedication, deleteMedication } from '../services/medicationService';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

export default function AddMedication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [medications, setMedications] = useState([]);
  const [editingMed, setEditingMed] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    defaultValues: {
      type: 'pill',
      category: 'Daily',
      mealTiming: 'after_meal',
      frequency: 'Daily',
      totalSupply: 30,
      lowSupplyThreshold: 5
    }
  });

  // Edit form state
  const [editForm, setEditForm] = useState({
    name: '',
    dosage: '',
    type: 'pill',
    category: 'Daily',
    frequency: 'Daily',
    mealTiming: 'after_meal',
    reminderTime: '08:00',
    startDate: '',
    endDate: '',
    notes: '',
    totalSupply: 30,
    remainingSupply: 30,
    lowSupplyThreshold: 5
  });

  const dedupMedicationsList = (medsList) => {
    if (!Array.isArray(medsList)) return { merged: [], modified: false };
    const merged = [];
    const nameMap = {};
    let modified = false;

    for (const med of medsList) {
      if (!med || !med.name) continue;
      const nameKey = med.name.trim().toLowerCase();
      const existingIndex = nameMap[nameKey];

      if (existingIndex !== undefined) {
        const existing = merged[existingIndex];
        
        // Merge scheduled times
        const times1 = Array.isArray(existing.reminderTime) ? existing.reminderTime : [existing.reminderTime].filter(Boolean);
        const times2 = Array.isArray(med.reminderTime) ? med.reminderTime : [med.reminderTime].filter(Boolean);
        const combinedTimes = Array.from(new Set([...times1, ...times2])).sort();
        const newReminderTime = combinedTimes.length > 1 ? combinedTimes : (combinedTimes[0] || '');

        if (JSON.stringify(existing.reminderTime) !== JSON.stringify(newReminderTime)) {
          existing.reminderTime = newReminderTime;
          modified = true;
        }

        const getSupply = (m) => {
          if (m.remainingSupply !== undefined) return parseInt(m.remainingSupply, 10);
          if (m.dosesLeft !== undefined) return parseInt(m.dosesLeft, 10);
          if (m.remainingDoses !== undefined) return parseInt(m.remainingDoses, 10);
          return parseInt(m.totalSupply, 10) || 30;
        };

        const existingRemaining = getSupply(existing);
        const medRemaining = getSupply(med);

        // If existing is out of stock (<= 0) but the duplicate has stock, we can restore it.
        if (existingRemaining <= 0 && medRemaining > 0) {
          existing.totalSupply = parseInt(med.totalSupply, 10) || 30;
          existing.remainingSupply = medRemaining;
          existing.dosesLeft = medRemaining;
          existing.remainingDoses = medRemaining;
          modified = true;
        } else {
          // Keep current pill count as-is, but synchronize properties
          existing.dosesLeft = existingRemaining;
          existing.remainingSupply = existingRemaining;
          existing.remainingDoses = existingRemaining;
        }
        
        modified = true;
      } else {
        const copy = { ...med };
        const getSupply = (m) => {
          if (m.remainingSupply !== undefined) return parseInt(m.remainingSupply, 10);
          if (m.dosesLeft !== undefined) return parseInt(m.dosesLeft, 10);
          if (m.remainingDoses !== undefined) return parseInt(m.remainingDoses, 10);
          return parseInt(m.totalSupply, 10) || 30;
        };
        const supply = getSupply(copy);
        copy.remainingSupply = supply;
        copy.dosesLeft = supply;
        copy.remainingDoses = supply;

        merged.push(copy);
        nameMap[nameKey] = merged.length - 1;
      }
    }

    return { merged, modified };
  };

  const loadMedications = () => {
    try {
      const activeUid = user?.uid || 'demo_user';
      const saved = JSON.parse(localStorage.getItem(`meds_${activeUid}`) || '[]');
      const { merged, modified } = dedupMedicationsList(saved);
      if (modified) {
        try {
          localStorage.setItem(`meds_${activeUid}`, JSON.stringify(merged));
        } catch (err) {
          console.warn('Failed to write meds to localStorage in loadMedications:', err);
        }
        window.dispatchEvent(new Event('local_meds_updated'));
      }
      setMedications(merged);
    } catch (err) {
      console.error('Failed to load medications inside AddMedication:', err);
    }
  };

  useEffect(() => {
    loadMedications();
    window.addEventListener('local_meds_updated', loadMedications);
    return () => window.removeEventListener('local_meds_updated', loadMedications);
  }, [user]);

  const filteredMedications = medications.filter((med) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      med.name?.toLowerCase().includes(q) ||
      (med.category || 'Daily').toLowerCase().includes(q) ||
      (med.type || '').toLowerCase().includes(q) ||
      (med.notes || '').toLowerCase().includes(q)
    );
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      const supplyVal = parseInt(data.totalSupply, 10) || 30;
      const thresholdVal = parseInt(data.lowSupplyThreshold, 10) || 5;
      const nameKey = data.name.trim().toLowerCase();

      // Find if duplicate medication with the same name exists (case-insensitive)
      const existing = medications.find(m => m.name && m.name.trim().toLowerCase() === nameKey);

      if (existing) {
        const getSupply = (m) => {
          if (m.remainingSupply !== undefined) return parseInt(m.remainingSupply, 10);
          if (m.dosesLeft !== undefined) return parseInt(m.dosesLeft, 10);
          if (m.remainingDoses !== undefined) return parseInt(m.remainingDoses, 10);
          return parseInt(m.totalSupply, 10) || 30;
        };

        const currentTotal = parseInt(existing.totalSupply, 10) || 30;
        const currentRemaining = getSupply(existing);

        let newTotal = currentTotal;
        let newRemaining = currentRemaining;
        let isRefill = false;

        // Auto refill only when out of stock (0 pills)
        if (currentRemaining <= 0) {
          newTotal = supplyVal;
          newRemaining = supplyVal;
          isRefill = true;
        }

        // Merge scheduled times
        const times1 = Array.isArray(existing.reminderTime) ? existing.reminderTime : [existing.reminderTime].filter(Boolean);
        const times2 = [data.reminderTime].filter(Boolean);
        const combinedTimes = Array.from(new Set([...times1, ...times2])).sort();
        const newReminderTime = combinedTimes.length > 1 ? combinedTimes : (combinedTimes[0] || '08:00');

        const updatedPayload = {
          ...existing,
          reminderTime: newReminderTime,
          totalSupply: newTotal,
          remainingSupply: newRemaining,
          dosesLeft: newRemaining,
          remainingDoses: newRemaining,
          lowSupplyThreshold: Math.max(parseInt(existing.lowSupplyThreshold, 10) || 5, thresholdVal)
        };

        await updateMedication(user?.uid, existing.id, updatedPayload);
        
        if (isRefill) {
          toast.success(`Refilled ${existing.name}! Stock reset to ${supplyVal} doses.`, { icon: '📦' });
        } else {
          toast.success(`Added scheduled time ${data.reminderTime} for ${existing.name}. Pill stock kept as-is.`, { icon: '📅' });
        }
      } else {
        await addMedication(user?.uid, {
          ...data,
          totalSupply: supplyVal,
          remainingSupply: supplyVal,
          dosesLeft: supplyVal,
          remainingDoses: supplyVal,
          lowSupplyThreshold: thresholdVal,
          taken: false
        });
        toast.success(`Added ${data.name} with ${supplyVal} doses total supply!`);
      }

      reset({
        type: 'pill',
        category: 'Daily',
        mealTiming: 'after_meal',
        frequency: 'Daily',
        totalSupply: 30,
        lowSupplyThreshold: 5
      });
      loadMedications();
    } catch (error) {
      console.error('Error adding/updating medication:', error);
      toast.error('Failed to save medication');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickRefill = async (e, med) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const total = parseInt(med.totalSupply, 10) || 30;
    try {
      await updateMedication(user?.uid, med.id, {
        remainingSupply: total
      });
      toast.success(`Refilled ${med.name}! Remaining supply reset to ${total} doses.`, { icon: '📦' });
      loadMedications();
    } catch (err) {
      toast.error('Failed to refill medication');
    }
  };

  const handleDelete = async (e, medId, medName) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (window.confirm(`Are you sure you want to delete ${medName}? This will update your Dashboard and Dose History.`)) {
      try {
        await deleteMedication(user?.uid, medId);
        toast.success(`Deleted ${medName}`);
        loadMedications();
      } catch (err) {
        toast.error('Failed to delete medication');
      }
    }
  };

  const handleStartEdit = (e, med) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setEditingMed(med);
    const total = parseInt(med.totalSupply, 10) || 30;
    const remaining = med.remainingSupply !== undefined ? parseInt(med.remainingSupply, 10) : total;
    const threshold = parseInt(med.lowSupplyThreshold, 10) || 5;

    setEditForm({
      name: med.name || '',
      dosage: med.dosage || '',
      type: med.type || 'pill',
      category: med.category || 'Daily',
      frequency: med.frequency || 'Daily',
      mealTiming: med.mealTiming || 'after_meal',
      reminderTime: Array.isArray(med.reminderTime) ? med.reminderTime[0] || '08:00' : (med.reminderTime || '08:00'),
      startDate: med.startDate || '',
      endDate: med.endDate || '',
      notes: med.notes || '',
      totalSupply: total,
      remainingSupply: remaining,
      lowSupplyThreshold: threshold
    });
  };

  const handleUpdateSubmit = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (!editForm.name.trim()) {
      toast.error('Medication name is required');
      return;
    }

    setIsUpdating(true);
    try {
      const totalNum = parseInt(editForm.totalSupply, 10) || 30;
      const remNum = parseInt(editForm.remainingSupply, 10) ?? totalNum;
      const threshNum = parseInt(editForm.lowSupplyThreshold, 10) || 5;

      const updatedPayload = {
        ...editForm,
        totalSupply: totalNum,
        remainingSupply: remNum,
        dosesLeft: remNum,
        remainingDoses: remNum,
        lowSupplyThreshold: threshNum
      };

      await updateMedication(user?.uid, editingMed.id, updatedPayload);
      toast.success(`Updated ${editForm.name} successfully!`);
      setEditingMed(null);
      loadMedications();
    } catch (err) {
      console.error('Error updating medication:', err);
      toast.error('Failed to update medication');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <PageHeader 
        title="Add & Manage Medications" 
        subtitle="Enter new prescriptions or modify your active list below." 
      />
      
      {/* Form Card */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}>
        <Card className="p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-6 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-10 h-10 rounded-xl bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center font-bold">
              <Plus size={20} />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Add New Prescription</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Fill in details to set up scheduled dose tracking</p>
            </div>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Medicine Name *"
                placeholder="e.g. Amoxicillin"
                icon={Pill}
                error={errors.name?.message}
                {...register('name', { required: 'Name is required' })}
              />
              
              <Input
                label="Dosage *"
                placeholder="e.g. 500mg"
                error={errors.dosage?.message}
                {...register('dosage', { required: 'Dosage is required' })}
              />
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Category *</label>
                <select 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  {...register('category')}
                >
                  <option value="Daily">Daily Medication</option>
                  <option value="As Needed">As Needed (PRN)</option>
                  <option value="Vitamins">Vitamins & Supplements</option>
                  <option value="Pain Relief">Pain Relief</option>
                  <option value="Antibiotics">Antibiotics</option>
                  <option value="Chronic Care">Chronic Care</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Medicine Type</label>
                <select 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  {...register('type')}
                >
                  <option value="pill">Pill / Tablet</option>
                  <option value="capsule">Capsule</option>
                  <option value="syrup">Syrup / Liquid</option>
                  <option value="injection">Injection</option>
                  <option value="drops">Drops</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Frequency</label>
                <select 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  {...register('frequency')}
                >
                  <option value="Daily">Daily</option>
                  <option value="Twice a Day">Twice a Day</option>
                  <option value="Thrice a Day">Thrice a Day</option>
                  <option value="Weekly">Weekly</option>
                  <option value="As Needed">As Needed</option>
                </select>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Meal Timing</label>
                <select 
                  className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none"
                  {...register('mealTiming')}
                >
                  <option value="before_meal">Before Meal</option>
                  <option value="after_meal">After Meal</option>
                  <option value="with_food">With Food</option>
                  <option value="anytime">Anytime</option>
                </select>
              </div>

              <Input
                label="Reminder Time (Optional)"
                type="time"
                icon={Clock}
                {...register('reminderTime')}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Start Date *"
                type="date"
                icon={Calendar}
                error={errors.startDate?.message}
                {...register('startDate', { required: 'Start date is required' })}
              />
              
              <Input
                label="End Date (Optional)"
                type="date"
                icon={Calendar}
                {...register('endDate')}
              />
            </div>

            {/* Inventory & Low Supply Alert Settings */}
            <div className="bg-teal-500/5 dark:bg-slate-800/60 p-4 rounded-2xl border border-teal-500/20 space-y-3">
              <div className="flex items-center gap-2">
                <Package size={18} className="text-teal-600 dark:text-teal-400" />
                <h4 className="text-sm font-bold text-slate-900 dark:text-white">Inventory & Low Supply Alert</h4>
              </div>
              <div className="grid md:grid-cols-2 gap-4">
                <Input
                  label="Total Supply Count (Pills/Doses) *"
                  type="number"
                  min="1"
                  placeholder="e.g. 30"
                  icon={Boxes}
                  {...register('totalSupply')}
                />
                <Input
                  label="Low Supply Warning Threshold *"
                  type="number"
                  min="1"
                  placeholder="e.g. 5"
                  icon={AlertTriangle}
                  {...register('lowSupplyThreshold')}
                />
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                The app automatically decrements your remaining supply when you take doses on your Dashboard and triggers browser notifications when supply is low.
              </p>
            </div>

            <div className="w-full">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">Notes / Instructions</label>
              <textarea 
                rows={2}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none resize-none"
                placeholder="Take with a full glass of water..."
                {...register('notes')}
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>
                View Dashboard
              </Button>
              <Button type="submit" isLoading={isLoading} className="bg-teal-600 hover:bg-teal-700 text-white font-bold px-6">
                Save Medication
              </Button>
            </div>
          </form>
        </Card>
      </motion.div>

      {/* Added Medications Section below form */}
      <div className="space-y-4 pt-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
              <Pill className="text-teal-500" size={20} /> Added Medications ({filteredMedications.length})
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage your saved prescriptions. Edits automatically sync to Dashboard & Dose History.
            </p>
          </div>

          {medications.length > 0 && (
            <div className="w-full sm:w-72">
              <Input
                icon={Search}
                placeholder="Search by name or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          )}
        </div>

        {medications.length === 0 ? (
          <Card className="p-8 text-center text-slate-500 dark:text-slate-400">
            <Pill className="mx-auto mb-2 text-slate-400" size={32} />
            <p className="font-semibold text-sm">No medications added yet.</p>
            <p className="text-xs">Use the form above to add your first medication!</p>
          </Card>
        ) : filteredMedications.length === 0 ? (
          <Card className="p-8 text-center text-slate-500 dark:text-slate-400">
            <Search className="mx-auto mb-2 text-slate-400" size={32} />
            <p className="font-semibold text-sm">No medications found matching "{searchQuery}"</p>
            <button 
              onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSearchQuery(''); }}
              className="mt-2 text-xs font-bold text-teal-600 dark:text-teal-400 hover:underline"
            >
              Clear search filter
            </button>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence mode="popLayout">
              {(Array.isArray(filteredMedications) ? filteredMedications : []).map((med) => (
                <motion.div
                  key={med.id}
                  layout
                  initial={{ opacity: 0, y: 15, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -10, scale: 0.95 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                >
                  <Card className="p-5 flex flex-col justify-between hover:border-teal-500/40 transition-all border-slate-200/90 dark:border-slate-800 h-full">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h4 className="font-bold text-base text-slate-900 dark:text-white">{med.name}</h4>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20">
                              {med.dosage}
                            </span>
                            <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-700 dark:text-cyan-300 border border-cyan-500/20">
                              {med.category || 'Daily'}
                            </span>
                          </div>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 capitalize">
                            {med.type || 'Pill'} • {med.frequency || 'Daily'} • {med.mealTiming ? med.mealTiming.replace('_', ' ') : 'After meal'}
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => handleStartEdit(e, med)}
                            className="p-2 rounded-xl text-slate-500 hover:text-teal-600 dark:hover:text-teal-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            title="Edit Medication"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(e, med.id, med.name)}
                            className="p-2 rounded-xl text-slate-500 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors"
                            title="Delete Medication"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-xs text-slate-600 dark:text-slate-300 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 flex-wrap">
                        {med.reminderTime && (
                          <span className="flex items-center gap-1 text-teal-600 dark:text-teal-400 font-medium">
                            <Clock size={13} /> Time: {Array.isArray(med.reminderTime) ? med.reminderTime.join(', ') : med.reminderTime}
                          </span>
                        )}
                        {med.startDate && (
                          <span className="flex items-center gap-1 text-slate-500">
                            <Calendar size={13} /> {med.startDate}
                          </span>
                        )}
                      </div>

                      {/* Supply & Low Stock Indicator */}
                      {(() => {
                        const total = parseInt(med.totalSupply, 10) || 30;
                        const remaining = med.remainingSupply !== undefined ? parseInt(med.remainingSupply, 10) : total;
                        const threshold = parseInt(med.lowSupplyThreshold, 10) || 5;
                        const isLow = remaining <= threshold;

                        return (
                          <div className={`mt-3 p-2.5 rounded-xl border flex items-center justify-between gap-2 text-xs transition-all ${
                            isLow 
                              ? 'bg-amber-500/10 border-amber-500/30 text-amber-800 dark:text-amber-300' 
                              : 'bg-slate-50 dark:bg-slate-800/80 border-slate-200/80 dark:border-slate-700/80 text-slate-700 dark:text-slate-300'
                          }`}>
                            <div className="flex items-center gap-2 font-medium">
                              {isLow ? <AlertTriangle size={15} className="text-amber-500 shrink-0 animate-bounce" /> : <Package size={15} className="text-teal-500 shrink-0" />}
                              <div>
                                <span className="font-bold text-sm">{remaining}</span> / {total} doses left
                                {isLow && <span className="ml-1.5 text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30">Low Stock</span>}
                              </div>
                            </div>

                            <button
                              onClick={(e) => handleQuickRefill(e, med)}
                              className="px-2.5 py-1 rounded-lg bg-teal-600 hover:bg-teal-700 dark:bg-teal-500 dark:hover:bg-teal-400 text-white dark:text-slate-950 font-bold text-[11px] flex items-center gap-1 shrink-0 transition-all active:scale-95 shadow-sm"
                              title={`Reset remaining doses to ${total}`}
                            >
                              <RefreshCw size={12} /> Refill
                            </button>
                          </div>
                        );
                      })()}

                      {med.notes && (
                        <p className="text-xs italic text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg border border-slate-100 dark:border-slate-800">
                          "{med.notes}"
                        </p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Edit Medication Modal */}
      <AnimatePresence>
        {editingMed && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Edit2 size={18} className="text-teal-500" /> Edit Medication
                </h3>
                <button 
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingMed(null); }}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-sm font-bold"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleUpdateSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Medication Name *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.name}
                      onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                      Dosage *
                    </label>
                    <input
                      type="text"
                      required
                      value={editForm.dosage}
                      onChange={(e) => setEditForm(prev => ({ ...prev, dosage: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Category</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm(prev => ({ ...prev, category: e.target.value }))}
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

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Type</label>
                    <select
                      value={editForm.type}
                      onChange={(e) => setEditForm(prev => ({ ...prev, type: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="pill">Pill</option>
                      <option value="capsule">Capsule</option>
                      <option value="syrup">Syrup</option>
                      <option value="injection">Injection</option>
                      <option value="drops">Drops</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Frequency</label>
                    <select
                      value={editForm.frequency}
                      onChange={(e) => setEditForm(prev => ({ ...prev, frequency: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Twice a Day">Twice a Day</option>
                      <option value="Thrice a Day">Thrice a Day</option>
                      <option value="Weekly">Weekly</option>
                      <option value="As Needed">As Needed</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Meal Timing</label>
                    <select
                      value={editForm.mealTiming}
                      onChange={(e) => setEditForm(prev => ({ ...prev, mealTiming: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                    >
                      <option value="before_meal">Before Meal</option>
                      <option value="after_meal">After Meal</option>
                      <option value="with_food">With Food</option>
                      <option value="anytime">Anytime</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Reminder Time</label>
                    <input
                      type="time"
                      value={editForm.reminderTime}
                      onChange={(e) => setEditForm(prev => ({ ...prev, reminderTime: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={editForm.startDate}
                      onChange={(e) => setEditForm(prev => ({ ...prev, startDate: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">End Date</label>
                    <input
                      type="date"
                      value={editForm.endDate}
                      onChange={(e) => setEditForm(prev => ({ ...prev, endDate: e.target.value }))}
                      className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                    />
                  </div>
                </div>

                <div className="bg-teal-500/5 dark:bg-slate-800/80 p-3.5 rounded-xl border border-teal-500/20 space-y-2">
                  <span className="block text-xs font-bold text-teal-700 dark:text-teal-400 flex items-center gap-1.5">
                    <Package size={14} /> Inventory & Low Supply Threshold
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Total Supply</label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.totalSupply}
                        onChange={(e) => setEditForm(prev => ({ ...prev, totalSupply: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Remaining</label>
                      <input
                        type="number"
                        min="0"
                        value={editForm.remainingSupply}
                        onChange={(e) => setEditForm(prev => ({ ...prev, remainingSupply: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20 font-bold"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 dark:text-slate-400 mb-1">Alert Below</label>
                      <input
                        type="number"
                        min="1"
                        value={editForm.lowSupplyThreshold}
                        onChange={(e) => setEditForm(prev => ({ ...prev, lowSupplyThreshold: e.target.value }))}
                        className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-2.5 py-1.5 text-xs text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">Instructions / Notes</label>
                  <textarea
                    rows={2}
                    value={editForm.notes}
                    onChange={(e) => setEditForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 px-3.5 py-2 text-sm text-slate-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500/20 resize-none"
                  ></textarea>
                </div>

                <div className="pt-2 flex justify-end gap-2 border-t border-slate-100 dark:border-slate-800">
                  <Button type="button" variant="outline" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setEditingMed(null); }}>
                    Cancel
                  </Button>
                  <Button type="submit" isLoading={isUpdating} className="bg-teal-600 text-white font-bold">
                    Update Medication
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
