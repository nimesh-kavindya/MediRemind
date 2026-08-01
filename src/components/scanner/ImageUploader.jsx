import { useState, useCallback } from 'react';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from '../../utils';
import toast from 'react-hot-toast';

export default function ImageUploader({ onImageSelected }) {
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = (e) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const processFile = (file) => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type)) {
      toast.error('Unsupported file type. Please upload JPG, PNG, or WEBP.');
      return;
    }
    
    // 10MB limit
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image is too large. Maximum size is 10MB.');
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    onImageSelected(file, previewUrl);
  };

  return (
    <div 
      className={clsx(
        "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-2xl transition-colors",
        dragActive ? "border-primary bg-primary/5" : "border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
      )}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept="image/jpeg, image/png, image/webp"
        onChange={handleChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        title=""
      />
      
      <div className="flex flex-col items-center justify-center text-center p-6 pointer-events-none">
        <div className="w-16 h-16 bg-blue-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4 text-primary">
          <UploadCloud size={32} />
        </div>
        <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
          Upload Prescription
        </h4>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs">
          Drag and drop your image here, or click to browse files
        </p>
        <p className="text-xs text-gray-400 mt-4">
          Supports JPG, PNG, WEBP (Max 10MB)
        </p>
      </div>
    </div>
  );
}
