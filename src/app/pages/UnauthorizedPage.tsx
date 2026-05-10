import { Link } from "react-router";
import { useTranslation } from "react-i18next";

export function UnauthorizedPage() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        <h1 className="text-2xl font-semibold text-foreground mb-2">{t("auth.unauthorized.title")}</h1>
        <p className="text-muted-foreground mb-6">{t("auth.unauthorized.body")}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link
            to="/"
            className="inline-flex justify-center px-4 py-2 rounded-lg border border-border text-foreground hover:bg-muted"
          >
            {t("auth.unauthorized.home")}
          </Link>
          <Link
            to="/platform-admin/login"
            className="inline-flex justify-center px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary-hover"
          >
            {t("auth.unauthorized.platformLogin")}
          </Link>
        </div>
      </div>
    </div>
  );
}
