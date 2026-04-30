import { useState, useEffect, useRef } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate, useLocation } from 'react-router';
import { Navigation } from './Navigation';
import { Footer } from './Footer';
import { AuthOAuthButtons } from './AuthOAuthButtons';
import { SignInCard2, type AuthRole } from '@/components/ui/sign-in-card-2';
import { useAuth, type UserRole } from '../hooks/useAuth';
import { Building2, KeyRound, Eye, EyeOff, Check, Loader2 } from 'lucide-react';
import {
  getPasswordChecklist,
  isPasswordStrong,
  getPasswordStrength,
} from '../lib/passwordValidation';
import { toUserFriendlyMessage } from '../lib/errorMessages';
import {
  resendVerificationEmailAPI,
  isApiRequestError,
  EMAIL_NOT_VERIFIED_CODE,
} from '../lib/api';
import { validateInviteCode } from "../lib/api";
import { logClientError } from '../lib/clientLog';
import { toast } from 'sonner';
import { getPostAuthRedirect } from '../hooks/useAuth';

const ROLE_MISMATCH_TOAST_STYLE = { background: '#000000', color: '#ffffff' } as const;

export type { AuthRole };

const FIELD_CLASS =
  "w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 shadow-none transition focus:border-primary focus:outline-none focus:ring-[3px] focus:ring-primary/25 font-['Roboto',ui-sans-serif,system-ui,sans-serif] dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:placeholder:text-neutral-400";

const FIELD_ICON = `${FIELD_CLASS} pl-10`;

const FIELD = {
  name: 'fullName',
  businessName: 'businessName',
  businessType: 'businessType',
  location: 'location',
  inviteCode: 'inviteCode',
  email: 'email',
  password: 'password',
  confirmPassword: 'confirmPassword',
} as const;

