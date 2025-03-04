// frontend/src/pages/Register.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ThemeToggle from '../components/ThemeToggle';

const Register: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isEmployee, setIsEmployee] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { signUp } = useAuth();
  const { addNotification } = useNotification();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!name) {
      newErrors.name = 'Name is required';
    }
    
    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Email is invalid';
    }
    
    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    // Validate invite code if user is registering as an employee
    if (isEmployee && !inviteCode) {
      newErrors.inviteCode = 'Invite code is required for employee registration';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Only pass invite code if registering as an employee
      const { error } = await signUp(
        email, 
        password, 
        name, 
        isEmployee ? inviteCode : undefined
      );
      
      if (error) {
        addNotification('error', error.message);
        return;
      }
      
      addNotification('success', 'Registration successful! Check your email for confirmation.');
    } catch (error) {
      addNotification('error', 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 px-4 transition-colors duration-200">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="card w-full max-w-md bg-base-100 shadow-xl transition-colors duration-200">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold text-center mb-6">Create Account</h2>
          
          <form onSubmit={handleSubmit}>
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Name</span>
              </label>
              <input
                type="text"
                placeholder="Your full name"
                className={`input input-bordered w-full ${errors.name ? 'input-error' : ''}`}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              {errors.name && <span className="text-error text-xs mt-1">{errors.name}</span>}
            </div>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Email</span>
              </label>
              <input
                type="email"
                placeholder="email@example.com"
                className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              {errors.email && <span className="text-error text-xs mt-1">{errors.email}</span>}
            </div>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••"
                className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              {errors.password && <span className="text-error text-xs mt-1">{errors.password}</span>}
            </div>
            
            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Confirm Password</span>
              </label>
              <input
                type="password"
                placeholder="••••••"
                className={`input input-bordered w-full ${errors.confirmPassword ? 'input-error' : ''}`}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              {errors.confirmPassword && (
                <span className="text-error text-xs mt-1">{errors.confirmPassword}</span>
              )}
            </div>
            
            <div className="form-control mb-4">
              <label className="label cursor-pointer justify-start gap-2">
                <input
                  type="checkbox"
                  className="checkbox checkbox-primary"
                  checked={isEmployee}
                  onChange={(e) => setIsEmployee(e.target.checked)}
                />
                <span className="label-text">I'm registering as an employee (staff or manager)</span>
              </label>
            </div>
            
            {isEmployee && (
              <div className="form-control mb-6">
                <label className="label">
                  <span className="label-text">Invite Code</span>
                </label>
                <input
                  type="text"
                  placeholder="Enter your invite code"
                  className={`input input-bordered w-full ${errors.inviteCode ? 'input-error' : ''}`}
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value)}
                />
                {errors.inviteCode && (
                  <span className="text-error text-xs mt-1">{errors.inviteCode}</span>
                )}
                <label className="label">
                  <span className="label-text-alt text-info">
                    Employees must have an invite code to register
                  </span>
                </label>
              </div>
            )}
            
            <div className="form-control">
              <button 
                type="submit" 
                className="btn btn-primary w-full" 
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Create Account'}
              </button>
            </div>
            
            <div className="text-center mt-4">
              <p className="text-sm">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;