import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Plus, CheckCircle2 } from 'lucide-react';
import Button from './Button';

export default function GoogleAccountModal({ isOpen, onClose, onSelectAccount }) {
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  if (!isOpen) return null;

  const defaultAccounts = [
    {
      name: 'Nimesh Kavindya',
      email: 'nimesh2005uni@gmail.com',
      photoURL: 'https://ui-avatars.com/api/?name=Nimesh+Kavindya&background=4285F4&color=fff&size=256&bold=true'
    },
    {
      name: 'Patient Account',
      email: 'patient.care@gmail.com',
      photoURL: 'https://ui-avatars.com/api/?name=Patient+Account&background=0F9D58&color=fff&size=256&bold=true'
    }
  ];

  const handleSelect = (account) => {
    onSelectAccount(account);
    onClose();
  };

  const handleAddCustom = (e) => {
    e.preventDefault();
    if (!customEmail) return;
    const name = customName || customEmail.split('@')[0];
    onSelectAccount({
      name,
      email: customEmail,
      photoURL: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=4285F4&color=fff&size=256&bold=true`
    });
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 dark:border-gray-700"
        >
          {/* Header */}
          <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Sign in with Google</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">Choose an account for MediRemind</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          {/* Account list */}
          <div className="p-6 space-y-3">
            {!showAddForm ? (
              <>
                {defaultAccounts.map((account, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(account)}
                    className="w-full flex items-center space-x-4 p-3 rounded-xl border border-gray-100 dark:border-gray-700 hover:bg-primary/5 hover:border-primary/30 transition-all text-left group"
                  >
                    <div className="w-10 h-10 rounded-full bg-primary/10 text-primary font-bold flex items-center justify-center text-base shrink-0 group-hover:scale-105 transition-transform">
                      {account.name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{account.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{account.email}</p>
                    </div>
                    <CheckCircle2 size={18} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
                ))}

                <button
                  onClick={() => setShowAddForm(true)}
                  className="w-full flex items-center space-x-3 p-3 rounded-xl border border-dashed border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-gray-600 dark:text-gray-300 text-sm font-medium transition-colors"
                >
                  <Plus size={18} className="text-primary" />
                  <span>Use another Google Account</span>
                </button>
              </>
            ) : (
              <form onSubmit={handleAddCustom} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Google Email
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="your.email@gmail.com"
                    value={customEmail}
                    onChange={(e) => setCustomEmail(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    placeholder="Your Name"
                    value={customName}
                    onChange={(e) => setCustomName(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div className="flex space-x-2 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setShowAddForm(false)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button type="submit" className="flex-1">
                    Sign In
                  </Button>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
