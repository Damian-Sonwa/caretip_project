import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useLocation } from 'react-router';
import { AuthFieldGroup } from './auth/AuthFieldGroup';
import { AuthTrustStrip } from './auth/AuthTrustStrip';
import {
  APP_LOADING_PRIORITY,
  useAppLoadingRegistration,
} from "../context/AppLoadingManager";
import { GlobalAppLoadingHold } from "./GlobalAppLoadingHold";
import { AuthOAuthButtons } from './AuthOAuthButtons';
import { SignInCard2, type AuthRole } from '@/components/ui/sign-in-card-2';
import { useAuth, type UserRole } from '../hooks/useAuth';
import { KeyRound, Eye, EyeOff, Check } from 'lucide-react';
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
  GOOGLE_ACCOUNT_NOT_REGISTERED_CODE,
} from '../lib/api';
import { validateInviteCode } from "../lib/api";
import { logClientError } from '../lib/clientLog';
import {
  caretipBtnPrimaryCompact,
} from '@/lib/caretipButtonSystem';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { getPostAuthRedirect } from '../hooks/useAuth';
import { commitAuthUser, hasClientStoredSession } from '../lib/authUserStore';
import { hasClientSessionHint } from '../lib/authSessionHint';
import {
  AuthErrorSlot,
  AuthFormStatusSlot,
  AuthStableSubmitButton,
} from './auth/AuthFormStability';
import {
  isPublicAuthenticationPath,
  sessionMatchesBusinessStaffAuthTarget,
} from '../lib/authSession';

const ROLE_MISMATCH_TOAST_STYLE = { background: '#000000', color: '#ffffff' } as const;

export type { AuthRole };

const FIELD_CLASS = "caretip-auth-field";
const FIELD_ICON = "caretip-auth-field caretip-auth-field--has-icon";
const FIELD_PASSWORD = "caretip-auth-field caretip-auth-field--password-toggle";

const FIELD = {
  name: 'fullName',
  inviteCode: 'inviteCode',
  email: 'email',
  password: 'password',
  confirmPassword: 'confirmPassword',
} as const;

