import { useState, useRef } from "react";
import { motion } from "motion/react";
import { useNavigate, Link } from "react-router";
import { toast } from "sonner";
import { Navigation } from "../../components/Navigation";
import { Footer } from "../../components/Footer";
import { useAuth } from "../../hooks/useAuth";
import { toUserFriendlyMessage } from "../../lib/errorMessages";
import { logClientError } from "../../lib/clientLog";
import { CareTipLogo } from "../../components/CareTipLogo";
import { Eye, EyeOff, Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
function PlatformAdminAuthBackground() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-zinc-950"
      aria-hidden
    >
      {/* Black base + brand orange wash (not white) */}
      <div className="absolute inset-0 bg-gradient-to-b from-orange-950/85 via-zinc-950 to-black" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_100%_70%_at_50%_-25%,hsl(33_82%_48%_/_0.38),transparent_58%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_100%_90%,hsl(33_82%_45%_/_0.14),transparent)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_35%_at_0%_60%,hsl(33_40%_25%_/_0.2),transparent)]" />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)",
          backgroundSize: "56px 56px",
        }}
      />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "180px 180px",
        }}
      />
      <div className="absolute -left-32 top-1/3 h-72 w-72 rounded-full bg-primary/10 blur-[100px]" />
      <div className="absolute -right-24 bottom-1/4 h-80 w-80 rounded-full bg-primary/5 blur-[110px]" />
    </div>
  );
}

export function PlatformAdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const authInFlightRef = useRef(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed || !password) {
      toast.error("Enter your email and password.");
      return;
    }
    if (authInFlightRef.current) return;
    authInFlightRef.current = true;
    setSubmitting(true);
    try {
      await login(trimmed, password, "platform_admin");
      navigate("/platform-admin/dashboard", { replace: true });
    } catch (err) {
      logClientError("PlatformAdminLoginPage", err);
      toast.error(toUserFriendlyMessage(err));
    } finally {
      authInFlightRef.current = false;
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-zinc-950">
      <PlatformAdminAuthBackground />
      <div className="relative z-10 flex flex-1 flex-col">
        <Navigation variant="dark" />
        <main className="flex flex-1 items-center justify-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-md"
          >
            <Card className="border border-white/20 bg-white/[0.97] text-foreground shadow-2xl backdrop-blur-xl ring-1 ring-white/40">
              <CardHeader className="space-y-4 pb-2 text-center sm:text-left">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary sm:mx-0">
                  <ShieldCheck className="h-7 w-7" strokeWidth={1.75} aria-hidden />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-center sm:justify-start">
                    <div className="flex h-12 w-full max-w-[220px] justify-center overflow-visible sm:justify-start">
                      <CareTipLogo size="auth" align="center" layoutIsolatedDouble />
                    </div>
                  </div>
                  <div>
                    <CardTitle className="text-xl font-semibold tracking-tight sm:text-2xl">
                      Platform admin
                    </CardTitle>
                    <CardDescription className="mt-1.5 text-base text-muted-foreground">
                      Sign in with your SuperAdmin credentials. This area is restricted.
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={handleSubmit}
                  aria-busy={submitting}
                  className="space-y-5"
                  method="post"
                  action=""
                  noValidate
                >
                  <div className="space-y-2">
                    <Label htmlFor="platform-admin-email">Work email</Label>
                    <Input
                      id="platform-admin-email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      inputMode="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="you@company.com"
                      className="h-11 border-neutral-200 bg-white shadow-sm"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="platform-admin-password">Password</Label>
                    <div className="relative">
                      <Input
                        id="platform-admin-password"
                        name="password"
                        type={showPassword ? "text" : "password"}
                        autoComplete="current-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 border-neutral-200 bg-white pr-11 shadow-sm"
                        required
                      />
                      <button
                        type="button"
                        tabIndex={-1}
                        onClick={() => setShowPassword((v) => !v)}
                        className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  {submitting && (
                    <p role="status" aria-live="polite" className="text-sm text-muted-foreground">
                      Please wait…
                    </p>
                  )}
                  <Button type="submit" disabled={submitting} className="h-11 w-full text-base font-semibold" size="lg">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                        Signing in…
                      </>
                    ) : (
                      "Sign in"
                    )}
                  </Button>
                </form>
                <p className="mt-6 text-center text-sm text-muted-foreground">
                  <Link to="/login" className="font-medium text-primary underline-offset-4 hover:underline">
                    Business or staff sign-in
                  </Link>
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </main>
        <Footer variant="minimal" surface="dark" />
      </div>
    </div>
  );
}