export function AuthPage() {
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(() => {
    if (location.pathname === '/signup') return false;
    return true;
  });
  
  // Initialize role from query params or default to 'business'
  const [role, setRole] = useState<AuthRole>(() => {
    const searchParams = new URLSearchParams(location.search);
    const roleParam = searchParams.get('role');
    if (roleParam === 'employee' || roleParam === 'business') {
      return roleParam as AuthRole;
    }
    return 'business';
  });
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [businessLocation, setBusinessLocation] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [showResendVerification, setShowResendVerification] = useState(false);
  const [resendBusy, setResendBusy] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordChecklist, setShowPasswordChecklist] = useState(false);
  const [unlockedFields, setUnlockedFields] = useState<Set<string>>(() => new Set());
  const navigate = useNavigate();
  const { login, register, loginWithOAuth } = useAuth();
  const authInFlightRef = useRef(false);

  const unlockField = (key: string) => {
    setUnlockedFields((prev) => new Set(prev).add(key));
  };

  const isFieldLocked = (key: string) => !unlockedFields.has(key);

  useEffect(() => {
    const p = location.pathname;
    if (p === '/signup') setIsLogin(false);
    else if (p === '/login' || p === '/auth') setIsLogin(true);
  }, [location.pathname]);

  useEffect(() => {
    setUnlockedFields(new Set());
  }, [isLogin, location.pathname]);

  useEffect(() => {
    // Update role from query params when the search string changes
    const searchParams = new URLSearchParams(location.search);
    const roleParam = searchParams.get('role');
    if (roleParam === 'employee' || roleParam === 'business') {
      setRole(roleParam as AuthRole);
    }
    const inviteParam = searchParams.get('inviteCode') || searchParams.get('code');
    if (inviteParam && inviteParam.trim().length > 0) {
      setInviteCode(inviteParam.trim());
    }
  }, [location.search]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowResendVerification(false);

    if (!email || !password) {
      setError('Please enter both email and password.');
      return;
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!isLogin) {
      if (role === 'business') {
        if (!businessName) {
          setError('Please enter your business name.');
          return;
        }
        if (!businessType) {
          setError('Please select a business type.');
          return;
        }
        if (!businessLocation) {
          setError('Please enter your business location.');
          return;
        }
      } else {
        if (!name) {
          setError('Please enter your full name.');
          return;
        }
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match.');
        return;
      }
      if (!isPasswordStrong(password)) {
        setError(
          'Password must have 8+ chars, uppercase, lowercase, number, and special character (e.g. @#$%).'
        );
        return;
      }
      if (role === 'employee' && !inviteCode) {
        setError('Please enter your invite code.');
        return;
      }
    }

    if (authInFlightRef.current) return;
    authInFlightRef.current = true;
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const loggedIn = await login(email, password, role as 'business' | 'employee');
        navigate(getPostAuthRedirect(loggedIn), { replace: true });
      } else {
        const payload = {
          email,
          password,
          name: role === 'employee' ? name : undefined,
          role: role as 'business' | 'employee',
          businessName: role === 'business' ? businessName : undefined,
          businessType: role === 'business' ? businessType : undefined,
          location: role === 'business' ? businessLocation : undefined,
          inviteCode: role === 'employee' ? inviteCode : undefined,
        };
        if (role === "employee") {
          await validateInviteCode(inviteCode);
        }
        const created = await register(payload);
        toast.success("Account created. Check your email to verify your address.", {
          style: ROLE_MISMATCH_TOAST_STYLE,
        });
        navigate(getPostAuthRedirect(created), { replace: true });
      }
    } catch (err) {
      logClientError('AuthPage', err);
      if (isApiRequestError(err) && err.code === EMAIL_NOT_VERIFIED_CODE) {
        setError(err.message);
        setShowResendVerification(err.canResend === true);
        // No session is issued for unverified users; keep them here with resend.
        return;
      }
      setShowResendVerification(false);
      const raw = err instanceof Error ? err.message : String(err);
      const msg = toUserFriendlyMessage(err);
      if (
        raw.includes('does not have Business permissions') ||
        raw.includes('does not have Staff permissions')
      ) {
        toast.error(msg, { style: ROLE_MISMATCH_TOAST_STYLE });
      } else {
        setError(msg);
      }
    } finally {
      authInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim() || !password) {
      setError('Enter your password above, then tap resend. We use it to confirm it’s you.');
      return;
    }
    setResendBusy(true);
    setError('');
    try {
      const r = await resendVerificationEmailAPI(email.trim(), password);
      toast.success(r.message || "We sent a new verification link. Check your inbox.", {
        style: ROLE_MISMATCH_TOAST_STYLE,
      });
    } catch (err) {
      logClientError('AuthPage.resendVerification', err);
      setError(toUserFriendlyMessage(err));
    } finally {
      setResendBusy(false);
    }
  };

  const toggleAuthMode = () => {
    const nextLogin = !isLogin;
    setIsLogin(nextLogin);
    navigate(nextLogin ? '/login' : '/signup', { replace: true });
    setError('');
    setShowResendVerification(false);
    setEmail('');
    setPassword('');
    setName('');
    setBusinessName('');
    setBusinessType('');
    setBusinessLocation('');
    setInviteCode('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
    setShowPasswordChecklist(false);
    setUnlockedFields(new Set());
  };

  const toggleRole = (newRole: AuthRole) => {
    setRole(newRole);
    setError('');
    setName('');
    setBusinessName('');
    setBusinessType('');
    setBusinessLocation('');
    setInviteCode('');
    setShowPasswordChecklist(false);
    setUnlockedFields(new Set());
  };

  const navigateAfterAuth = (r: UserRole) => {
    if (r === 'business') {
      navigate('/dashboard', { replace: true });
    } else if (r === 'platform_admin' || r === 'admin') {
      navigate('/platform-admin/dashboard', { replace: true });
    } else {
      navigate('/employee/dashboard', { replace: true });
    }
  };

  const runGoogleOAuth = async (idToken: string) => {
    if (!isLogin) {
      if (role === 'business') {
        if (!businessName.trim()) {
          setError('Please enter your business name.');
          return;
        }
        if (!businessType.trim()) {
          setError('Please select a business type.');
          return;
        }
        if (!businessLocation.trim()) {
          setError('Please enter your business location.');
          return;
        }
      } else {
        if (!name.trim()) {
          setError('Please enter your full name.');
          return;
        }
        if (!inviteCode.trim()) {
          setError('Please enter your invite code.');
          return;
        }
      }
    }
    if (authInFlightRef.current) return;
    authInFlightRef.current = true;
    setIsSubmitting(true);
    setError('');
    setShowResendVerification(false);
    try {
      const loggedIn = await loginWithOAuth('google', idToken, {
        isLogin,
        intendedRole: role,
        name: role === 'employee' ? name.trim() : undefined,
        businessName: role === 'business' ? businessName.trim() : undefined,
        businessType: role === 'business' ? businessType.trim() : undefined,
        location: role === 'business' ? businessLocation.trim() : undefined,
        inviteCode: role === 'employee' ? inviteCode.trim() : undefined,
      });
      navigate(getPostAuthRedirect(loggedIn), { replace: true });
    } catch (err) {
      logClientError('AuthPage.oauth', err);
      const raw = err instanceof Error ? err.message : String(err);
      const msg = toUserFriendlyMessage(err);
      if (
        raw.includes('does not have Business permissions') ||
        raw.includes('does not have Staff permissions')
      ) {
        toast.error(msg, { style: ROLE_MISMATCH_TOAST_STYLE });
      } else {
        setError(msg);
      }
    } finally {
      authInFlightRef.current = false;
      setIsSubmitting(false);
    }
  };

  const signUpDisabled =
    !isLogin &&
    (!email ||
      !validateEmail(email) ||
      !isPasswordStrong(password) ||
      password !== confirmPassword ||
      (role === 'business' && (!businessName || !businessType || !businessLocation)) ||
      (role === 'employee' && (!name || !inviteCode)));

  return (
    <div className="relative flex min-h-[100dvh] flex-col overflow-x-hidden bg-gray-50 font-['Roboto',ui-sans-serif,system-ui,sans-serif] dark:bg-neutral-950">
      <div className="relative z-10 flex min-h-[100dvh] flex-1 flex-col overflow-x-hidden">
        <Navigation />

        <SignInCard2
          isLogin={isLogin}
          onToggleMode={toggleAuthMode}
          role={role}
          onRoleChange={toggleRole}
          formBusy={isSubmitting}
          className="flex-1"
        >
          <form
            onSubmit={handleSubmit}
            aria-busy={isSubmitting}
            className="flex w-full flex-col gap-4 text-neutral-900 dark:text-neutral-100"
            method="post"
            action=""
            noValidate
          >
            <input
              type="text"
              name="bot_trap"
              tabIndex={-1}
              autoComplete="off"
              aria-hidden
              className="hidden"
              style={{ display: 'none' }}
            />

            {!isLogin && role === 'employee' && (
              <motion.input
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25 }}
                placeholder="Full name"
                type="text"
                id="auth-full-name"
                name={FIELD.name}
                autoComplete="name"
                value={name}
                readOnly={isFieldLocked(FIELD.name)}
                onFocus={() => unlockField(FIELD.name)}
                onChange={(e) => setName(e.target.value)}
                className={FIELD_CLASS}
              />
            )}

            {!isLogin && role === 'business' && (
              <>
                <motion.div
                  key="business"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="relative"
                >
                  <Building2 className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600 dark:text-neutral-400" />
                  <input
                    id="auth-business-name"
                    placeholder="Business name"
                    type="text"
                    name={FIELD.businessName}
                    autoComplete="organization"
                    value={businessName}
                    readOnly={isFieldLocked(FIELD.businessName)}
                    onFocus={() => unlockField(FIELD.businessName)}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className={FIELD_ICON}
                  />
                </motion.div>
                
                <motion.select
                  key="businessType"
                  id="auth-business-type"
                  name={FIELD.businessType}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  value={businessType}
                  onChange={(e) => setBusinessType(e.target.value)}
                  className={FIELD_CLASS}
                >
                  <option value="">Select business type</option>
                  <option value="Restaurant">Restaurant</option>
                  <option value="Salon">Salon</option>
                  <option value="Hotel">Hotel</option>
                  <option value="Spa">Spa</option>
                  <option value="Lounge">Lounge</option>
                  <option value="Cafe">Cafe</option>
                  <option value="Bar">Bar</option>
                  <option value="Other">Other</option>
                </motion.select>
                
                <motion.input
                  id="auth-business-location"
                  key="location"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  placeholder="Business location"
                  type="text"
                  name={FIELD.location}
                  value={businessLocation}
                  onChange={(e) => setBusinessLocation(e.target.value)}
                  className={FIELD_CLASS}
                />
              </>
            )}

            {!isLogin && role === 'employee' && (
              <motion.div
                key="employee"
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                className="relative"
              >
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-600 dark:text-neutral-400" />
                <input
                  placeholder="Invite code"
                  type="text"
                  name={FIELD.inviteCode}
                  autoComplete="off"
                  value={inviteCode}
                  readOnly={isFieldLocked(FIELD.inviteCode)}
                  onFocus={() => unlockField(FIELD.inviteCode)}
                  onChange={(e) => setInviteCode(e.target.value)}
                  className={FIELD_ICON}
                />
              </motion.div>
            )}

            <input
              placeholder="Email"
              type="email"
              id="auth-email"
              name={FIELD.email}
              inputMode="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={FIELD_CLASS}
            />

            <div className="relative">
              <input
                placeholder="Password"
                type={showPassword ? 'text' : 'password'}
                id="auth-password"
                name={FIELD.password}
                autoComplete={isLogin ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (!isLogin) {
                    setShowPasswordChecklist(true);
                  }
                }}
                onFocus={() => {
                  if (!isLogin) {
                    setShowPasswordChecklist(true);
                  }
                }}
                onBlur={() => {
                  if (!isLogin && password.trim() === '') {
                    setShowPasswordChecklist(false);
                  }
                }}
                className={`${FIELD_CLASS} pr-11`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
              {!isLogin && (
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-neutral-200">
                  <div
                    className="h-full min-w-0 rounded-full transition-all duration-300"
                    style={{
                      width: `${getPasswordStrength(password).score}%`,
                      backgroundColor:
                        getPasswordStrength(password).strength === 'strong'
                          ? '#111827'
                          : getPasswordStrength(password).strength === 'fair'
                            ? '#EB992C'
                            : '#6B7280',
                      opacity: getPasswordStrength(password).strength === 'weak' ? 0.45 : 1,
                    }}
                  />
                </div>
              )}
            </div>

            {!isLogin && showPasswordChecklist && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <div className="relative">
                  <input
                    placeholder="Confirm password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="auth-confirm-password"
                    name={FIELD.confirmPassword}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${FIELD_CLASS} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                <ul className="space-y-1 text-[11px] text-neutral-600 dark:text-neutral-400">
                  {[
                    { key: 'minLength', label: 'At least 8 characters', met: getPasswordChecklist(password).minLength },
                    { key: 'upper', label: 'One uppercase letter', met: getPasswordChecklist(password).hasUppercase },
                    { key: 'lower', label: 'One lowercase letter', met: getPasswordChecklist(password).hasLowercase },
                    { key: 'number', label: 'One number', met: getPasswordChecklist(password).hasNumber },
                    { key: 'special', label: 'One special character (@#$%)', met: getPasswordChecklist(password).hasSpecial },
                  ].map(({ key, label, met }) => (
                    <li key={key} className={`flex items-center gap-2 ${met ? 'text-primary' : ''}`}>
                      <span
                        className={`flex h-3.5 w-3.5 flex-shrink-0 items-center justify-center rounded-full ${
                          met ? 'bg-primary text-white' : 'bg-neutral-200 dark:bg-neutral-800'
                        }`}
                      >
                        {met ? <Check className="h-2 w-2" strokeWidth={3} /> : null}
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {!isLogin && !showPasswordChecklist && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-2">
                <div className="relative">
                  <input
                    placeholder="Confirm password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    id="auth-confirm-password"
                    name={FIELD.confirmPassword}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`${FIELD_CLASS} pr-11`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute top-1/2 right-3 -translate-y-1/2 p-1 text-neutral-600 transition-colors hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100"
                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            )}

            {error && (
              <p className="text-sm font-medium text-red-600" role="alert">
                {error}
              </p>
            )}

            {isLogin && showResendVerification && error && (
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  onClick={() => void handleResendVerification()}
                  disabled={resendBusy || isSubmitting}
                  className="inline-flex h-10 w-full items-center justify-center rounded-lg border border-gray-200 bg-white text-sm font-semibold text-neutral-900 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-neutral-800 dark:bg-neutral-900 dark:text-neutral-100 dark:hover:bg-neutral-900/70"
                >
                  {resendBusy ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
                      Sending…
                    </>
                  ) : (
                    'Resend verification email'
                  )}
                </button>
              </div>
            )}

            {isLogin && (
              <div className="flex justify-end pt-0.5">
                <Link
                  to="/forgot-password"
                  className="text-xs font-medium text-neutral-600 transition-colors hover:text-primary dark:text-neutral-400"
                >
                  Forgot password?
                </Link>
              </div>
            )}

            <motion.button
              whileHover={isSubmitting ? undefined : { y: -3 }}
              whileTap={isSubmitting ? undefined : { scale: 0.98 }}
              transition={{ type: 'spring', stiffness: 400, damping: 25 }}
              type="submit"
              disabled={isSubmitting || (!isLogin && signUpDisabled)}
              className="relative mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary text-sm font-semibold text-white shadow-md transition-[box-shadow,transform] hover:shadow-[0_8px_22px_rgba(235,153,44,0.28)] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-white" aria-hidden />
                  {isLogin ? 'Signing in…' : 'Creating account…'}
                </>
              ) : isLogin ? (
                'Sign in'
              ) : (
                'Create account'
              )}
            </motion.button>

            {isSubmitting && (
              <p className="text-center text-[11px] font-medium text-neutral-600 dark:text-neutral-400" role="status">
                {isLogin ? 'Please wait…' : 'Creating your account…'}
              </p>
            )}

            <div className="relative my-1 flex items-center">
              <div className="flex-grow border-t border-neutral-200" />
              <span className="mx-3 text-[11px] font-medium uppercase tracking-wide text-neutral-400">
                or
              </span>
              <div className="flex-grow border-t border-neutral-200" />
            </div>

            <AuthOAuthButtons
              isLogin={isLogin}
              role={role}
              formBusy={isSubmitting}
              name={name}
              businessName={businessName}
              inviteCode={inviteCode}
              onGoogleCredential={(t) => void runGoogleOAuth(t)}
            />

            <p className="pt-1 text-center text-xs text-neutral-600 dark:text-neutral-400">
              {isLogin ? "Don't have an account? " : 'Already have an account? '}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={toggleAuthMode}
                className="font-semibold text-neutral-900 underline-offset-4 transition-colors hover:text-primary hover:underline disabled:opacity-50 dark:text-neutral-100"
              >
                {isLogin ? 'Sign up' : 'Sign in'}
              </button>
            </p>
          </form>
        </SignInCard2>

        <Footer />
      </div>
    </div>
  );
}
