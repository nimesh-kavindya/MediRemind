import { useState, useRef, useCallback, useEffect } from 'react';
import { Camera, RefreshCw, X, Check } from 'lucide-react';
import Button from '../Button';
import toast from 'react-hot-toast';

export default function CameraCapture({ onImageCaptured, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // environment (back) or user (front)
  const [capturedImage, setCapturedImage] = useState(null);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode }
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsCameraActive(true);
      }
    } catch (error) {
      toast.error('Camera permission denied or not available');
      onCancel();
    }
  }, [facingMode, onCancel]);

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      setIsCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);
    stopCamera();
  };

  const retakePhoto = () => {
    setCapturedImage(null);
    startCamera();
  };

  const confirmPhoto = async () => {
    // Convert data URL to File object
    const res = await fetch(capturedImage);
    const blob = await res.blob();
    const file = new File([blob], `capture_${Date.now()}.jpg`, { type: 'image/jpeg' });
    onImageCaptured(file, capturedImage);
  };

  const toggleCamera = () => {
    setFacingMode(prev => prev === 'environment' ? 'user' : 'environment');
    startCamera();
  };

  // Auto-start camera when mounted
  useEffect(() => {
    startCamera();
    return () => stopCamera();
  }, [startCamera]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col">
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {capturedImage ? (
          <img src={capturedImage} alt="Captured" className="w-full h-full object-contain" />
        ) : (
          <video 
            ref={videoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
        )}

        {/* Overlay UI */}
        <div className="absolute top-4 right-4 flex gap-4">
          {!capturedImage && (
            <button 
              onClick={toggleCamera}
              className="bg-black/50 text-white p-3 rounded-full backdrop-blur-md hover:bg-black/70 transition"
            >
              <RefreshCw size={24} />
            </button>
          )}
          <button 
            onClick={() => { stopCamera(); onCancel(); }}
            className="bg-black/50 text-white p-3 rounded-full backdrop-blur-md hover:bg-black/70 transition"
          >
            <X size={24} />
          </button>
        </div>
      </div>

      <div className="bg-gray-900 p-8 pb-safe flex justify-center items-center gap-8 h-32">
        {capturedImage ? (
          <>
            <Button variant="ghost" className="text-white hover:bg-gray-800" onClick={retakePhoto}>
              Retake
            </Button>
            <button 
              onClick={confirmPhoto}
              className="bg-primary text-white w-16 h-16 rounded-full flex items-center justify-center hover:bg-primary/90 transition shadow-lg shadow-primary/30"
            >
              <Check size={32} />
            </button>
            <div className="w-20"></div> {/* Spacer for centering */}
          </>
        ) : (
          <button 
            onClick={capturePhoto}
            className="w-20 h-20 rounded-full border-4 border-white p-1"
          >
            <div className="w-full h-full bg-white rounded-full transition-transform active:scale-95"></div>
          </button>
        )}
      </div>
    </div>
  );
}
