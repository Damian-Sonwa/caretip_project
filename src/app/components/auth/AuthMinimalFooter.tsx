import { useTranslation } from "react-i18next";

const APP_VERSION =
  typeof import.meta.env.VITE_APP_VERSION === "string" && import.meta.env.VITE_APP_VERSION.trim() !== ""
    ? import.meta.env.VITE_APP_VERSION.trim()
    : null;

/** Lightweight auth-page footer — no language switcher, prefetch links, or marketing copy. */
export function AuthMinimalFooter({ surface = "light" }: { surface?: "light" | "dark" }) {
  const { t } = useTranslation();
  const year = new Date().getFullYear();
  const dark = surface === "dark";

  return (
    <footer
      className={
        dark
          ? "mt-auto border-t border-white/10 bg-zinc-950/90 px-4 py-6 text-zinc-400"
          : "mt-auto border-t border-border bg-card/30 px-4 py-6 text-muted-foreground"
      }
    >
      <div className="mx-auto max-w-7xl text-center text-sm">
        <p>{t("footer.copyright", { year })}</p>
        {APP_VERSION ? (
          <p className="mt-1 text-xs opacity-80">{t("footer.version", { version: APP_VERSION })}</p>
        ) : null}
      </div>
    </footer>
  );
}
