import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { Search, X } from "lucide-react";
import { useNavigate } from "react-router";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";

type DashboardHeaderSearchContextValue = {
  mobileOpen: boolean;
  setMobileOpen: (open: boolean) => void;
  isPlatformAdmin: boolean;
};

const DashboardHeaderSearchContext = createContext<DashboardHeaderSearchContextValue | null>(null);

function useDashboardHeaderSearch() {
  const ctx = useContext(DashboardHeaderSearchContext);
  if (!ctx) {
    throw new Error("DashboardHeaderSearch components must be used within DashboardHeaderSearchProvider");
  }
  return ctx;
}

const inputClassName =
  "w-full min-w-0 rounded-lg border border-border bg-input-background py-2 pl-10 pr-3 text-sm transition-all focus:border-transparent focus:outline-none focus:ring-2 focus:ring-accent";

type DashboardHeaderSearchProviderProps = {
  isPlatformAdmin?: boolean;
  children: ReactNode;
};

export function DashboardHeaderSearchProvider({
  isPlatformAdmin = false,
  children,
}: DashboardHeaderSearchProviderProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <DashboardHeaderSearchContext.Provider value={{ mobileOpen, setMobileOpen, isPlatformAdmin }}>
      {children}
    </DashboardHeaderSearchContext.Provider>
  );
}

export function DashboardHeaderSearchDesktop({ className }: { className?: string }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isPlatformAdmin } = useDashboardHeaderSearch();

  const handleSubmit = (raw: string) => {
    const q = raw.trim();
    navigate(q ? `/faq?q=${encodeURIComponent(q)}` : "/faq");
  };

  return (
    <form
      className={cn(
        "caretip-dashboard-header-search relative hidden min-w-0 lg:block",
        isPlatformAdmin ? "flex-1 lg:max-w-md" : "w-full max-w-md flex-1",
        className,
      )}
      role="search"
      onSubmit={(e) => {
        e.preventDefault();
        const fd = new FormData(e.currentTarget);
        handleSubmit(String(fd.get("q") ?? ""));
      }}
    >
      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <input
        name="q"
        type="search"
        enterKeyHint="search"
        placeholder={t("shell.header.searchPlaceholder")}
        autoComplete="off"
        aria-label={t("shell.header.searchAria")}
        className={inputClassName}
      />
    </form>
  );
}

export function DashboardHeaderSearchMobileToggle() {
  const { t } = useTranslation();
  const { mobileOpen, setMobileOpen } = useDashboardHeaderSearch();

  return (
    <button
      type="button"
      className={cn(
        "caretip-dashboard-header-icon-btn caretip-dashboard-header-search-toggle lg:hidden",
        mobileOpen && "bg-muted",
      )}
      onClick={() => setMobileOpen(!mobileOpen)}
      aria-label={mobileOpen ? t("shell.header.searchCloseAria") : t("shell.header.searchAria")}
      aria-expanded={mobileOpen}
    >
      {mobileOpen ? (
        <X className="h-4 w-4 text-foreground" aria-hidden />
      ) : (
        <Search className="h-4 w-4 text-foreground" aria-hidden />
      )}
    </button>
  );
}

export function DashboardHeaderSearchPanel() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { mobileOpen, setMobileOpen } = useDashboardHeaderSearch();
  const mobileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!mobileOpen) return;
    const id = window.requestAnimationFrame(() => mobileInputRef.current?.focus());
    return () => window.cancelAnimationFrame(id);
  }, [mobileOpen]);

  if (!mobileOpen) return null;

  return (
    <div className="caretip-dashboard-header-search-panel border-t border-border/80 bg-background px-3 py-2.5 lg:hidden">
      <form
        role="search"
        className="relative min-w-0"
        onSubmit={(e) => {
          e.preventDefault();
          const fd = new FormData(e.currentTarget);
          const q = String(fd.get("q") ?? "").trim();
          navigate(q ? `/faq?q=${encodeURIComponent(q)}` : "/faq");
          setMobileOpen(false);
        }}
      >
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          ref={mobileInputRef}
          name="q"
          type="search"
          enterKeyHint="search"
          placeholder={t("shell.header.searchPlaceholder")}
          autoComplete="off"
          aria-label={t("shell.header.searchAria")}
          className={cn(inputClassName, "py-2.5")}
        />
      </form>
    </div>
  );
}
