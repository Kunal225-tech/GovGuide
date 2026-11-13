import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck, ShieldAlert } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/types/user';

type LoginMode = 'email' | 'mobile';

export function LoginPage() {
  const { t } = useTranslation();
  const [loginMode, setLoginMode] = useState<LoginMode>('email');

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Shared state
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    general?: string;
  }>({});
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

  const redirectTo: string = (location.state as { from?: string } | null)?.from ?? '/profile';

  const validateEmailForm = () => {
    const newErrors: typeof errors = {};
    let isValid = true;

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
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setInfoMessage(
      'Password reset link will be sent to your registered email address. Feature available via civic helpdesk.'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setInfoMessage(null);

    if (loginMode !== 'email') {
      return;
    }

    if (!validateEmailForm()) return;

    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        login(data.token, data.user as User);
        navigate(redirectTo, { replace: true });
      } else {
        setErrors({ general: data.message || t('auth.login.invalidCredentials', 'Invalid email or password') });
      }
    } catch {
      setErrors({ general: 'Network error. Please make sure the server is running.' });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title={t('auth.login.title', 'Sign In to Citizen Portal')}
      subtitle={t('auth.login.subtitle', 'Access your saved schemes, eligibility reports, and application status.')}
    >
      {/* Segmented Tab: [ Mobile OTP ] | [ Email Login ] (rounded-md, rectangular) */}
      <div
        className="grid grid-cols-2 p-1 bg-stone-100 dark:bg-[#141413] border border-stone-200 dark:border-[#2E2D2A] rounded-md mb-5 text-sm font-semibold select-none"
        role="tablist"
        aria-label="Sign in method options"
      >
        <button
          type="button"
          role="tab"
          id="tab-mobile"
          aria-selected={loginMode === 'mobile'}
          aria-controls="panel-mobile"
          onClick={() => {
            setLoginMode('mobile');
            setErrors({});
            setInfoMessage(null);
          }}
          className={`py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D95D39] text-xs sm:text-sm ${
            loginMode === 'mobile'
              ? 'bg-white dark:bg-[#292826] text-stone-900 dark:text-[#F4F4F0] font-bold border border-stone-200 dark:border-[#D95D39]'
              : 'text-stone-600 dark:text-[#A8A29E] hover:text-stone-900 dark:hover:text-[#F4F4F0]'
          }`}
        >
          <span>Mobile OTP</span>
        </button>

        <button
          type="button"
          role="tab"
          id="tab-email"
          aria-selected={loginMode === 'email'}
          aria-controls="panel-email"
          onClick={() => {
            setLoginMode('email');
            setErrors({});
            setInfoMessage(null);
          }}
          className={`py-2 px-3 rounded-md flex items-center justify-center gap-2 transition-all cursor-pointer focus:outline-none focus:ring-1 focus:ring-[#D95D39] text-xs sm:text-sm ${
            loginMode === 'email'
              ? 'bg-white dark:bg-[#292826] text-stone-900 dark:text-[#F4F4F0] font-bold border border-stone-200 dark:border-[#D95D39]'
              : 'text-stone-600 dark:text-[#A8A29E] hover:text-stone-900 dark:hover:text-[#F4F4F0]'
          }`}
        >
          <span>Email Login</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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

        {/* Success Alert */}
        {successMessage && (
          <div
            role="status"
            className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/60 dark:text-emerald-300 rounded-md text-xs sm:text-sm flex items-start gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <p className="leading-snug">{successMessage}</p>
          </div>
        )}

        {/* Info Alert */}
        {infoMessage && (
          <div
            role="status"
            className="p-3 bg-stone-100 border border-stone-300 text-stone-800 dark:bg-[#1C1B19] dark:border-[#3A3834] dark:text-[#F4F4F0] rounded-md text-xs sm:text-sm flex items-start gap-2.5"
          >
            <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-[#D95D39]" />
            <p className="leading-snug">{infoMessage}</p>
          </div>
        )}

        {/* ----------------- EMAIL TAB PANEL ----------------- */}
        {loginMode === 'email' && (
          <div id="panel-email" role="tabpanel" aria-labelledby="tab-email" className="space-y-4">
            {/* Email Field: No decorative icon inside, clean h-11 rounded-md */}
            <div className="space-y-1.5">
              <label htmlFor="login-email" className="block text-xs sm:text-sm font-semibold text-stone-900 dark:text-[#F4F4F0]">
                Email Address <span className="text-red-500">*</span>
              </label>
              <Input
                id="login-email"
                type="email"
                placeholder="citizen@example.com"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                className={`h-11 px-3 bg-white dark:bg-[#141413] border border-stone-300 dark:border-[#3A3834] rounded-md focus:border-[#1E3A8A] dark:focus:border-[#D95D39] focus:ring-1 focus:ring-[#1E3A8A] dark:focus:ring-[#D95D39] text-stone-900 dark:text-[#F4F4F0] ${
                  errors.email ? 'border-red-500' : ''
                }`}
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
              />
              {errors.email && (
                <p className="text-xs text-red-500 font-medium">{errors.email}</p>
              )}
            </div>

            {/* Password Field with Right-Aligned Forgot Password Link */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label htmlFor="login-password" className="block text-xs sm:text-sm font-semibold text-stone-900 dark:text-[#F4F4F0]">
                  Password <span className="text-red-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs font-semibold text-[#1E3A8A] dark:text-[#D95D39] hover:underline focus:outline-none cursor-pointer"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) setErrors({ ...errors, password: undefined });
                  }}
                  className={`h-11 px-3 pr-10 bg-white dark:bg-[#141413] border border-stone-300 dark:border-[#3A3834] rounded-md focus:border-[#1E3A8A] dark:focus:border-[#D95D39] focus:ring-1 focus:ring-[#1E3A8A] dark:focus:ring-[#D95D39] text-stone-900 dark:text-[#F4F4F0] ${
                    errors.password ? 'border-red-500' : ''
                  }`}
                  autoComplete="current-password"
                  aria-invalid={Boolean(errors.password)}
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
          </div>
        )}

        {/* ----------------- MOBILE / OTP SANDBOX NOTICE ----------------- */}
        {loginMode === 'mobile' && (
          <div id="panel-mobile" role="tabpanel" aria-labelledby="tab-mobile" className="space-y-4 py-2">
            <div
              role="status"
              className="p-4 rounded-md border border-amber-300 dark:border-amber-800/60 bg-amber-50 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200 text-xs sm:text-sm flex items-start gap-3"
            >
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div className="space-y-2.5">
                <p className="font-medium leading-relaxed">
                  Mobile OTP gateway is in sandbox mode. Please sign in using your Email & Password.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setLoginMode('email');
                    setErrors({});
                    setInfoMessage(null);
                  }}
                  className="h-8 text-xs font-semibold border-amber-400 dark:border-amber-700 bg-white dark:bg-[#1C1B19] text-stone-900 dark:text-[#F4F4F0] hover:bg-amber-100 dark:hover:bg-[#292826]"
                >
                  Use Email Login
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Persistent Session Checkbox & Submit Action Button */}
        {loginMode === 'email' && (
          <>
            <div className="flex items-center gap-2 pt-1 select-none">
              <input
                id="remember-device"
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="w-4 h-4 rounded border-stone-300 dark:border-[#3A3834] dark:bg-[#141413] text-[#D95D39] focus:ring-[#D95D39] cursor-pointer"
              />
              <label htmlFor="remember-device" className="text-xs text-stone-600 dark:text-[#A8A29E] font-medium cursor-pointer">
                Remember this device for 30 days
              </label>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-11 rounded-md font-semibold text-white bg-[#1E3A8A] hover:bg-[#172554] dark:bg-[#D95D39] dark:hover:bg-[#C44D2B] shadow-none flex items-center justify-center gap-2 transition-colors !mt-5 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <span>Signing in...</span>
              ) : (
                <span>Sign In to Portal</span>
              )}
              {!isLoading && <ArrowRight className="w-4 h-4" />}
            </Button>
          </>
        )}

        {/* Legal Disclaimer */}
        <p className="text-[11px] text-center text-stone-500 dark:text-[#A8A29E] leading-relaxed pt-1 select-none">
          By signing in, you agree to GovGuide's{' '}
          <Link to="/about#terms" className="underline hover:text-stone-800 dark:hover:text-[#F4F4F0]">
            Terms of Service
          </Link>{' '}
          and{' '}
          <Link to="/about#privacy" className="underline hover:text-stone-800 dark:hover:text-[#F4F4F0]">
            Privacy Policy
          </Link>.
        </p>

        {/* Switcher Footer */}
        <div className="text-center text-xs sm:text-sm text-stone-600 dark:text-[#A8A29E] pt-4 border-t border-stone-200 dark:border-[#2E2D2A] !mt-5">
          New citizen applicant?{' '}
          <Link to="/register" className="font-semibold text-[#1E3A8A] dark:text-[#D95D39] hover:underline">
            Create an Account
          </Link>
        </div>
      </form>
    </AuthLayout>
  );
}
