// frontend/src/pages/Register.tsx
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import LoadingSpinner from '../components/LoadingSpinner';
import ThemeToggle from '../components/ThemeToggle';

// Define registration step types for clarity in multi-step flow
type RegistrationStep = 'accountType' | 'personalInfo' | 'confirmation';

const Register: React.FC = () => {
  // State for registration form data
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [middleInitial, setMiddleInitial] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [isEmployee, setIsEmployee] = useState(true);

  // UI-related states
  const [currentStep, setCurrentStep] = useState<RegistrationStep>('accountType');
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [emailExists, setEmailExists] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { signUp } = useAuth();
  const { addNotification } = useNotification();

  // Utility to construct full name from input fields
  const getFullName = () => {
    return middleInitial ? `${firstName} ${middleInitial} ${lastName}` : `${firstName} ${lastName}`;
  };

  // Check if email is already in use
  const checkEmailExists = async (email: string) => {
    if (!email || !/\S+@\S+\.\S+/.test(email)) return;

    setIsCheckingEmail(true);
    try {
      const apiUrl = `/api/auth/check-email/${encodeURIComponent(email)}`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      console.log('Response status:', response.status, 'Status text:', response.statusText);

      if (response.ok) {
        const data = await response.json();
        console.log('API response data:', data);
        setEmailExists(data.exists);

        if (data.exists) {
          console.log('Email exists, setting error');
          setErrors(prev => ({ ...prev, email: 'This email is already taken' }));
        } else {
          console.log('Email is available');
          setErrors(prev => {
            const newErrors = { ...prev };
            if (newErrors.email === 'This email is already taken') delete newErrors.email;
            return newErrors;
          });
        }
      }
    } catch (error) {
      console.error('Error checking email:', error);
      addNotification('error', 'Could not connect to the server to verify email. Please try again.');
      setEmailExists(false);
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Debounce utility to limit frequent API calls
  const debounce = (func: Function, delay: number) => {
    let timeoutId: NodeJS.Timeout;
    return (...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    };
  };

  // Debounced email check
  const debouncedCheckEmail = React.useCallback(debounce(checkEmailExists, 500), []);

  // Handle email input change with debounced validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    debouncedCheckEmail(newEmail);
  };

  // Validate personal info step
  const validatePersonalInfo = () => {
    const newErrors: Record<string, string> = {};

    if (!firstName) newErrors.firstName = 'First name is required';
    if (!lastName) newErrors.lastName = 'Last name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Email is invalid';
    else if (emailExists) newErrors.email = 'This email is already taken';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 6) newErrors.password = 'Password must be at least 6 characters';
    if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Validate account details step
  const validateAccountDetails = () => {
    const newErrors: Record<string, string> = {};
    if (isEmployee && !inviteCode) newErrors.inviteCode = 'Invite code is required for team member registration';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Navigate between steps
  const handleNextStep = () => {
    if (currentStep === 'accountType' && validateAccountDetails()) setCurrentStep('personalInfo');
    else if (currentStep === 'personalInfo' && validatePersonalInfo()) setCurrentStep('confirmation');
  };

  const handlePrevStep = () => {
    if (currentStep === 'personalInfo') setCurrentStep('accountType');
    else if (currentStep === 'confirmation') setCurrentStep('personalInfo');
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep !== 'confirmation' || !validatePersonalInfo() || !validateAccountDetails()) return;

    setIsLoading(true);
    try {
      const { error } = await signUp(email, password, getFullName(), isEmployee ? inviteCode : undefined);
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

  // Render step progress indicator
  const renderStepIndicator = () => {
    const steps = [
      { id: 'accountType', label: 'Account Type', step: 1 },
      { id: 'personalInfo', label: 'Personal Info', step: 2 },
      { id: 'confirmation', label: 'Confirmation', step: 3 },
    ];

    const getStepStyles = (stepId: string) => {
      const stepIndex = steps.findIndex(step => step.id === stepId);
      const currentIndex = steps.findIndex(step => step.id === currentStep);
      const isCompleted = currentIndex > stepIndex;
      const isActive = currentStep === stepId;

      return {
        circle: `rounded-full h-10 w-10 flex items-center justify-center transition-all duration-300 
          ${isActive ? 'bg-primary text-white scale-110 shadow-lg' : isCompleted ? 'bg-success text-white' : 'bg-base-300 text-base-content'}`
      };
    };

    return (
      <div className="w-full max-w-3xl mx-auto mb-10 px-4 sm:px-6">
        <div className="flex items-center justify-center">
          <div className="w-full max-w-md flex justify-between">
            {steps.map((step) => (
              <div key={step.id} className="flex flex-col items-center">
                <div className={getStepStyles(step.id).circle}>
                  <span className="font-semibold">{step.step}</span>
                </div>
                <span className="text-xs mt-2 text-center font-medium text-base-content/80">{step.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  // Step 1: Account Type Selection
  const renderAccountTypeStep = () => (
    <>
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">I am registering as:</span>
        </label>
        <div className="flex flex-col gap-2">
          <label className="label cursor-pointer bg-base-200 rounded-lg p-4 hover:bg-base-300 transition-colors">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                className="radio radio-primary"
                checked={!isEmployee}
                onChange={() => setIsEmployee(false)}
              />
              <div>
                <span className="label-text font-medium">Owner</span>
                <p className="text-xs text-base-content/70 mt-1">Business owner with full administrative access</p>
              </div>
            </div>
          </label>
          <label className="label cursor-pointer bg-base-200 rounded-lg p-4 hover:bg-base-300 transition-colors">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                className="radio radio-primary"
                checked={isEmployee}
                onChange={() => setIsEmployee(true)}
              />
              <div>
                <span className="label-text font-medium">Team Member</span>
                <p className="text-xs text-base-content/70 mt-1">Staff access for inventory management (requires invite code)</p>
              </div>
            </div>
          </label>
        </div>
      </div>
      {isEmployee && (
        <div className="form-control mb-4">
          <label className="label">
            <span className="label-text">Invite Code</span>
          </label>
          <input
            type="text"
            placeholder="Enter your invite code"
            className={`input input-bordered w-full ${errors.inviteCode ? 'input-error' : ''}`}
            value={inviteCode}
            onChange={e => setInviteCode(e.target.value)}
          />
          {errors.inviteCode && <span className="text-error text-xs mt-1">{errors.inviteCode}</span>}
          <label className="label">
            <span className="label-text-alt text-info">Team members must have an invite code to register</span>
          </label>
        </div>
      )}
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary flex-1" onClick={handleNextStep}>
          Next
        </button>
      </div>
    </>
  );

  // Step 2: Personal Information Input
  const renderPersonalInfoStep = () => (
    <>
      <div className="form-control mb-4">
        <div className="flex gap-2 mb-2">
          <div className="flex-1">
            <label className="label">
              <span className="label-text">First Name</span>
            </label>
            <input
              type="text"
              placeholder="First name"
              className={`input input-bordered w-full ${errors.firstName ? 'input-error' : ''}`}
              value={firstName}
              onChange={e => setFirstName(e.target.value)}
            />
            {errors.firstName && <span className="text-error text-xs mt-1">{errors.firstName}</span>}
          </div>
          <div className="w-20">
            <label className="label">
              <span className="label-text whitespace-nowrap">M.I.</span>
            </label>
            <input
              type="text"
              placeholder="MI"
              className="input input-bordered w-full"
              value={middleInitial}
              onChange={e => e.target.value.length <= 2 && setMiddleInitial(e.target.value)}
              maxLength={1}
            />
          </div>
        </div>
        <div>
          <label className="label">
            <span className="label-text">Last Name</span>
          </label>
          <input
            type="text"
            placeholder="Last name"
            className={`input input-bordered w-full ${errors.lastName ? 'input-error' : ''}`}
            value={lastName}
            onChange={e => setLastName(e.target.value)}
          />
          {errors.lastName && <span className="text-error text-xs mt-1">{errors.lastName}</span>}
        </div>
      </div>
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Email</span>
        </label>
        <div className="relative">
          <input
            type="email"
            placeholder="email@example.com"
            className={`input input-bordered w-full ${errors.email ? 'input-error' : ''}`}
            value={email}
            onChange={handleEmailChange}
          />
          {isCheckingEmail && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <LoadingSpinner size="xs" />
            </div>
          )}
          {!isCheckingEmail && email && !/\S+@\S+\.\S+/.test(email) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-error" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          )}
          {!isCheckingEmail && email && !/\S+@\S+\.\S+/.test(email) === false && !emailExists && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
        </div>
        {errors.email && <span className="text-error text-xs mt-1">{errors.email}</span>}
      </div>
      <div className="form-control mb-4">
        <label className="label">
          <span className="label-text">Create Password</span>
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            placeholder="••••••"
            className={`input input-bordered w-full ${errors.password ? 'input-error' : ''}`}
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/70 hover:text-primary"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.password && <span className="text-error text-xs mt-1">{errors.password}</span>}
        <label className="label">
          <span className="label-text-alt text-info">Password must be at least 6 characters</span>
        </label>
      </div>
      <div className="form-control mb-6">
        <label className="label">
          <span className="label-text">Confirm Password</span>
        </label>
        <div className="relative">
          <input
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="••••••"
            className={`input input-bordered w-full ${errors.confirmPassword ? 'input-error' : ''}`}
            value={confirmPassword}
            onChange={e => setConfirmPassword(e.target.value)}
          />
          <button
            type="button"
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-base-content/70 hover:text-primary"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          >
            {showConfirmPassword ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            )}
          </button>
        </div>
        {errors.confirmPassword && <span className="text-error text-xs mt-1">{errors.confirmPassword}</span>}
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn btn-outline flex-1" onClick={handlePrevStep}>
          Back
        </button>
        <button type="button" className="btn btn-primary flex-1" onClick={handleNextStep}>
          Next
        </button>
      </div>
    </>
  );

  // Step 3: Confirmation Review
  const renderConfirmationStep = () => (
    <>
      <div className="bg-base-200 p-4 rounded-lg mb-6">
        <h3 className="font-semibold mb-2">Review Your Information</h3>
        <div className="mb-4">
          <h4 className="text-sm font-medium">Personal Information</h4>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-base-content/70">Name:</span>
            <span className="font-medium">{getFullName()}</span>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-base-content/70">Email:</span>
            <span className="font-medium">{email}</span>
          </div>
        </div>
        <div className="mb-4">
          <h4 className="text-sm font-medium">Account Details</h4>
          <div className="flex justify-between items-center text-sm mt-1">
            <span className="text-base-content/70">Password:</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">{showPassword ? password : '••••••'}</span>
              <button
                type="button"
                className="text-base-content/70 hover:text-primary"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>
          <div className="flex justify-between text-sm mt-1">
            <span className="text-base-content/70">Account Type:</span>
            <span className="font-medium">{isEmployee ? 'Team Member' : 'Owner'}</span>
          </div>
          {isEmployee && (
            <div className="flex justify-between text-sm mt-1">
              <span className="text-base-content/70">Invite Code:</span>
              <span className="font-medium">{inviteCode}</span>
            </div>
          )}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" className="btn btn-outline flex-1" onClick={handlePrevStep}>
          Back
        </button>
        <button type="submit" className="btn btn-primary flex-1" disabled={isLoading}>
          {isLoading ? <LoadingSpinner size="sm" /> : 'Create Account'}
        </button>
      </div>
    </>
  );

  // Main component render
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-base-200 px-4 transition-colors duration-200">
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>
      <div className="card w-full max-w-md bg-base-100 shadow-xl transition-colors duration-200">
        <div className="card-body">
          <h2 className="card-title text-2xl font-bold text-center">Create Account</h2>
          {renderStepIndicator()}
          <form onSubmit={handleSubmit}>
            {currentStep === 'accountType' && renderAccountTypeStep()}
            {currentStep === 'personalInfo' && renderPersonalInfoStep()}
            {currentStep === 'confirmation' && renderConfirmationStep()}
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