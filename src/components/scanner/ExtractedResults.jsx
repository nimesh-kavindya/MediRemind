import { motion } from 'framer-motion';
import { Pill, Clock, Edit2, Trash2 } from 'lucide-react';
import Card from '../Card';
import { clsx } from '../../utils';

export default function ExtractedResults({ 
  medicines, 
  onToggleSelect, 
  onUpdateMedicine, 
  onDeleteMedicine 
}) {
  
  const container = {
    hidden: { opacity: 0 },
    show: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };
  
  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  const getConfidenceColor = (score) => {
    if (score >= 95) return 'text-success bg-green-100 dark:bg-green-900/30';
    if (score >= 85) return 'text-warning bg-yellow-100 dark:bg-yellow-900/30';
    return 'text-danger bg-red-100 dark:bg-red-900/30';
  };

  return (
    <motion.div variants={container} initial="hidden" animate="show" className="space-y-4">
      {medicines.map((med, index) => (
        <motion.div key={med.id} variants={item}>
          <Card className={clsx(
            "border-2 transition-all p-4",
            med.selected ? "border-primary" : "border-transparent opacity-60"
          )}>
            <div className="flex gap-4">
              <div className="pt-1">
                <input 
                  type="checkbox"
                  checked={med.selected}
                  onChange={() => onToggleSelect(med.id)}
                  className="w-5 h-5 rounded border-gray-300 text-primary focus:ring-primary"
                />
              </div>
              
              <div className="flex-1 space-y-3">
                <div className="flex items-start justify-between">
                  <div>
                    <input 
                      value={med.name}
                      onChange={(e) => onUpdateMedicine(med.id, 'name', e.target.value)}
                      className="text-lg font-bold text-gray-900 dark:text-white bg-transparent border-b border-transparent focus:border-primary focus:outline-none w-full"
                    />
                    <div className="flex gap-2 mt-1">
                      <input 
                        value={med.dosage}
                        onChange={(e) => onUpdateMedicine(med.id, 'dosage', e.target.value)}
                        className="text-sm text-gray-500 bg-transparent border-b border-transparent focus:border-gray-400 focus:outline-none w-24"
                      />
                    </div>
                  </div>
                  
                  <div className={clsx("px-2 py-1 rounded-md text-xs font-bold", getConfidenceColor(med.confidence))}>
                    {med.confidence}% Match
                  </div>
                </div>

                <div className="flex flex-wrap gap-4 pt-2 border-t border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    <select
                      value={med.frequency}
                      onChange={(e) => onUpdateMedicine(med.id, 'frequency', e.target.value)}
                      className="text-sm bg-transparent font-medium text-gray-700 dark:text-gray-300 focus:outline-none"
                    >
                      <option value="Daily">Daily</option>
                      <option value="Twice a Day">Twice a Day</option>
                      <option value="Thrice a Day">Thrice a Day</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <Pill size={16} className="text-gray-400" />
                    <select
                      value={med.mealTiming}
                      onChange={(e) => onUpdateMedicine(med.id, 'mealTiming', e.target.value)}
                      className="text-sm bg-transparent font-medium text-gray-700 dark:text-gray-300 focus:outline-none"
                    >
                      <option value="before_meal">Before Meal</option>
                      <option value="after_meal">After Meal</option>
                      <option value="anytime">Anytime</option>
                    </select>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col justify-start">
                <button 
                  onClick={() => onDeleteMedicine(med.id)}
                  className="p-2 text-gray-400 hover:text-danger hover:bg-red-50 dark:hover:bg-red-500/10 rounded-full transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );
}
