import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Pill, Clock, Calendar, FileText } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { addMedication } from '../services/medicationService';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { motion } from 'framer-motion';

export default function AddMedication() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      type: 'pill',
      mealTiming: 'after_meal'
    }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await addMedication(user.uid, {
        ...data,
        taken: false // Initial status
      });
      toast.success('Medication added successfully!');
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to add medication');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="Add Medication" description="Enter the details of your new prescription." />
      
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <Card>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            
            <div className="grid md:grid-cols-2 gap-6">
              <Input
                label="Medicine Name"
                placeholder="e.g. Amoxicillin"
                icon={Pill}
                error={errors.name?.message}
                {...register('name', { required: 'Name is required' })}
              />
              
              <Input
                label="Dosage"
                placeholder="e.g. 500mg"
                error={errors.dosage?.message}
                {...register('dosage', { required: 'Dosage is required' })}
              />
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Medicine Type</label>
                <select 
                  className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary focus:ring-primary focus:ring-2 focus:outline-none"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Frequency</label>
                <select 
                  className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary focus:ring-primary focus:ring-2 focus:outline-none"
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
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Meal Timing</label>
                <select 
                  className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary focus:ring-primary focus:ring-2 focus:outline-none"
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
                label="Start Date"
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

            <div className="w-full">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Notes / Instructions</label>
              <textarea 
                rows={3}
                className="w-full rounded-xl border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 text-gray-900 dark:text-gray-100 shadow-sm focus:border-primary focus:ring-primary focus:ring-2 focus:outline-none resize-none"
                placeholder="Any special instructions..."
                {...register('notes')}
              ></textarea>
            </div>

            <div className="flex items-center justify-end gap-4 pt-4 border-t border-gray-100 dark:border-gray-700">
              <Button type="button" variant="ghost" onClick={() => navigate('/dashboard')}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isLoading} className="min-w-[150px]">
                Save Medication
              </Button>
            </div>

          </form>
        </Card>
      </motion.div>
    </div>
  );
}
