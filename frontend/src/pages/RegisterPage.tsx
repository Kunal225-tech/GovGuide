import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, AlertCircle, ArrowRight, ShieldAlert } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/types/user';

type RegisterMode = 'email' | 'mobile';

export function RegisterPage() {
  const { t } = useTranslation();
  const [registerMode, setRegisterMode] = useState<RegisterMode>('email');

  // Shared Form Fields
  const [name, setName] = useState('');

  // Email Mode State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    general?: string;
  }>({});

  const navigate = useNavigate();
  const { register } = useAuth();

  const validateEmailForm = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Full legal name is required';
      isValid = false;
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required';
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
      isValid = false;
    }

    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
      isValid = false;
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (registerMode !== 'email') {
      return;
    }

    if (!validateEmailForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.token && data.user) {
          register(data.token, data.user as User);
          navigate('/profile', { replace: true });
        } else {
          navigate('/login', {
            state: { message: 'Citizen registration successful! Please sign in with your account credentials.' },
          });
        }
      } else {
        setErrors({ general: data.message || 'Registration failed. Please check your details and try again.' });
      }
    } catch {
      setErrors({ general: 'Network error. Please make sure the server is running.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.register.title', 'Create Citizen Account')}
      subtitle={t('auth.register.subtitle', 'Build your profile once to unlock automatic eligibility checking for Bihar state and central schemes.')}
    >
      {/* Segmented Tab: [ Mobile OTP ] | [ Email Registration ] (rounded-md) */}
      <div
        className="grid grid-cols-2 p-1 bg-stone-100 dark:bg-[#141413] border border-stone-200 dark:border-[#2E2D2A] rounded-md mb-3 text-sm font-semibold select-none"
        role="tablist"
        aria-label="Registration method options"
      >
        <button
          type="button"
          role="tab"
          id="reg-tab-mobile"
          aria-selected={registerMode === 'mobile'}
          aria-controls="reg-panel-mobile"
          onClick={() => {
            setRegisterMode('mobile');
            setErrors({});
          }}
          className={`py-1.5 px-3 rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D95D39] text-xs sm:text-sm ${
            registerMode === 'mobile'
              ? 'bg-white dark:bg-[#292826] text-stone-900 dark:text-[#F4F4F0] font-bold border border-stone-200 dark:border-[#D95D39]'
              : 'text-stone-600 dark:text-[#A8A29E] hover:text-stone-900 dark:hover:text-[#F4F4F0]'
          }`}
        >
          <span>Mobile OTP</span>
        </button>

        <button
          type="button"
          role="tab"
          id="reg-tab-email"
          aria-selected={registerMode === 'email'}
          aria-controls="reg-panel-email"
          onClick={() => {
            setRegisterMode('email');
            setErrors({});
          }}
          className={`py-1.5 px-3 rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D95D39] text-xs sm:text-sm ${
            registerMode === 'email'
              ? 'bg-white dark:bg-[#292826] text-stone-900 dark:text-[#F4F4F0] font-bold border border-stone-200 dark:border-[#D95D39]'
              : 'text-stone-600 dark:text-[#A8A29E] hover:text-stone-900 dark:hover:text-[#F4F4F0]'
          }`}
        >
          <span>Email Registration</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5" noValidate>
        {/* Error Alert */}
        {errors.general && (
          <div
            role="alert"
            className="p-3 bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/30 dark:border-red-900/60 dark:text-red-400 rounded-md text-xs sm:text-sm flex items-start gap-2.5"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
            <p className="leading-snug">{errors.general}</p>
          </div>
        )}

        {/* Full Name Input (Email Registration) */}
        {registerMode === 'email' && (
          <div className="space-y-1">
          <label htmlFor="register-name" className="block text-xs font-semibold text-stone-900 dark:text-[#F4F4F0]">
            Full Name (as per Aadhaar / Official ID) <span className="text-red-500">*</span>
          </label>
          <Input
            id="register-name"
            type="text"
            placeholder="e.g. Ramesh Kumar"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (errors.name) setErrors({ ...errors, name: undefined });
            }}
            className={`h-10 px-3 bg-white dark:bg-[#141413] border border-stone-300 dark:border-[#3A3834] rounded-md focus:border-[#1E3A8A] dark:focus:border-[#D95D39] focus:ring-1 focus:ring-[#1E3A8A] dark:focus:ring-[#D95D39] text-stone-900 dark:text-[#F4F4F0] text-sm ${
              errors.name ? 'border-red-500' : ''
            }`}
            autoComplete="name"
          />
          {errors.name && (
            <p className="text-xs text-red-500 font-medium">{errors.name}</p>
          )}
          </div>
        )}

        {/* ----------------- EMAIL REGISTRATION FIELDS ----------------- */}
        {registerMode === 'email' && (
          <div id="reg-panel-email" role="tabpanel" aria-labelledby="reg-tab-email" className="space-y-2.5">
            {/* Email Field */}
            <div className="space-y-1">
              <label htmlFor="register-email" className="block text-xs font-semibold text-stone-900 dark:text-[#F4F4F0]">
                Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                id="register-email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className={`h-10 px-3 bg-white dark:bg-[#141413] border border-stone-300 dark:border-[#3A3834] rounded-md focus:border-[#1E3A8A] dark:focus:border-[#D95D39] focus:ring-1 focus:ring-[#1E3A8A] dark:focus:ring-[#D95D39] text-stone-900 dark:text-[#F4F4F0] text-sm ${
                  errors.email ? 'border-red-500' : ''
                }`}
                autoComplete="email"
              />
              {errors.email && (
                <p className="text-xs text-red-500 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Single Vertical Column: Password & Confirm Password (Zero Truncation) */}
            <div className="space-y-2.5">
              {/* Password */}
              <div className="space-y-1">
                <label htmlFor="register-password" className="block text-xs font-semibold text-stone-900 dark:text-[#F4F4F0]">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="register-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="At least 8 characters"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors({ ...errors, password: undefined });
                    }}
                    className={`h-10 px-3 pr-10 bg-white dark:bg-[#141413] border border-stone-300 dark:border-[#3A3834] rounded-md focus:border-[#1E3A8A] dark:focus:border-[#D95D39] focus:ring-1 focus:ring-[#1E3A8A] dark:focus:ring-[#D95D39] text-stone-900 dark:text-[#F4F4F0] text-sm ${
                      errors.password ? 'border-red-500' : ''
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 dark:hover:text-[#F4F4F0] p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-xs text-red-500 font-medium">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label htmlFor="register-confirm-password" className="block text-xs font-semibold text-stone-900 dark:text-[#F4F4F0]">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Input
                    id="register-confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Confirm password"
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: undefined });
                    }}
                    className={`h-10 px-3 pr-10 bg-white dark:bg-[#141413] border border-stone-300 dark:border-[#3A3834] rounded-md focus:border-[#1E3A8A] dark:focus:border-[#D95D39] focus:ring-1 focus:ring-[#1E3A8A] dark:focus:ring-[#D95D39] text-stone-900 dark:text-[#F4F4F0] text-sm ${
                      errors.confirmPassword ? 'border-red-500' : ''
                    }`}
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 hover:text-stone-800 dark:hover:text-[#F4F4F0] p-0.5"
                    aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-xs text-red-500 font-medium">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ----------------- MOBILE REGISTRATION SANDBOX NOTICE ----------------- */}
        {registerMode === 'mobile' && (
          <div id="reg-panel-mobile" role="tabpanel" aria-labelledby="reg-tab-mobile" className="space-y-3 py-2">
            <div
              role="status"
              className="p-4 rounded-md border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-2">
                <p className="font-medium leading-relaxed">
                  Mobile OTP gateway is in sandbox mode. Please sign in using your Email & Password.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setRegisterMode('email');
                    setErrors({});
                  }}
                  className="h-8 text-xs font-semibold border-amber-400 dark:border-amber-700 bg-white dark:bg-[#1C1B19] text-stone-900 dark:text-[#F4F4F0] hover:bg-amber-100 dark:hover:bg-[#292826]"
                >
                  Use Email Registration
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Submit Action Button */}
        {registerMode === 'email' && (
          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-10 rounded-md font-semibold text-white bg-[#1E3A8A] hover:bg-[#172554] dark:bg-[#D95D39] dark:hover:bg-[#C44D2B] shadow-none flex items-center justify-center gap-2 transition-colors !mt-3 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer text-sm"
          >
            {isLoading ? (
              <span>Creating account...</span>
            ) : (
              <span>Create Citizen Account</span>
            )}
            {!isLoading && <ArrowRight className="w-4 h-4" />}
          </Button>
        )}

        {/* Clear Terms & Privacy Policy Note below Submit Button */}
        <p className="text-[10.5px] text-center text-stone-500 dark:text-[#A8A29E] leading-tight pt-1 select-none">
          By creating an account, you agree to GovGuide's{' '}
          <Link to="/about#terms" className="underline hover:text-stone-800 dark:hover:text-[#F4F4F0]">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/about#privacy" className="underline hover:text-stone-800 dark:hover:text-[#F4F4F0]">
            Privacy Policy
          </Link>.
        </p>

        {/* Switcher Footer */}
        <div className="text-center text-xs text-stone-600 dark:text-[#A8A29E] pt-2 border-t border-stone-200 dark:border-[#2E2D2A] !mt-2.5">
          Already have an account?{' '}
          <Link to="/login" className="font-semibold text-[#1E3A8A] dark:text-[#D95D39] hover:underline">
            Sign In here
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
