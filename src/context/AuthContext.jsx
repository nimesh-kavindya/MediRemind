import { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../utils/firebase';
import GoogleAccountModal from '../components/GoogleAccountModal';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  useEffect(() => {
    const startTime = Date.now();
    
    const finishLoading = () => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 150 - elapsed);
      setTimeout(() => {
        setLoading(false);
      }, remaining);
    };

    // Check local session first for demo mode or offline persistence
    const savedLocalUser = localStorage.getItem('mediremind_user');
    if (savedLocalUser) {
      try {
        const parsed = JSON.parse(savedLocalUser);
        setUser(parsed);
        setIsAuthenticated(true);
      } catch (e) {
        localStorage.removeItem('mediremind_user');
      }
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
        if (currentUser) {
          const userObj = {
            uid: currentUser.uid,
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email,
            photoURL: currentUser.photoURL
          };
          setUser(userObj);
          setIsAuthenticated(true);
          localStorage.setItem('mediremind_user', JSON.stringify(userObj));
        } else if (!localStorage.getItem('mediremind_user')) {
          setUser(null);
          setIsAuthenticated(false);
        }
        finishLoading();
      }, (err) => {
        console.warn('Firebase auth listener error:', err);
        finishLoading();
      });

      return () => unsubscribe();
    } catch (err) {
      console.warn('Firebase auth unavailable:', err);
      finishLoading();
    }
  }, []);

  const loginDemoUser = (name = 'Demo Patient', email = 'patient@mediremind.com', photoURL = null) => {
    const demoUser = {
      uid: `user_${email.replace(/[^a-zA-Z0-9]/g, '_')}`,
      name: name,
      email: email,
      photoURL: photoURL
    };
    setUser(demoUser);
    setIsAuthenticated(true);
    localStorage.setItem('mediremind_user', JSON.stringify(demoUser));
    toast.success(`Welcome back, ${name}!`);
  };

  const login = async (email, password) => {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      toast.success('Successfully logged in!');
      return userCredential;
    } catch (error) {
      console.error('Firebase login error:', error);
      let msg = 'Failed to log in with Firebase.';
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        msg = 'Invalid email or password.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Invalid email format.';
      } else if (error.message) {
        msg = error.message;
      }
      toast.error(msg);
      throw error;
    }
  };

  const register = async (email, password, name) => {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const u = userCredential.user;
      
      // Update Firebase Auth display name
      try {
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(u, { displayName: name });
      } catch (e) {
        console.warn('Could not update Firebase display name:', e);
      }

      // Create user record in Firestore
      try {
        await setDoc(doc(db, 'users', u.uid), {
          displayName: name,
          email: u.email,
          photoURL: u.photoURL || null,
          createdAt: serverTimestamp()
        });
      } catch (e) {
        console.warn('Firestore setDoc user profile failed:', e);
      }
      
      toast.success('Account created in Firebase!');
      return userCredential;
    } catch (error) {
      console.error('Firebase registration error:', error);
      let msg = 'Failed to create Firebase account.';
      if (error.code === 'auth/email-already-in-use') {
        msg = 'This email is already registered in Firebase. Please login instead.';
      } else if (error.code === 'auth/weak-password') {
        msg = 'Password should be at least 6 characters.';
      } else if (error.code === 'auth/invalid-email') {
        msg = 'Invalid email format.';
      } else if (error.message) {
        msg = error.message;
      }
      toast.error(msg);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    try {
      // Attempt standard Firebase popup login
      const result = await signInWithPopup(auth, googleProvider);
      const u = result.user;
      
      try {
        const userDocRef = doc(db, 'users', u.uid);
        const userDocSnap = await getDoc(userDocRef);
        if (!userDocSnap.exists()) {
          await setDoc(userDocRef, {
            displayName: u.displayName,
            email: u.email,
            photoURL: u.photoURL,
            createdAt: serverTimestamp()
          });
        }
      } catch (e) {
        console.warn('Firestore setDoc google user failed:', e);
      }
      
      toast.success('Successfully logged in with Google!');
      return result;
    } catch (error) {
      console.error('Firebase Google login error:', error);
      if (error.code === 'auth/unauthorized-domain') {
        toast.error('Domain not authorized in Firebase! Please add app domain to Firebase Console.');
      } else if (error.code === 'auth/popup-closed-by-user') {
        toast.error('Google sign-in popup was closed.');
        return;
      } else {
        toast.error(error.message || 'Google sign in failed');
      }
      // Open account modal as fallback if popup fails
      setIsGoogleModalOpen(true);
    }
  };

  const handleSelectGoogleAccount = (account) => {
    loginDemoUser(account.name, account.email, account.photoURL);
    toast.success(`Logged in with Google as ${account.name}`);
  };

  const updateUserProfile = async ({ displayName, photoURL }) => {
    const updated = {
      ...user,
      name: displayName !== undefined ? displayName : user?.name,
      photoURL: photoURL !== undefined ? photoURL : user?.photoURL
    };
    setUser(updated);
    localStorage.setItem('mediremind_user', JSON.stringify(updated));

    try {
      if (auth.currentUser) {
        const { updateProfile } = await import('firebase/auth');
        await updateProfile(auth.currentUser, {
          displayName: updated.name,
          photoURL: updated.photoURL
        });
      }
      if (user?.uid) {
        await updateDoc(doc(db, 'users', user.uid), {
          displayName: updated.name,
          photoURL: updated.photoURL
        });
      }
    } catch (e) {
      console.warn('Firebase profile sync error (local state preserved):', e);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn('Firebase logout error:', error);
    }
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('mediremind_user');
    toast.success('Logged out successfully');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, register, loginWithGoogle, loginDemoUser, updateUserProfile, logout }}>
      {children}
      <GoogleAccountModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onSelectAccount={handleSelectGoogleAccount}
      />
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);


