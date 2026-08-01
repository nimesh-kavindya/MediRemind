import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, Lock, User, HeartPulse } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [isLoading, setIsLoading] = useState(false);
  const { register: registerUser } = useAuth();
  
  const { register, handleSubmit, watch, formState: { errors } } = useForm();
  
  const password = watch("password");

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await registerUser(data.email, data.password, data.fullName);
    } catch (error) {
      // Error handled by AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <motion.div 
        initial={{ opacity: 0, y: 25, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative"
      >
        {/* Glow halo */}
        <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 opacity-20 blur-xl animate-pulse pointer-events-none" />

        {/* Liquid Glass Container */}
        <div className="relative rounded-3xl bg-white/85 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/20 p-8 sm:p-10 shadow-2xl dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] text-slate-900 dark:text-white transition-colors">
          
          <div className="flex flex-col items-center text-center mb-6">
            <div className="relative mb-3">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 p-0.5 shadow-xl flex items-center justify-center">
                <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-950 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <HeartPulse size={30} className="animate-pulse" />
                </div>
              </div>
            </div>

            <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 dark:from-white dark:via-teal-100 dark:to-teal-300 bg-clip-text text-transparent">
              Create Account
            </h1>
            <p className="text-xs font-semibold text-teal-600 dark:text-teal-200/80 mt-1">
              Join MediRemind to manage your health & medications effortlessly
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Full Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-600 dark:text-teal-400/80">
                  <User size={18} />
                </div>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-slate-100/80 dark:bg-white/5 border border-slate-300/80 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white dark:focus:bg-white/10 transition-all"
                  {...register('fullName', { required: 'Name is required' })}
                />
              </div>
              {errors.fullName && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1 ml-1">{errors.fullName.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-600 dark:text-teal-400/80">
                  <Mail size={18} />
                </div>
                <input
                  type="email"
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-100/80 dark:bg-white/5 border border-slate-300/80 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white dark:focus:bg-white/10 transition-all"
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: 'Invalid email address'
                    }
                  })}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1 ml-1">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-600 dark:text-teal-400/80">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="At least 6 characters"
                  className="w-full pl-10 pr-4 py-3 bg-slate-100/80 dark:bg-white/5 border border-slate-300/80 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white dark:focus:bg-white/10 transition-all"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' }
                  })}
                />
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1 ml-1">{errors.password.message}</p>
              )}
            </div>
            
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 ml-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-600 dark:text-teal-400/80">
                  <Lock size={18} />
                </div>
                <input
                  type="password"
                  placeholder="Re-enter password"
                  className="w-full pl-10 pr-4 py-3 bg-slate-100/80 dark:bg-white/5 border border-slate-300/80 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white dark:focus:bg-white/10 transition-all"
                  {...register('confirmPassword', { 
                    required: 'Please confirm password',
                    validate: value => value === password || "Passwords do not match"
                  })}
                />
              </div>
              {errors.confirmPassword && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1 ml-1">{errors.confirmPassword.message}</p>
              )}
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full mt-2 py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 dark:text-slate-950 shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-600 dark:text-slate-300">
            Already have an account?{' '}
            <Link to="/" className="font-bold text-teal-600 dark:text-teal-300 hover:text-teal-700 dark:hover:text-teal-200 underline underline-offset-4 transition-colors">
              Sign In Here
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

