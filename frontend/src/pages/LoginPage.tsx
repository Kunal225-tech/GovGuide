import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import type { User } from '@/types/user';

type LoginMode = 'email' | 'mobile';

export function LoginPage() {
  const { t } = useTranslation();
  const [loginMode, setLoginMode] = useState<LoginMode>('mobile');

  // Email form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Mobile OTP state
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // Shared state
  const [rememberDevice, setRememberDevice] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    mobile?: string;
    otp?: string;
    general?: string;
  }>({});
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();
  const [successMessage, setSuccessMessage] = useState(location.state?.message || '');

  const redirectTo: string = (location.state as { from?: string } | null)?.from ?? '/profile';

  // Resend countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

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

  const validateMobile = (phone: string) => /^[6-9]\d{9}$/.test(phone);

  const handleSendOtp = () => {
    setSuccessMessage('');
    setInfoMessage(null);

    if (!mobile.trim()) {
      setErrors({ mobile: 'Mobile number is required' });
      return;
    }
    if (!validateMobile(mobile)) {
      setErrors({ mobile: 'Enter a valid 10-digit Indian mobile number (starts with 6-9)' });
      return;
    }

    setErrors({});
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
      setCountdown(30);
      setSuccessMessage(
        `OTP sent to +91 ${mobile.slice(0, 2)}****${mobile.slice(-4)}. For demo verification, enter OTP: 123456`
      );
    }, 600);
  };

  const handleForgotPassword = (e: React.MouseEvent) => {
    e.preventDefault();
    setInfoMessage(
      loginMode === 'mobile'
        ? 'For mobile OTP sign in, no password is needed. Simply request an OTP to access your account.'
        : 'Password reset link will be sent to your registered email address. Feature available via civic helpdesk.'
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setInfoMessage(null);

    if (loginMode === 'email') {
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
    } else {
      // Mobile OTP Flow
      if (!otpSent) {
        handleSendOtp();
        return;
      }

      if (!otp.trim()) {
        setErrors({ otp: 'Please enter the 6-digit OTP' });
        return;
      }
      if (!/^\d{6}$/.test(otp)) {
        setErrors({ otp: 'OTP must be exactly 6 digits' });
        return;
      }

      setIsLoading(true);
      setTimeout(() => {
        setIsLoading(false);
        if (otp === '123456' || /^\d{6}$/.test(otp)) {
          const payload = {
            id: 'citizen_' + mobile,
            name: `Citizen (${mobile.slice(-4)})`,
            email: `${mobile}@citizen.govguide.in`,
            role: 'user' as const,
            exp: Math.floor(Date.now() / 1000) + (rememberDevice ? 30 * 86400 : 86400),
          };
          const base64Url = (obj: object) =>
            btoa(JSON.stringify(obj)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
          const mockJwt = `${base64Url({ alg: 'HS256', typ: 'JWT' })}.${base64Url(payload)}.verified_mobile_otp`;

          login(mockJwt, {
            _id: payload.id,
            name: payload.name,
            email: payload.email,
            role: 'user',
            profile: {},
          });
          navigate(redirectTo, { replace: true });
        } else {
          setErrors({ otp: 'Invalid OTP entered. Please try 123456 for demo verification.' });
        }
      }, 700);
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

        {/* ----------------- MOBILE / OTP TAB PANEL ----------------- */}
        {loginMode === 'mobile' && (
          <div id="panel-mobile" role="tabpanel" aria-labelledby="tab-mobile" className="space-y-4">
            <div className="space-y-1.5">
              <label htmlFor="login-mobile" className="block text-xs sm:text-sm font-semibold text-stone-900 dark:text-[#F4F4F0]">
                10-Digit Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative flex rounded-md">
                <span className="inline-flex items-center px-3.5 rounded-l-md border border-r-0 border-stone-300 dark:border-[#3A3834] bg-stone-100 dark:bg-[#292826] text-sm font-bold text-stone-800 dark:text-[#F4F4F0] select-none">
                  +91
                </span>
                <Input
                  id="login-mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  placeholder="98765 43210"
                  value={mobile}
                  disabled={otpSent && countdown > 0}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 10);
                    setMobile(cleaned);
                    if (errors.mobile) setErrors({ ...errors, mobile: undefined });
                  }}
                  className={`rounded-l-none h-11 px-3 bg-white dark:bg-[#141413] border border-stone-300 dark:border-[#3A3834] font-mono tracking-wider dark:text-[#F4F4F0] ${
                    errors.mobile ? 'border-red-500' : ''
                  }`}
                  autoComplete="tel-national"
                />
              </div>
              {errors.mobile && (
                <p className="text-xs text-red-500 font-medium">{errors.mobile}</p>
              )}
            </div>

            {/* OTP Input */}
            {otpSent && (
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between">
                  <label htmlFor="login-otp" className="block text-xs sm:text-sm font-semibold text-stone-900 dark:text-[#F4F4F0]">
                    Enter 6-Digit OTP <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    disabled={countdown > 0}
                    onClick={handleSendOtp}
                    className="text-xs font-semibold text-[#1E3A8A] dark:text-[#D95D39] hover:underline disabled:text-stone-400 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>
                <Input
                  id="login-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="••••••"
                  value={otp}
                  onChange={(e) => {
                    const cleaned = e.target.value.replace(/\D/g, '').slice(0, 6);
                    setOtp(cleaned);
                    if (errors.otp) setErrors({ ...errors, otp: undefined });
                  }}
                  className="h-11 text-center font-mono text-lg tracking-[0.4em] bg-white dark:bg-[#141413] border border-stone-300 dark:border-[#3A3834] dark:text-[#F4F4F0] rounded-md"
                  autoComplete="one-time-code"
                />
                {errors.otp && (
                  <p className="text-xs text-red-500 font-medium">{errors.otp}</p>
                )}
                <div className="flex items-center justify-between text-[11px] text-stone-500 dark:text-[#A8A29E] pt-0.5">
                  <span>Demo OTP code: 123456</span>
                  <button
                    type="button"
                    onClick={() => {
                       setOtpSent(false);
                       setOtp('');
                    }}
                    className="text-[#1E3A8A] dark:text-[#D95D39] hover:underline"
                  >
                    Change number
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Persistent Session Checkbox */}
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

        {/* Submit Action Button: Warm Terracotta */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-11 rounded-md font-semibold text-white bg-[#1E3A8A] hover:bg-[#172554] dark:bg-[#D95D39] dark:hover:bg-[#C44D2B] shadow-none flex items-center justify-center gap-2 transition-colors !mt-5 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
        >
          {isLoading ? (
            <span>Signing in...</span>
          ) : loginMode === 'mobile' && !otpSent ? (
            <span>Send OTP to Mobile</span>
          ) : loginMode === 'mobile' ? (
            <span>Verify OTP & Sign In</span>
          ) : (
            <span>Sign In to Portal</span>
          )}
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </Button>

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