export function AuthPage() {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const [isLogin, setIsLogin] = useState(() => {
    const sp = new URLSearchParams(location.search);
    if (location.pathname === '/signup') return false;
    if (location.pathname === '/auth' && sp.get('mode') === 'signup') return false;
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
  const { login, register, loginWithOAuth, logout, user, sessionValidated, authStatus, isAuthLoading } = useAuth();
  const authInFlightRef = useRef(false);

  const unlockField = (key: string) => {
    setUnlockedFields((prev) => new Set(prev).add(key));
  };

  const isFieldLocked = (key: string) => !unlockedFields.has(key);

  useEffect(() => {
    const p = location.pathname;
    const sp = new URLSearchParams(location.search);
    if (p === '/signup' || (p === '/auth' && sp.get('mode') === 'signup')) setIsLogin(false);
    else if (p === '/login' || p === '/auth' || p === '/employee/login' || p === '/business/login') {
      setIsLogin(true);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    setUnlockedFields(new Set());
  }, [isLogin, location.pathname]);

  /** Validated session on any auth page → app home (avoids re-sign-in with wrong business/staff lane). */
  useEffect(() => {
    if (!user || !sessionValidated || isSubmitting) return;
    if (!isPublicAuthenticationPath(location.pathname)) return;
    navigate(getPostAuthRedirect(user), { replace: true });
  }, [navigate, sessionValidated, user, location.pathname, isSubmitting]);

  useEffect(() => {
    const p = location.pathname;
    const searchParams = new URLSearchParams(location.search);
    if (p === '/employee/login') {
      setRole('employee');
    } else if (p === '/business/login') {
      setRole('business');
    } else {
      const roleParam = searchParams.get('role');
      if (roleParam === 'employee' || roleParam === 'business') {
        setRole(roleParam as AuthRole);
      }
    }
    const inviteParam = searchParams.get('inviteCode') || searchParams.get('code');
    if (inviteParam && inviteParam.trim().length > 0) {
      setInviteCode(inviteParam.trim());
    }
  }, [location.pathname, location.search]);

  const inviteContextActive = inviteCode.trim().length > 0;

  useEffect(() => {
    if (inviteContextActive) {
      if (role !== "employee") setRole("employee");
      return;
    }
    // Business is the default signup path; sign-in keeps URL role for staff lane.
    if (!isLogin && role !== "business") setRole("business");
  }, [inviteContextActive, role, isLogin]);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setShowResendVerification(false);

    if (user != null && !sessionValidated) return;
    if (user != null && sessionValidated) {
      navigate(getPostAuthRedirect(user), { replace: true });
      return;
    }

    if (!email || !password) {
      setError(t('auth.page.errorBothRequired'));
      return;
    }

    if (!validateEmail(email)) {
      setError(t('auth.page.errorInvalidEmail'));
      return;
    }

    if (!isLogin) {
      if ((role === "employee" || inviteContextActive) && !name) {
        setError(t("auth.page.errorFullName"));
        return;
      }
      if (password !== confirmPassword) {
        setError(t("auth.page.errorPasswordsMismatch"));
        return;
      }
      if (!isPasswordStrong(password)) {
        setError(t("auth.page.errorPasswordWeak"));
        return;
      }
      if ((role === "employee" || inviteContextActive) && !inviteCode.trim()) {
        setError(t("auth.page.errorInviteRequired"));
        return;
      }
    }

    if (authInFlightRef.current) return;
    authInFlightRef.current = true;
    setIsSubmitting(true);

    try {
      if (isLogin) {
        const loggedIn = await login(email, password);
        navigate(getPostAuthRedirect(loggedIn), { replace: true });
      } else {
        const payload = {
          email,
          password,
          name: name.trim() ? name : undefined,
          role: role as 'business' | 'employee',
          inviteCode:
            inviteContextActive || role === "employee" ? inviteCode.trim() : undefined,
        };
        if (inviteContextActive || role === "employee") {
          await validateInviteCode(inviteCode);
        }
        const created = await register(payload);
        toast.success(t('auth.page.toastAccountCreated'), {
          style: ROLE_MISMATCH_TOAST_STYLE,
        });
        navigate(getPostAuthRedirect(created), { replace: true });
      }
    } catch (err) {
      logClientError('AuthPage', err);
      if (isApiRequestError(err) && err.code === EMAIL_NOT_VERIFIED_CODE) {
        // Ensure we don't keep a stale session from a previous login when backend rejects unverified access.
        try {
          localStorage.removeItem("caretip_user");
          localStorage.removeItem("caretip_token");
          window.dispatchEvent(new CustomEvent("caretip-auth-storage-sync"));
        } catch {
          // ignore
        }
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
      setError(t('auth.page.resendNeedPassword'));
      return;
    }
    setResendBusy(true);
    setError('');
    try {
      const loc = i18n.resolvedLanguage?.toLowerCase().startsWith("de") ? "de" : "en";
      const r = await resendVerificationEmailAPI(email.trim(), password, loc);
      toast.success(r.message || t('auth.page.toastResendDefault'), {
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
    const p = location.pathname;
    const base =
      p === '/employee/login'
        ? '/employee/login'
        : p === '/business/login'
          ? '/business/login'
          : nextLogin
            ? '/login'
            : '/signup';
    navigate(base, { replace: true });
    setError('');
    setShowResendVerification(false);
    setEmail('');
    setPassword('');
    setName('');
    setInviteCode('');
    setConfirmPassword('');
    setShowPassword(false);
    setShowConfirmPassword(false);
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
    if (user != null && sessionValidated) {
      navigate(getPostAuthRedirect(user), { replace: true });
      return;
    }
    if (!isLogin && (role === "employee" || inviteContextActive)) {
      if (!name.trim()) {
        setError(t("auth.page.errorFullName"));
        return;
      }
      if (!inviteCode.trim()) {
        setError(t("auth.page.errorInviteRequired"));
        return;
      }
    }
    if (authInFlightRef.current) return;
    authInFlightRef.current = true;
    setIsSubmitting(true);
    setError('');
    setShowResendVerification(false);
    commitAuthUser(null);
    try {
      const loggedIn = await loginWithOAuth("google", idToken, {
        isLogin,
        ...(!isLogin
          ? {
              intendedRole: inviteContextActive ? "employee" : role,
              name: name.trim() ? name.trim() : undefined,
              inviteCode:
                inviteContextActive || role === "employee" ? inviteCode.trim() : undefined,
            }
          : {}),
      });
      navigate(getPostAuthRedirect(loggedIn), { replace: true });
    } catch (err) {
      logClientError('AuthPage.oauth', err);
      if (isApiRequestError(err) && err.code === GOOGLE_ACCOUNT_NOT_REGISTERED_CODE) {
        setIsLogin(false);
        setError(toUserFriendlyMessage(err));
        return;
      }
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
      (inviteContextActive && (!name || !inviteCode)));

  const resumeSessionPending = user != null && !sessionValidated;
  const redirectingAfterAuth =
    Boolean(user) && sessionValidated && isPublicAuthenticationPath(location.pathname);

  const mayRestoreSessionOnAuthPage =
    hasClientStoredSession() || hasClientSessionHint() || user != null;

  const showAuthBlocking =
    (authStatus === "initializing" && mayRestoreSessionOnAuthPage) ||
    redirectingAfterAuth;

  useAppLoadingRegistration("auth-page", APP_LOADING_PRIORITY.AUTH, showAuthBlocking);

  if (showAuthBlocking) {
    return <GlobalAppLoadingHold />;
  }

  const sameLaneValidated =
    user != null &&
    sessionValidated &&
    (isLogin || sessionMatchesBusinessStaffAuthTarget(user.role, role));
  const showSignInForm =
    !user ||
    !sessionValidated ||
    (!isLogin && !sessionMatchesBusinessStaffAuthTarget(user.role, role));
  const showCrossSessionHint =
    !isLogin &&
    user != null &&
    sessionValidated &&
    !sessionMatchesBusinessStaffAuthTarget(user.role, role);

  const sessionRoleLabel =
    user?.role === 'platform_admin' || user?.role === 'admin'
      ? t('auth.page.sessionRolePlatformAdmin')
      : user?.role === 'employee'
        ? t('auth.page.sessionRoleStaff')
        : user?.role === 'business'
          ? t('auth.page.sessionRoleBusiness')
          : user?.role ?? '';

  const crossSessionBanner = showCrossSessionHint ? (
    <div
      className="caretip-auth-notice-banner"
      role="region"
      aria-label={t('auth.page.crossSessionRegionAria')}
    >
      <div className="caretip-auth-notice">
        <p className="font-medium leading-snug">{t('auth.page.crossSessionBody', { role: sessionRoleLabel })}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            disabled={!user}
            onClick={() => user && navigate(getPostAuthRedirect(user), { replace: true })}
            className={cn(caretipBtnPrimaryCompact, "h-9 min-h-9 px-3 text-xs disabled:opacity-50")}
          >
            {t('auth.page.crossSessionContinue')}
          </button>
          <button
            type="button"
            onClick={() => {
              logout();
              setError('');
            }}
            className="inline-flex h-9 min-h-9 items-center justify-center rounded-lg border border-amber-300/80 bg-white px-3 text-xs font-semibold text-amber-950 transition hover:bg-amber-100/80 dark:border-amber-400/40 dark:bg-neutral-900 dark:text-amber-100 dark:hover:bg-neutral-800"
          >
            {t('auth.page.crossSessionSwitch')}
          </button>
        </div>
      </div>
    </div>
  ) : null;

  return (
    <div className="caretip-auth-page relative min-h-[100dvh] overflow-x-hidden font-sans">
        <SignInCard2
          isLogin={isLogin}
          onToggleMode={toggleAuthMode}
          formBusy={isSubmitting}
          sessionActive={sameLaneValidated}
          inviteSignup={inviteContextActive && !isLogin}
          topSlot={crossSessionBanner}
        >
          {showSignInForm ? (
          <form
            onSubmit={handleSubmit}
            aria-busy={isSubmitting || resumeSessionPending}
            className="caretip-auth-form text-neutral-900 dark:text-neutral-100"
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

            <div className={cn("caretip-auth-oauth", isSubmitting && "caretip-auth-oauth--busy")}>
              <AuthOAuthButtons
                isLogin={isLogin}
                role={role}
                formBusy={isSubmitting}
                name={name}
                inviteCode={inviteCode}
                onGoogleCredential={(t) => void runGoogleOAuth(t)}
              />
            </div>

            <div
              className="caretip-auth-oauth-divider relative flex items-center gap-3"
              role="separator"
              aria-label={t('auth.page.dividerEmail')}
            >
              <div className="caretip-auth-divider-line" aria-hidden />
              <span className="caretip-auth-oauth-divider__label">{t('auth.page.dividerEmail')}</span>
              <div className="caretip-auth-divider-line" aria-hidden />
            </div>

            {inviteContextActive && !isLogin ? (
              <div className="caretip-auth-employee-fields">
                <AuthFieldGroup label={t('auth.page.labelFullName')} htmlFor="auth-full-name">
                  <input
                    placeholder={t('auth.page.placeholderFullName')}
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
                </AuthFieldGroup>

                <AuthFieldGroup label={t('auth.page.labelInviteCode')} htmlFor="auth-invite-code">
                  <div className="relative">
                    <KeyRound className="caretip-auth-field-icon" aria-hidden />
                    <input
                      placeholder={t('auth.page.placeholderInviteCode')}
                      type="text"
                      id="auth-invite-code"
                      name={FIELD.inviteCode}
                      autoComplete="off"
                      value={inviteCode}
                      readOnly={isFieldLocked(FIELD.inviteCode)}
                      onFocus={() => unlockField(FIELD.inviteCode)}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className={FIELD_ICON}
                    />
                  </div>
                </AuthFieldGroup>
              </div>
            ) : null}

            <AuthFieldGroup label={t('auth.page.labelEmail')} htmlFor="auth-email">
              <input
                placeholder={t('auth.page.placeholderEmail')}
                type="email"
                id="auth-email"
                name={FIELD.email}
                inputMode="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={FIELD_CLASS}
              />
            </AuthFieldGroup>

            {isLogin ? (
              <AuthFieldGroup label={t('auth.page.labelPassword')} htmlFor="auth-password">
                <div className="relative">
                  <input
                    placeholder={t('auth.page.placeholderPassword')}
                    type={showPassword ? 'text' : 'password'}
                    id="auth-password"
                    name={FIELD.password}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={FIELD_PASSWORD}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="caretip-auth-field-toggle"
                    aria-label={showPassword ? t('auth.page.hidePassword') : t('auth.page.showPassword')}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </AuthFieldGroup>
            ) : (
              <>
                <div className="caretip-auth-signup-password-row">
                  <AuthFieldGroup label={t('auth.page.labelPassword')} htmlFor="auth-password">
                    <div className="relative">
                      <input
                        placeholder={t('auth.page.placeholderPassword')}
                        type={showPassword ? 'text' : 'password'}
                        id="auth-password"
                        name={FIELD.password}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          setShowPasswordChecklist(true);
                        }}
                        onFocus={() => setShowPasswordChecklist(true)}
                        onBlur={() => {
                          if (password.trim() === '') setShowPasswordChecklist(false);
                        }}
                        className={FIELD_PASSWORD}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="caretip-auth-field-toggle"
                        aria-label={showPassword ? t('auth.page.hidePassword') : t('auth.page.showPassword')}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      <div className="caretip-auth-password-meter">
                        <div
                          className="h-full min-w-0 rounded-full transition-all duration-300"
                          style={{
                            width: `${getPasswordStrength(password).score}%`,
                            backgroundColor:
                              getPasswordStrength(password).strength === 'strong'
                                ? '#111827'
                                : getPasswordStrength(password).strength === 'fair'
                                  ? '#e9781c'
                                  : '#6B7280',
                            opacity: getPasswordStrength(password).strength === 'weak' ? 0.45 : 1,
                          }}
                        />
                      </div>
                    </div>
                  </AuthFieldGroup>

                  <AuthFieldGroup label={t('auth.page.labelConfirmPassword')} htmlFor="auth-confirm-password">
                    <div className="relative">
                      <input
                        placeholder={t('auth.page.placeholderConfirmPassword')}
                        type={showConfirmPassword ? 'text' : 'password'}
                        id="auth-confirm-password"
                        name={FIELD.confirmPassword}
                        autoComplete="new-password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className={FIELD_PASSWORD}
                      />
                      <button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        className="caretip-auth-field-toggle"
                        aria-label={
                          showConfirmPassword ? t('auth.page.hidePassword') : t('auth.page.showPassword')
                        }
                      >
                        {showConfirmPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </AuthFieldGroup>
                </div>

                <div
                  className={cn(
                    'caretip-auth-password-rules-slot',
                    !showPasswordChecklist && 'caretip-auth-password-rules-slot--idle',
                  )}
                  aria-hidden={!showPasswordChecklist}
                >
                  <ul className="caretip-auth-password-rules">
                    {[
                      { key: 'minLength', label: t('auth.page.passwordRuleMinLength'), met: getPasswordChecklist(password).minLength },
                      { key: 'upper', label: t('auth.page.passwordRuleUpper'), met: getPasswordChecklist(password).hasUppercase },
                      { key: 'lower', label: t('auth.page.passwordRuleLower'), met: getPasswordChecklist(password).hasLowercase },
                      { key: 'number', label: t('auth.page.passwordRuleNumber'), met: getPasswordChecklist(password).hasNumber },
                      { key: 'special', label: t('auth.page.passwordRuleSpecial'), met: getPasswordChecklist(password).hasSpecial },
                    ].map(({ key, label, met }) => (
                      <li key={key} className={`flex items-center gap-1.5 ${met ? 'text-primary' : ''}`}>
                        <span
                          className={`flex h-3 w-3 flex-shrink-0 items-center justify-center rounded-full ${
                            met ? 'bg-primary text-white' : 'bg-neutral-200 dark:bg-neutral-800'
                          }`}
                        >
                          {met ? <Check className="h-2 w-2" strokeWidth={3} /> : null}
                        </span>
                        {label}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}

            <AuthErrorSlot>{error || null}</AuthErrorSlot>

            <div className="caretip-auth-resend-slot">
              {isLogin && showResendVerification && error ? (
                <AuthStableSubmitButton
                  type="button"
                  variant="secondary"
                  loading={resendBusy}
                  loadingAriaLabel={t('auth.page.resendSending')}
                  disabled={isSubmitting}
                  onClick={() => void handleResendVerification()}
                  className="h-10 min-h-10 text-sm"
                >
                  {t('auth.page.resendVerificationEmail')}
                </AuthStableSubmitButton>
              ) : null}
            </div>

            {isLogin && (
              <div className="flex justify-end pt-0.5">
                <Link
                  to="/forgot-password"
                  className="caretip-auth-inline-link"
                >
                  {t('auth.page.forgotPassword')}
                </Link>
              </div>
            )}

            <AuthStableSubmitButton
              type="submit"
              loading={isSubmitting}
              loadingAriaLabel={isLogin ? t('auth.page.signingIn') : t('auth.page.creatingAccount')}
              disabled={resumeSessionPending || (!isLogin && signUpDisabled)}
              className="disabled:cursor-not-allowed"
            >
              {isLogin ? t('auth.page.signIn') : t('auth.page.createAccount')}
            </AuthStableSubmitButton>

            <AuthFormStatusSlot>
              {isSubmitting
                ? isLogin
                  ? t('auth.page.pleaseWait')
                  : t('auth.page.creatingAccountWait')
                : null}
            </AuthFormStatusSlot>

            <AuthTrustStrip />

            <p className="caretip-auth-form-footer">
              {isLogin ? t('auth.page.footerNoAccount') : t('auth.page.footerHasAccount')}
              <button
                type="button"
                disabled={isSubmitting}
                onClick={toggleAuthMode}
                className="font-semibold text-neutral-900 underline-offset-4 transition-colors hover:text-primary hover:underline disabled:opacity-50 dark:text-neutral-100"
              >
                {isLogin ? t('auth.page.footerSignUp') : t('auth.page.footerSignIn')}
              </button>
            </p>
          </form>
          ) : null}
        </SignInCard2>
    </div>
  );
}
