import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import toast from 'react-hot-toast';
import Logo from '../components/Logo';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';

export default function ForgotPassword() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  
  const { register, handleSubmit, formState: { errors } } = useForm();

  const onSubmit = async (data) => {
    setIsLoading(true);
    try {
      // Clean and fast simulated API resolution under 300ms
      await new Promise((resolve) => setTimeout(resolve, 250));
      setIsSuccess(true);
      toast.success('Password reset email sent! Check your inbox. 📧');
    } catch (err) {
      console.error(err);
      toast.error('Failed to send reset link');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="p-8">
          <div className="flex flex-col items-center mb-6">
            <Logo size="md" className="mb-6" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Reset Password</h2>
            <p className="text-sm text-gray-500 text-center mt-2">
              Enter your email address and we'll send you a link to reset your password.
            </p>
          </div>

          {isSuccess ? (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center space-y-4 py-4"
            >
              <div className="w-16 h-16 bg-green-100 text-success rounded-full flex items-center justify-center mb-2">
                <CheckCircle size={32} />
              </div>
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Check your email</h3>
              <p className="text-sm text-gray-500">
                We've sent password reset instructions to your email address.
              </p>
              <Link to="/" className="w-full mt-4">
                <Button fullWidth variant="primary">
                  Back to Login
                </Button>
              </Link>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                icon={Mail}
                error={errors.email?.message}
                {...register('email', { 
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email address'
                  }
                })}
              />

              <Button 
                type="submit" 
                fullWidth 
                size="lg"
                isLoading={isLoading}
              >
                Send Reset Link
              </Button>

              <div className="text-center pt-4">
                <Link to="/" className="inline-flex items-center text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-primary transition-colors">
                  <ArrowLeft size={16} className="mr-2" />
                  Back to Login
                </Link>
              </div>
            </form>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
