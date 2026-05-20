import { motion } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { FeatureProductVisual } from "@/components/public/features/FeatureProductVisual";
import type { FeatureVisualVariant } from "@/components/public/features/featuresPageConfig";

type FeatureShowcaseCardProps = {
  title: string;
  description: string;
  tag: string;
  Icon: LucideIcon;
  visual: FeatureVisualVariant;
  featured?: boolean;
  index: number;
};

export function FeatureShowcaseCard({
  title,
  description,
  tag,
  Icon,
  visual,
  featured = false,
  index,
}: FeatureShowcaseCardProps) {
  return (
    <motion.article
      initial={{ y: 14, opacity: 0 }}
      whileInView={{ y: 0, opacity: 1 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      whileHover={{ y: -3 }}
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-neutral-200/80 bg-white/95 shadow-[0_2px_8px_rgba(15,23,42,0.04),0_14px_40px_-18px_rgba(15,23,42,0.12)] transition-[box-shadow,border-color] duration-300",
        "hover:border-primary/20 hover:shadow-[0_8px_32px_-12px_rgba(235,153,44,0.18)] dark:border-neutral-800 dark:bg-neutral-950/90 dark:hover:border-primary/25",
        featured && "lg:min-h-[22rem]",
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute -right-8 -top-8 h-32 w-32 rounded-full bg-[radial-gradient(circle,rgba(235,153,44,0.12),transparent_70%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />

      <FeatureProductVisual variant={visual} featured={featured} className="m-3 mb-0 sm:m-4 sm:mb-0" />

      <div className={cn("flex flex-1 flex-col p-4 sm:p-5", featured && "sm:p-6")}>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200/90 bg-[#fafaf8] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-neutral-600 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-400">
            <Icon className="h-3 w-3 text-primary transition-transform duration-300 group-hover:scale-110" aria-hidden />
            {tag}
          </span>
        </div>
        <h2
          className={cn(
            "font-semibold tracking-[-0.02em] text-neutral-950 dark:text-neutral-50",
            featured ? "text-xl sm:text-2xl" : "text-lg",
          )}
        >
          {title}
        </h2>
        <p
          className={cn(
            "mt-2 leading-relaxed text-neutral-700 dark:text-neutral-300",
            featured ? "text-[0.9375rem] sm:text-base" : "text-sm",
          )}
        >
          {description}
        </p>
      </div>
    </motion.article>
  );
}
