import { Link } from "react-router";
import { Mail, MessageSquare, Phone, MapPin } from "lucide-react";
import { useTranslation } from "react-i18next";
import { PublicPageShell } from "@/components/public/PublicPageShell";
import { PublicPageHeader } from "@/components/public/PublicPageHeader";
import { publicPageUi } from "@/components/public/publicPageUi";
import { cn } from "@/lib/utils";

export function ContactPage() {
  const { t } = useTranslation();

  return (
    <PublicPageShell>
      <PublicPageHeader
        title={t("staticPages.contact.title")}
        subtitle={t("staticPages.contact.subtitle")}
        showTrustChips
      />

      <div className={cn(publicPageUi.sectionGap, "grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-8")}>
        <div className={cn(publicPageUi.card, publicPageUi.cardPad, publicPageUi.cardInteractive)}>
          <h2 className="mb-5 font-hero-display text-xl font-bold text-neutral-950 dark:text-neutral-50">
            {t("staticPages.contact.formTitle")}
          </h2>
          <form className="space-y-4">
            <div>
              <label htmlFor="name" className="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {t("staticPages.contact.labelName")}
              </label>
              <input
                type="text"
                id="name"
                className="w-full rounded-xl border border-neutral-200/90 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                placeholder={t("staticPages.contact.placeholderName")}
              />
            </div>

            <div>
              <label htmlFor="email" className="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {t("staticPages.contact.labelEmail")}
              </label>
              <input
                type="email"
                id="email"
                className="w-full rounded-xl border border-neutral-200/90 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                placeholder={t("staticPages.contact.placeholderEmail")}
              />
            </div>

            <div>
              <label htmlFor="subject" className="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {t("staticPages.contact.labelSubject")}
              </label>
              <input
                type="text"
                id="subject"
                className="w-full rounded-xl border border-neutral-200/90 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                placeholder={t("staticPages.contact.placeholderSubject")}
              />
            </div>

            <div>
              <label htmlFor="message" className="mb-2 block text-sm font-medium text-neutral-900 dark:text-neutral-100">
                {t("staticPages.contact.labelMessage")}
              </label>
              <textarea
                id="message"
                rows={5}
                className="w-full resize-none rounded-xl border border-neutral-200/90 bg-white px-4 py-3 text-neutral-900 placeholder:text-neutral-500 transition-all focus:outline-none focus:ring-2 focus:ring-primary/30 dark:border-neutral-700 dark:bg-neutral-950 dark:text-neutral-100"
                placeholder={t("staticPages.contact.placeholderMessage")}
              />
            </div>

            <button type="submit" className={cn(publicPageUi.ctaPrimary, "w-full py-3.5")}>
              {t("staticPages.contact.submit")}
            </button>
          </form>
        </div>

        <div className="space-y-5">
          <div className={cn(publicPageUi.card, publicPageUi.cardPad, publicPageUi.cardInteractive)}>
            <h2 className="mb-5 font-hero-display text-xl font-bold text-neutral-950 dark:text-neutral-50">
              {t("staticPages.contact.asideTitle")}
            </h2>
            <div className="space-y-5">
              {[
                { Icon: Mail, title: t("staticPages.contact.emailHeading"), lines: ["support@caretip.com", "sales@caretip.com"] },
                {
                  Icon: Phone,
                  title: t("staticPages.contact.phoneHeading"),
                  lines: [t("staticPages.contact.phoneLine1"), t("staticPages.contact.phoneLine2")],
                },
                {
                  Icon: MessageSquare,
                  title: t("staticPages.contact.chatHeading"),
                  lines: [t("staticPages.contact.chatLine")],
                  action: t("staticPages.contact.chatCta"),
                },
                {
                  Icon: MapPin,
                  title: t("staticPages.contact.hqHeading"),
                  lines: [t("staticPages.contact.hqLine1"), t("staticPages.contact.hqLine2")],
                },
              ].map(({ Icon, title, lines, action }) => (
                <div key={title} className="flex items-start gap-4">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="mb-1 font-semibold text-neutral-950 dark:text-neutral-50">{title}</h3>
                    {lines.map((line) => (
                      <p key={line} className="text-sm text-neutral-700 dark:text-neutral-300">
                        {line}
                      </p>
                    ))}
                    {action ? (
                      <button type="button" className="mt-1 text-sm font-medium text-primary hover:underline">
                        {action}
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className={cn(publicPageUi.insetPanel, "border-primary/15 bg-primary/[0.06]")}>
            <h3 className="mb-2 font-semibold text-neutral-950 dark:text-neutral-50">{t("staticPages.contact.faqTeaserTitle")}</h3>
            <p className="mb-4 text-sm text-neutral-700 dark:text-neutral-300">{t("staticPages.contact.faqTeaserBody")}</p>
            <Link to="/faq" className="inline-flex items-center text-sm font-semibold text-primary hover:underline">
              {t("staticPages.contact.faqTeaserLink")}
            </Link>
          </div>
        </div>
      </div>
    </PublicPageShell>
  );
}
