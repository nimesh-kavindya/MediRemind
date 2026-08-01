import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { motion } from 'framer-motion';
import Logo from '../components/Logo';
import Card from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
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
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <Card className="p-8">
          <div className="flex flex-col items-center mb-8">
            <Logo size="lg" className="mb-2" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Create an Account</h2>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              icon={User}
              error={errors.fullName?.message}
              {...register('fullName', { required: 'Name is required' })}
            />

            <Input
              label="Email"
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

            <Input
              label="Password"
              type="password"
              placeholder="Create a password"
              icon={Lock}
              error={errors.password?.message}
              {...register('password', { 
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters' }
              })}
            />
            
            <Input
              label="Confirm Password"
              type="password"
              placeholder="Confirm your password"
              icon={Lock}
              error={errors.confirmPassword?.message}
              {...register('confirmPassword', { 
                required: 'Please confirm password',
                validate: value => value === password || "The passwords do not match"
              })}
            />

            <Button 
              type="submit" 
              fullWidth 
              size="lg"
              isLoading={isLoading}
              className="mt-4"
            >
              Create Account
            </Button>
          </form>

          <p className="mt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            Already have an account?{' '}
            <Link to="/" className="font-semibold text-primary hover:text-secondary transition-colors">
              Login here
            </Link>
          </p>
        </Card>
      </motion.div>
    </div>
  );
}
