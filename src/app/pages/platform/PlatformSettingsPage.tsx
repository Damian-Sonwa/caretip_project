import { motion } from "motion/react";
import { useTranslation } from "react-i18next";
import { Settings } from "lucide-react";

export function PlatformSettingsPage() {
  const { t } = useTranslation();
  return (
    <main className="px-4 lg:px-8 py-8 pb-20">
            <div className="mb-8">
              <h1 className="text-2xl sm:text-3xl font-semibold text-foreground mb-2 flex items-center gap-2">
                <Settings className="w-7 h-7 text-accent" />
                System settings
              </h1>
              <p className="text-muted-foreground max-w-2xl">
                Global platform configuration. Additional controls can be wired here as your operations grow.
              </p>
            </div>
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-6 max-w-xl"
            >
              <p className="text-sm text-muted-foreground">
                {t("admin.platformSettingsPage.cardBody")}
              </p>
            </motion.div>
    </main>
  );
}
