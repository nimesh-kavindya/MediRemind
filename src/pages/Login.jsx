import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff, HeartPulse, Sparkles, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';

export default function Login() {
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const { login, loginWithGoogle, loginDemoUser } = useAuth();
  
  const { register, handleSubmit, formState: { errors } } = useForm({
    defaultValues: {
      email: '',
      password: ''
    }
  });

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      await login(data.email, data.password);
    } catch (error) {
      // Error is handled by toast in AuthContext
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    try {
      await loginWithGoogle();
    } catch (error) {
      // Error handled in AuthContext
    } finally {
      setIsGoogleLoading(false);
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
        {/* Glow halo behind the glass card */}
        <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-teal-500 via-cyan-500 to-emerald-500 opacity-20 blur-xl animate-pulse pointer-events-none" />

        {/* Liquid Glass Card Container */}
        <div className="relative rounded-3xl bg-white/85 dark:bg-slate-900/80 backdrop-blur-2xl border border-slate-200/80 dark:border-white/20 p-8 sm:p-10 shadow-2xl dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)] text-slate-900 dark:text-white transition-colors">
          
          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-8">
            <div className="relative mb-3">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-teal-500 to-cyan-500 p-0.5 shadow-xl flex items-center justify-center">
                <div className="w-full h-full rounded-[14px] bg-white dark:bg-slate-950 flex items-center justify-center text-teal-600 dark:text-teal-400">
                  <HeartPulse size={36} className="animate-pulse" />
                </div>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-teal-700 via-emerald-600 to-cyan-700 dark:from-white dark:via-teal-100 dark:to-teal-300 bg-clip-text text-transparent">
              MediRemind
            </h1>
            
            <p className="text-xs font-semibold text-teal-600 dark:text-teal-300/80 mt-1 uppercase tracking-widest">
              Smart Health & Medication Companion
            </p>
            
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-2 font-medium">
              Never miss your medicine. Stay healthy & on track.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Email Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
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

            {/* Password Field */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-teal-600 dark:text-teal-400/80">
                  <Lock size={18} />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-10 py-3 bg-slate-100/80 dark:bg-white/5 border border-slate-300/80 dark:border-white/15 rounded-xl text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 focus:bg-white dark:focus:bg-white/10 transition-all"
                  {...register('password', { 
                    required: 'Password is required',
                    minLength: { value: 6, message: 'Minimum 6 characters' }
                  })}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 dark:hover:text-white transition-colors"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 dark:text-red-400 mt-1 ml-1">{errors.password.message}</p>
              )}
            </div>

            {/* Remember & Forgot */}
            <div className="flex items-center justify-between text-xs py-1">
              <label className="flex items-center space-x-2 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  className="rounded border-slate-300 dark:border-white/20 bg-slate-100 dark:bg-white/10 text-teal-600 focus:ring-teal-500 accent-teal-600"
                  {...register('rememberMe')}
                />
                <span className="text-slate-600 dark:text-slate-300 font-medium">Remember me</span>
              </label>
              <Link to="/forgot-password" className="text-teal-600 hover:text-teal-700 dark:text-teal-300 dark:hover:text-teal-200 font-semibold transition-colors">
                Forgot Password?
              </Link>
            </div>

            {/* Main Login Button */}
            <button 
              type="submit" 
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-teal-500 via-emerald-500 to-cyan-500 hover:from-teal-400 hover:to-cyan-400 text-slate-950 dark:text-slate-950 shadow-lg shadow-teal-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
              ) : (
                'Sign In to Account'
              )}
            </button>
            
            {/* Google Sign In */}
            <button 
              type="button" 
              onClick={handleGoogleLogin}
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 px-4 rounded-xl font-medium text-sm bg-slate-100 hover:bg-slate-200/80 dark:bg-white/10 dark:hover:bg-white/15 border border-slate-300/80 dark:border-white/20 text-slate-800 dark:text-white transition-all flex items-center justify-center gap-2.5 active:scale-[0.98] disabled:opacity-50"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              <span>{isGoogleLoading ? 'Connecting...' : 'Continue with Google'}</span>
            </button>

            {/* Quick Demo Mode Button */}
            <button 
              type="button" 
              onClick={() => loginDemoUser('Demo Patient', 'demo@mediremind.com')}
              className="w-full py-2.5 px-4 rounded-xl font-medium text-xs text-teal-700 dark:text-teal-300 hover:text-teal-800 dark:hover:text-white bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 transition-all flex items-center justify-center gap-1.5"
            >
              <Sparkles size={14} className="text-teal-600 dark:text-teal-400" />
              <span>Quick Demo Patient Access</span>
            </button>
          </form>

          {/* Footer link */}
          <div className="mt-8 pt-6 border-t border-slate-200/80 dark:border-white/10 text-center text-xs text-slate-600 dark:text-slate-300">
            Don't have an account?{' '}
            <Link to="/register" className="font-bold text-teal-600 dark:text-teal-300 hover:text-teal-700 dark:hover:text-teal-200 underline underline-offset-4 transition-colors">
              Create New Account
            </Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

