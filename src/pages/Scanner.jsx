import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Camera, Sparkles, History, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Button from '../components/Button';
import EmptyState from '../components/EmptyState';
import Loader from '../components/Loader';

// Scanner components
import ImageUploader from '../components/scanner/ImageUploader';
import CameraCapture from '../components/scanner/CameraCapture';
import ScanningAnimation from '../components/scanner/ScanningAnimation';
import ExtractedResults from '../components/scanner/ExtractedResults';

// Services
import { uploadPrescriptionImage } from '../services/storageService';
import { extractMedicationsFromImage } from '../services/scannerService';
import { saveScanHistory, getScanHistory, deleteScanHistory } from '../services/prescriptionService';
import { addMedication } from '../services/medicationService';

export default function Scanner() {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // State Machine: 'idle' | 'camera' | 'uploading' | 'scanning' | 'review'
  const [step, setStep] = useState('idle');
  
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [extractedMedicines, setExtractedMedicines] = useState([]);
  const [scanHistory, setScanHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [isImporting, setIsImporting] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    try {
      const history = await getScanHistory(user.uid);
      setScanHistory(history);
    } catch (error) {
      toast.error('Failed to load scan history');
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleImageSelected = async (file, previewUrl) => {
    setImageFile(file);
    setImagePreview(previewUrl);
    setStep('uploading');
    
    try {
      // 1. Upload to Storage
      const { downloadURL, fileName } = await uploadPrescriptionImage(user.uid, file);
      
      setStep('scanning');
      // 2. Simulate OCR Extraction
      const meds = await extractMedicationsFromImage(downloadURL);
      setExtractedMedicines(meds);
      
      // 3. Save to Scan History
      await saveScanHistory(user.uid, {
        imageUrl: downloadURL,
        fileName,
        medicineCount: meds.length,
        status: 'completed'
      });
      
      // Refresh history silently
      loadHistory();
      
      setStep('review');
    } catch (error) {
      toast.error('Processing failed. Please try again.');
      setStep('idle');
    }
  };

  const handleToggleSelect = (id) => {
    setExtractedMedicines(prev => prev.map(m => 
      m.id === id ? { ...m, selected: !m.selected } : m
    ));
  };

  const handleUpdateMedicine = (id, field, value) => {
    setExtractedMedicines(prev => prev.map(m => 
      m.id === id ? { ...m, [field]: value } : m
    ));
  };

  const handleDeleteMedicine = (id) => {
    setExtractedMedicines(prev => prev.filter(m => m.id !== id));
  };

  const handleAddManual = () => {
    setExtractedMedicines(prev => [...prev, {
      id: `manual_${Date.now()}`,
      name: 'New Medicine',
      dosage: '1 Pill',
      type: 'pill',
      frequency: 'Daily',
      mealTiming: 'anytime',
      reminderTime: '08:00',
      confidence: 100,
      selected: true
    }]);
  };

  const handleImport = async () => {
    const selectedMeds = extractedMedicines.filter(m => m.selected);
    if (selectedMeds.length === 0) {
      toast.error('Please select at least one medication to import');
      return;
    }

    setIsImporting(true);
    try {
      const promises = selectedMeds.map(med => {
        // Exclude UI specific fields like 'selected' and 'confidence'
        const { selected, confidence, id, ...medData } = med;
        return addMedication(user.uid, {
          ...medData,
          taken: false,
          startDate: new Date().toISOString().split('T')[0] // Today
        });
      });
      
      await Promise.all(promises);
      toast.success(`Successfully imported ${selectedMeds.length} medications!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error('Failed to import medications');
      setIsImporting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <PageHeader 
        title="AI Prescription Scanner" 
        description="Extract your medications instantly from a photo of your prescription."
        action={
          <div className="flex items-center gap-2 bg-gradient-to-r from-primary/10 to-accent/10 text-primary px-4 py-2 rounded-full text-sm font-semibold shadow-sm">
            <Sparkles size={16} />
            Powered by AI
          </div>
        }
      />

      <AnimatePresence mode="wait">
        
        {/* IDLE STEP */}
        {step === 'idle' && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-8"
          >
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="flex flex-col items-center justify-center p-8 text-center" hoverable>
                <div className="w-20 h-20 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-6">
                  <Camera size={40} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Use Camera</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                  Take a clear photo of your prescription to scan immediately.
                </p>
                <Button fullWidth onClick={() => setStep('camera')}>
                  Open Camera
                </Button>
              </Card>

              <Card className="p-8">
                <ImageUploader onImageSelected={handleImageSelected} />
              </Card>
            </div>

            <Card>
              <div className="flex items-center gap-2 mb-6">
                <History className="text-primary" />
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Recent Scans</h3>
              </div>
              
              {loadingHistory ? (
                <div className="py-12 flex justify-center"><Loader /></div>
              ) : scanHistory.length === 0 ? (
                <EmptyState 
                  icon={History}
                  title="No scan history"
                  description="Your previous prescription scans will appear here."
                />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {scanHistory.map((scan) => (
                    <div key={scan.id} className="relative aspect-square rounded-xl overflow-hidden group">
                      <img src={scan.imageUrl} alt="Scan" className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex flex-col justify-end p-3">
                        <span className="text-white text-xs font-medium">
                          {new Date(scan.scanDate?.toDate()).toLocaleDateString()}
                        </span>
                        <span className="text-gray-300 text-[10px]">
                          {scan.medicineCount} medicines
                        </span>
                      </div>
                      <button 
                        onClick={() => {
                          if(window.confirm('Delete scan?')) {
                            deleteScanHistory(user.uid, scan.id).then(loadHistory);
                          }
                        }}
                        className="absolute top-2 right-2 bg-red-500/80 text-white p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {/* CAMERA OVERLAY */}
        {step === 'camera' && (
          <CameraCapture 
            onImageCaptured={handleImageSelected} 
            onCancel={() => setStep('idle')} 
          />
        )}

        {/* SCANNING & UPLOADING */}
        {(step === 'uploading' || step === 'scanning') && (
          <motion.div 
            key="scanning"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
          >
            <ScanningAnimation imageUrl={imagePreview} step={step} />
          </motion.div>
        )}

        {/* REVIEW RESULTS */}
        {step === 'review' && (
          <motion.div 
            key="review"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
              <div className="flex items-center gap-3 text-primary">
                <Sparkles size={24} />
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">Extraction Complete</h3>
                  <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Found {extractedMedicines.length} medications
                  </p>
                </div>
              </div>
              <Button onClick={() => setStep('idle')} variant="ghost">Scan Another</Button>
            </div>

            <ExtractedResults 
              medicines={extractedMedicines}
              onToggleSelect={handleToggleSelect}
              onUpdateMedicine={handleUpdateMedicine}
              onDeleteMedicine={handleDeleteMedicine}
            />

            <Button 
              variant="outline" 
              fullWidth 
              className="border-dashed"
              onClick={handleAddManual}
            >
              + Add another medicine manually
            </Button>

            <div className="sticky bottom-4 md:static flex justify-end mt-8 z-10">
              <Button 
                size="lg" 
                onClick={handleImport} 
                isLoading={isImporting}
                className="w-full md:w-auto shadow-2xl"
              >
                Import Selected to Schedule
                <ArrowRight size={20} className="ml-2" />
              </Button>
            </div>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
