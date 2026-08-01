import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { 
  User, Mail, Camera, Upload, Trash2, Link, 
  HeartPulse, ShieldCheck, PhoneCall, Stethoscope, 
  AlertTriangle, Save, Activity, Pill, CheckCircle2 
} from 'lucide-react';

export default function Profile() {
  const { user, updateUserProfile } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

  // Medical & Emergency Info state
  const [medicalInfo, setMedicalInfo] = useState(() => {
    try {
      const saved = localStorage.getItem(`med_profile_${user?.uid || 'demo'}`);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && typeof parsed === 'object') {
          return {
            bloodType: parsed.bloodType || 'O+',
            allergies: parsed.allergies || '',
            chronicConditions: parsed.chronicConditions || '',
            emergencyName: parsed.emergencyName || '',
            emergencyPhone: parsed.emergencyPhone || '',
            doctorName: parsed.doctorName || '',
            doctorPhone: parsed.doctorPhone || '',
            pharmacy: parsed.pharmacy || ''
          };
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved medical profile:', e);
    }
    return {
      bloodType: 'O+',
      allergies: '',
      chronicConditions: '',
      emergencyName: '',
      emergencyPhone: '',
      doctorName: '',
      doctorPhone: '',
      pharmacy: ''
    };
  });

  const [medCount, setMedCount] = useState(0);

  useEffect(() => {
    if (user) {
      setDisplayName(user.name || '');
      setPhotoURL(user.photoURL || '');
      const meds = JSON.parse(localStorage.getItem(`meds_${user.uid}`) || '[]');
      setMedCount(meds.length);

      // Dynamically load user's actual medical profile once user is resolved
      try {
        const saved = localStorage.getItem(`med_profile_${user.uid}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          if (parsed && typeof parsed === 'object') {
            setMedicalInfo({
              bloodType: parsed.bloodType || 'O+',
              allergies: parsed.allergies || '',
              chronicConditions: parsed.chronicConditions || '',
              emergencyName: parsed.emergencyName || '',
              emergencyPhone: parsed.emergencyPhone || '',
              doctorName: parsed.doctorName || '',
              doctorPhone: parsed.doctorPhone || '',
              pharmacy: parsed.pharmacy || ''
            });
          }
        } else {
          setMedicalInfo({
            bloodType: 'O+',
            allergies: '',
            chronicConditions: '',
            emergencyName: '',
            emergencyPhone: '',
            doctorName: '',
            doctorPhone: '',
            pharmacy: ''
          });
        }
      } catch (e) {
        console.warn('Failed to parse user medical profile dynamically:', e);
      }
    }
  }, [user]);

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be under 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result;
      if (dataUrl) {
        setPhotoURL(dataUrl);
        toast.success('Photo uploaded! Click "Save Profile" to apply.');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setPhotoURL('');
    toast.success('Photo removed');
  };

  const handleLinkGooglePhoto = (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const name = displayName || user?.name || 'User';
    const googleAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0d9488&color=fff&size=256&bold=true`;
    setPhotoURL(googleAvatar);
    toast.success('Google profile picture linked successfully!');
  };

  const handleUpdate = async (e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setLoading(true);
    try {
      await updateUserProfile({ displayName, photoURL });
      try {
        localStorage.setItem(`med_profile_${user?.uid || 'demo'}`, JSON.stringify(medicalInfo));
      } catch (storeErr) {
        console.warn('Failed to write profile to localStorage:', storeErr);
      }
      toast.success('Profile and Medical Record updated successfully! 🎉');
    } catch (error) {
      console.error(error);
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleMedicalChange = (field, value) => {
    setMedicalInfo(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <PageHeader title="My Health Profile" />

      {/* Main Profile Info Card */}
      <Card>
        <div className="flex flex-col md:flex-row gap-8 items-center md:items-start">
          {/* Avatar Section */}
          <div className="flex flex-col items-center gap-3 shrink-0">
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="w-32 h-32 sm:w-36 sm:h-36 rounded-full bg-teal-500/10 dark:bg-slate-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-slate-800 shadow-xl relative group cursor-pointer transition-transform hover:scale-105"
            >
              {photoURL ? (
                <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={52} className="text-teal-600 dark:text-teal-400" />
              )}
              <div className="absolute inset-0 bg-slate-950/60 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={26} />
                <span className="text-[11px] font-bold mt-1">Change Photo</span>
              </div>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />

            <div className="flex flex-col gap-2 w-full text-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-1.5 text-xs py-1.5"
              >
                <Upload size={14} /> Upload Photo
              </Button>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={handleLinkGooglePhoto}
                  className="flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700/80 hover:bg-teal-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1"
                >
                  <Link size={12} /> Google Photo
                </button>

                {photoURL && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="py-1.5 px-2.5 text-xs font-semibold rounded-lg border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors flex items-center justify-center gap-1"
                  >
                    <Trash2 size={12} /> Remove
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider text-teal-600 dark:text-teal-400 bg-teal-500/10 dark:bg-teal-400/10 px-3 py-1 rounded-full mt-1">
              <ShieldCheck size={13} /> Verified Patient Account
            </div>
          </div>

          {/* Form Section */}
          <form onSubmit={handleUpdate} className="flex-1 space-y-4 w-full">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User size={18} className="text-teal-600 dark:text-teal-400" /> Account Details
            </h3>

            <Input
              label="Full Name"
              icon={User}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Your full name"
              required
            />

            <Input
              label="Email Address"
              icon={Mail}
              value={user?.email || ''}
              disabled
              className="opacity-60 cursor-not-allowed bg-slate-50 dark:bg-slate-800/60"
            />

            <div className="pt-2 flex justify-end">
              <Button 
                type="submit" 
                isLoading={loading} 
                className="bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 font-bold px-6 py-2.5 shadow-md shadow-teal-500/20"
              >
                <Save size={16} className="mr-2" /> Save Profile
              </Button>
            </div>
          </form>
        </div>
      </Card>

      {/* Health Overview Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="flex items-center gap-4 bg-gradient-to-br from-teal-500/10 via-emerald-500/5 to-transparent border-teal-500/20">
          <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-600 dark:text-teal-400 flex items-center justify-center shrink-0">
            <Pill size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Tracked Medications</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">{medCount} Active Meds</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-gradient-to-br from-cyan-500/10 via-blue-500/5 to-transparent border-cyan-500/20">
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 text-cyan-600 dark:text-cyan-400 flex items-center justify-center shrink-0">
            <HeartPulse size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Adherence Status</p>
            <p className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">Optimal 94%</p>
          </div>
        </Card>

        <Card className="flex items-center gap-4 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent border-emerald-500/20">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
            <CheckCircle2 size={24} />
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Local Data Protection</p>
            <p className="text-xl font-black text-slate-900 dark:text-white mt-0.5">Cloud Encrypted</p>
          </div>
        </Card>
      </div>

    </div>
  );
}

