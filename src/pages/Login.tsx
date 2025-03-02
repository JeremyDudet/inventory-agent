// frontend/src/pages/Login.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotification } from '../context/NotificationContext';
import { useTheme } from '../context/ThemeContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ThemeToggle from '../components/ThemeToggle';


type UserRole = 'staff' | 'manager' | 'inventory-specialist' | 'owner' | 'read-only';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const navigate = useNavigate();
  const { addNotification } = useNotification();

  // Check if user is already logged in
  useEffect(() => {
    const user = localStorage.getItem('user');
    if (user) {
      navigate('/dashboard');
    }
  }, [navigate]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
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
      // For demo purposes, we'll simulate a login
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock successful login
      if (email === 'demo@example.com' && password === 'password') {
        // Store user info in localStorage
        localStorage.setItem('user', JSON.stringify({ 
          email, 
          name: 'Demo User',
          role: 'Manager'
        }));
        
        addNotification('success', 'Login successful!');
        navigate('/dashboard');
      } else {
        addNotification('error', 'Invalid email or password');
      }
    } catch (error) {
      addNotification('error', 'Login failed. Please try again.');
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
          <h2 className="card-title text-2xl font-bold text-center mb-6">Inventory Agent</h2>
          
          <form onSubmit={handleSubmit}>
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
            
            <div className="form-control mb-6">
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
              <label className="label">
                <a href="#" className="label-text-alt link link-hover">Forgot password?</a>
              </label>
            </div>
            
            <div className="form-control">
              <button 
                type="submit" 
                className="btn btn-primary w-full" 
                disabled={isLoading}
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Login'}
              </button>
            </div>
            
            <div className="divider my-6">OR</div>
            
            <div className="text-center text-sm">
              <p>For demo purposes, use:</p>
              <p className="font-mono mt-2">Email: demo@example.com</p>
              <p className="font-mono">Password: password</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login; 