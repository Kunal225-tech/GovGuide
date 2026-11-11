import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, EyeOff, AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { AuthLayout } from '@/components/auth/AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type RegisterMode = 'email' | 'mobile';

export function RegisterPage() {
  const { t } = useTranslation();
  const [registerMode, setRegisterMode] = useState<RegisterMode>('mobile');

  // Shared Form Fields
  const [name, setName] = useState('');

  // Email Mode State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Mobile Mode State
  const [mobile, setMobile] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
    mobile?: string;
    otp?: string;
    general?: string;
  }>({});
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const navigate = useNavigate();

  // Resend OTP countdown timer
  useEffect(() => {
    if (countdown <= 0) return;
    const interval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [countdown]);

  const validateMobile = (phone: string) => /^[6-9]\d{9}$/.test(phone);

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

  const handleSendMobileOtp = () => {
    setSuccessNotice(null);

    const newErrors: typeof errors = {};
    let isValid = true;

    if (!name.trim()) {
      newErrors.name = 'Full legal name is required';
      isValid = false;
    }

    if (!mobile.trim()) {
      newErrors.mobile = 'Mobile number is required';
      isValid = false;
    } else if (!validateMobile(mobile)) {
      newErrors.mobile = 'Enter a valid 10-digit Indian mobile number (starts with 6-9)';
      isValid = false;
    }

    if (!isValid) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      setOtpSent(true);
      setCountdown(30);
      setSuccessNotice(
        `OTP sent to +91 ${mobile.slice(0, 2)}****${mobile.slice(-4)}. For demo verification, enter OTP: 123456`
      );
    }, 600);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessNotice(null);

    if (registerMode === 'email') {
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
          navigate('/login', {
            state: { message: 'Citizen registration successful! Please sign in with your account credentials.' },
          });
        } else {
          setErrors({ general: data.message || 'Registration failed. Please check your details and try again.' });
        }
      } catch {
        setErrors({ general: 'Network error. Please make sure the server is running.' });
      } finally {
        setIsLoading(false);
      }
    } else {
      // Mobile OTP Registration
      if (!otpSent) {
        handleSendMobileOtp();
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
          navigate('/login', {
            state: { message: `Mobile registration verified for +91 ${mobile}! Please sign in to access your profile.` },
          });
        } else {
          setErrors({ otp: 'Invalid OTP entered. Please try 123456 for demo verification.' });
        }
      }, 700);
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
            setSuccessNotice(null);
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
            setSuccessNotice(null);
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

        {/* Success Alert */}
        {successNotice && (
          <div
            role="status"
            className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 dark:bg-emerald-950/30 dark:border-emerald-900/60 dark:text-emerald-300 rounded-md text-xs sm:text-sm flex items-start gap-2.5"
          >
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-600" />
            <p className="leading-snug">{successNotice}</p>
          </div>
        )}

        {/* Full Name Input (Stacked vertically, no icons inside) */}
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

        {/* ----------------- MOBILE REGISTRATION FIELDS ----------------- */}
        {registerMode === 'mobile' && (
          <div id="reg-panel-mobile" role="tabpanel" aria-labelledby="reg-tab-mobile" className="space-y-2.5">
            <div className="space-y-1">
              <label htmlFor="register-mobile" className="block text-xs font-semibold text-stone-900 dark:text-[#F4F4F0]">
                10-Digit Mobile Number <span className="text-red-500">*</span>
              </label>
              <div className="relative flex rounded-md">
                <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-stone-300 dark:border-[#3A3834] bg-stone-100 dark:bg-[#292826] text-xs font-bold text-stone-800 dark:text-[#F4F4F0] select-none">
                  +91
                </span>
                <Input
                  id="register-mobile"
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
                  className={`rounded-l-none h-10 px-3 bg-white dark:bg-[#141413] border border-stone-300 dark:border-[#3A3834] font-mono tracking-wider text-sm dark:text-[#F4F4F0] ${
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
              <div className="space-y-1 pt-0.5">
                <div className="flex items-center justify-between">
                  <label htmlFor="register-otp" className="block text-xs font-semibold text-stone-900 dark:text-[#F4F4F0]">
                    Enter 6-Digit OTP <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    disabled={countdown > 0}
                    onClick={handleSendMobileOtp}
                    className="text-xs font-semibold text-[#1E3A8A] dark:text-[#D95D39] hover:underline disabled:text-stone-400 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {countdown > 0 ? `Resend in ${countdown}s` : 'Resend OTP'}
                  </button>
                </div>
                <Input
                  id="register-otp"
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
                  className="h-10 text-center font-mono text-base tracking-[0.4em] bg-white dark:bg-[#141413] border border-stone-300 dark:border-[#3A3834] dark:text-[#F4F4F0] rounded-md"
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

        {/* Submit Action Button: Warm Terracotta */}
        <Button
          type="submit"
          disabled={isLoading}
          className="w-full h-10 rounded-md font-semibold text-white bg-[#1E3A8A] hover:bg-[#172554] dark:bg-[#D95D39] dark:hover:bg-[#C44D2B] shadow-none flex items-center justify-center gap-2 transition-colors !mt-3 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer text-sm"
        >
          {isLoading ? (
            <span>Creating account...</span>
          ) : registerMode === 'mobile' && !otpSent ? (
            <span>Send OTP to Mobile</span>
          ) : registerMode === 'mobile' ? (
            <span>Verify OTP & Register</span>
          ) : (
            <span>Create Citizen Account</span>
          )}
          {!isLoading && <ArrowRight className="w-4 h-4" />}
        </Button>

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
