import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router";
import { LayoutDashboard } from "lucide-react";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { fetchBusinessProfile, type BusinessInfo } from "../../lib/api";
import { logClientError } from "../../lib/clientLog";
import { BusinessLogoMark } from "./BusinessLogoMark";
import { cn } from "@/lib/utils";

/**
 * Sticky venue header for all business manager routes: logo + business name (dashboard shell).
 */
export function BusinessShellBar({ className }: { className?: string }) {
  const { t } = useTranslation();
  const { user } = useRequireAuth();
  const [profile, setProfile] = useState<BusinessInfo | null>(null);

  useEffect(() => {
    if (!user?.businessId || user.role !== "business") return;
    let cancelled = false;
    const load = () => {
      void fetchBusinessProfile()
        .then((p) => {
          if (!cancelled) setProfile(p);
        })
        .catch((e) => {
          logClientError("BusinessShellBar", e);
          if (!cancelled) setProfile(null);
        });
    };
    load();
    const onProfileChanged = () => load();
    window.addEventListener("caretip-business-profile-changed", onProfileChanged);
    return () => {
      cancelled = true;
      window.removeEventListener("caretip-business-profile-changed", onProfileChanged);
    };
  }, [user?.businessId, user?.role]);

  const name =
    String(profile?.name ?? user?.businessName ?? "").trim() || t("dashboard.venueDashboardFallback");

  return (
    <header
      className={cn(
        "sticky top-0 z-30 border-b border-border/80 bg-background/95 backdrop-blur-md supports-[backdrop-filter]:bg-background/80",
        className,
      )}
    >
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-4 py-3 sm:px-6">
        <Link
          to="/dashboard"
          className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none ring-offset-background transition hover:bg-muted/60 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BusinessLogoMark
            logoPathOrUrl={profile?.logo}
            businessName={name}
            size="dashboard"
          />
          <div className="min-w-0 flex-1 text-left">
            <p className="truncate text-sm font-semibold text-foreground">{name}</p>
            <p className="truncate text-xs text-muted-foreground">Business dashboard</p>
          </div>
        </Link>
        <Link
          to="/dashboard"
          className="hidden shrink-0 rounded-lg border border-border p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground sm:inline-flex"
          aria-label="Dashboard home"
        >
          <LayoutDashboard className="h-5 w-5" />
        </Link>
      </div>
    </header>
  );
}
