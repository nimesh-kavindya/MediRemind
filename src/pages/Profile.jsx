import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateProfile } from 'firebase/auth';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../utils/firebase';
import toast from 'react-hot-toast';
import PageHeader from '../components/PageHeader';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { User, Mail, Camera } from 'lucide-react';

export default function Profile() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.name || '');
  const [photoURL, setPhotoURL] = useState(user?.photoURL || '');
  const [loading, setLoading] = useState(false);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // Update Firebase Auth
      const authUser = user?.uid ? window.firebaseAuth?.currentUser : null;
      if (authUser) {
        await updateProfile(authUser, { displayName, photoURL });
      }
      
      // Update Firestore
      await updateDoc(doc(db, `users`, user.uid), {
        displayName,
        photoURL
      });

      toast.success('Profile updated successfully!');
      // Note: A real app would refresh the AuthContext user here.
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <PageHeader title="My Profile" />

      <Card>
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex flex-col items-center gap-4">
            <div className="w-32 h-32 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden border-4 border-white dark:border-gray-700 shadow-lg relative group cursor-pointer">
              {photoURL ? (
                <img src={photoURL} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <User size={48} className="text-gray-400" />
              )}
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="text-white" />
              </div>
            </div>
            <span className="text-sm font-medium text-primary">Member since 2026</span>
          </div>

          <form onSubmit={handleUpdate} className="flex-1 space-y-4 w-full">
            <Input
              label="Display Name"
              icon={User}
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Input
              label="Email Address"
              icon={Mail}
              value={user?.email || ''}
              disabled
              className="opacity-60 cursor-not-allowed"
            />
            <Input
              label="Photo URL (Optional)"
              icon={Camera}
              value={photoURL}
              onChange={(e) => setPhotoURL(e.target.value)}
              placeholder="https://example.com/photo.jpg"
            />
            
            <div className="pt-4 flex justify-end">
              <Button type="submit" isLoading={loading}>Save Changes</Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}
