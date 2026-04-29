import { cn } from "@/lib/utils";
import { Building2, User } from "lucide-react";
import { motion } from "motion/react";
import { CareTipLogo } from "@/app/components/CareTipLogo";

export type AuthRole = "business" | "employee";

const BRAND_IMAGE =
  "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1600&q=80";

export interface AuthSwitchProps {
  isLogin: boolean;
  onToggleMode: () => void;
  role: AuthRole;
  onRoleChange: (role: AuthRole) => void;
  children: React.ReactNode;
  className?: string;
}

/**
 * Login / sign-up shell: brand panel (primary orange) + form column.
 * Form markup (fields, submit) is passed as `children`.
 */
export function AuthSwitch({
  isLogin,
  onToggleMode,
  role,
  onRoleChange,
  children,
  className,
}: AuthSwitchProps) {
  return (
    <main
      className={cn(
        "flex min-h-0 flex-1 flex-col bg-background md:min-h-[calc(100dvh-0px)] md:flex-row",
        className
      )}>
      {/* Brand column */}
      <div className="relative min-h-[200px] w-full overflow-hidden md:min-h-0 md:w-[46%] lg:w-[48%]">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${BRAND_IMAGE})` }}
          aria-hidden
        />
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/88 to-primary/75"
          aria-hidden
        />
        <div className="relative flex h-full min-h-[200px] flex-col justify-end p-8 text-primary-foreground md:justify-center md:p-10 lg:p-14">
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-2 text-xs font-semibold uppercase tracking-[0.2em] text-primary-foreground/90">
            CareTip
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-[2.35rem]">
            Tips without the awkward cash moment.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.12 }}
            className="mt-4 max-w-md text-sm leading-relaxed text-primary-foreground/95 md:text-base">
            QR codes, instant payouts, and happy teams, built for venues that run on gratitude.
          </motion.p>
        </div>
      </div>

      {/* Form column */}
      <div className="flex w-full flex-1 flex-col items-center justify-center px-4 py-10 sm:px-6 md:py-12 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="w-full max-w-md rounded-3xl border border-border/60 bg-card p-6 shadow-[0_10px_30px_rgba(0,0,0,0.06)] sm:p-8">
          <div className="mb-6 flex h-16 w-full justify-center overflow-visible px-2">
            <CareTipLogo size="auth" align="center" layoutIsolatedDouble />
          </div>

          {/* Sign in | Sign up */}
          <div
            className="mb-6 flex rounded-full border border-primary/20 bg-muted/50 p-1"
            role="tablist"
            aria-label="Account mode">
            <button
              type="button"
              role="tab"
              aria-selected={isLogin}
              onClick={() => {
                if (!isLogin) onToggleMode();
              }}
              className={cn(
                "flex-1 rounded-full py-2.5 text-sm font-semibold transition-all",
                isLogin
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted/80"
              )}>
              Sign in
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={!isLogin}
              onClick={() => {
                if (isLogin) onToggleMode();
              }}
              className={cn(
                "flex-1 rounded-full py-2.5 text-sm font-semibold transition-all",
                !isLogin
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "text-muted-foreground hover:bg-muted/80"
              )}>
              Sign up
            </button>
          </div>

          <h2 className="mb-1 text-center text-2xl font-semibold text-foreground sm:text-3xl">
            {isLogin ? "Welcome back" : "Get started"}
          </h2>
          <p className="mb-6 text-center text-sm text-muted-foreground">
            {isLogin ? "Sign in to access CareTip" : "Create your account to start tipping"}
          </p>

          {/* Role */}
          <div className="mb-6 w-full">
            <label className="mb-3 block text-sm font-medium text-foreground">I am a</label>
            <div className="flex overflow-hidden rounded-xl border-2 border-primary/20 bg-muted/50">
              <button
                type="button"
                onClick={() => onRoleChange("business")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all",
                  role === "business"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted/80"
                )}>
                <Building2 className="h-4 w-4 shrink-0" />
                Business
              </button>
              <button
                type="button"
                onClick={() => onRoleChange("employee")}
                className={cn(
                  "flex flex-1 items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-all",
                  role === "employee"
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "text-muted-foreground hover:bg-muted/80"
                )}>
                <User className="h-4 w-4 shrink-0" />
                Staff / Employee
              </button>
            </div>
          </div>

          {children}
        </motion.div>

        <p className="mt-8 text-center text-xs text-muted-foreground">Secure login · Powered by CareTip</p>
      </div>
    </main>
  );
}
