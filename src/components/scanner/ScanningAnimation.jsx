import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';

export default function ScanningAnimation({ imageUrl, step = 'uploading' }) {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let interval;
    if (step === 'uploading') {
      // Simulate fast upload progress
      interval = setInterval(() => {
        setProgress(p => Math.min(p + 15, 100));
      }, 200);
    } else if (step === 'scanning') {
      // Simulate slower scan progress (resets to 0 first)
      setProgress(0);
      interval = setInterval(() => {
        setProgress(p => Math.min(p + 5, 95)); // Holds at 95% until complete
      }, 200);
    }
    
    return () => clearInterval(interval);
  }, [step]);

  return (
    <div className="flex flex-col items-center w-full max-w-md mx-auto py-8">
      <div className="relative w-full aspect-[3/4] max-h-[60vh] rounded-2xl overflow-hidden shadow-2xl mb-8 border-4 border-gray-100 dark:border-gray-800 bg-black">
        {/* Prescription Image Preview */}
        {imageUrl && (
          <img src={imageUrl} alt="Scanning target" className="w-full h-full object-contain opacity-50" />
        )}
        
        {/* Scanner Laser Line (Only during scanning) */}
        {step === 'scanning' && (
          <motion.div 
            className="absolute left-0 right-0 h-1 bg-primary shadow-[0_0_15px_5px_rgba(37,99,235,0.5)] z-10"
            initial={{ top: '0%' }}
            animate={{ top: '100%' }}
            transition={{
              duration: 2,
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear"
            }}
          />
        )}
        
        {/* Pulse Effect */}
        {step === 'scanning' && (
          <motion.div
            className="absolute inset-0 bg-primary/20 pointer-events-none"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0, 0.5, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        )}
      </div>

      <div className="flex flex-col items-center text-center w-full">
        <motion.div 
          animate={{ rotate: step === 'scanning' ? 360 : 0 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
          className="bg-primary/10 p-3 rounded-full text-primary mb-4"
        >
          <Sparkles size={28} />
        </motion.div>
        
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          {step === 'uploading' ? 'Uploading Image...' : 'AI is Scanning Prescription...'}
        </h3>
        
        {/* Progress Bar */}
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2.5 mb-2 overflow-hidden">
          <motion.div 
            className="bg-primary h-2.5 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
        <p className="text-sm font-medium text-gray-500">
          {progress}% Complete
        </p>
      </div>
    </div>
  );
}
