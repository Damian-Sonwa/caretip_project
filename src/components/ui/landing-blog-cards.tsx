import { cn } from "@/lib/utils";

export type LandingBlogCardItem = {
  imageSrc: string;
  imageAlt: string;
  title: string;
  category: string;
};

export type LandingBlogCardsProps = {
  heading: string;
  subtitle: string;
  items: LandingBlogCardItem[];
  className?: string;
};

/**
 * Optional three-up blog-style card row (reference layout from cards.tsx).
 * Uses project fonts and CareTip spacing — no external font imports.
 */
export function LandingBlogCards({ heading, subtitle, items, className }: LandingBlogCardsProps) {
  return (
    <div className={cn("flex w-full flex-col items-center", className)}>
      <h2 className="text-balance text-center font-sans text-3xl font-semibold tracking-tight text-foreground">
        {heading}
      </h2>
      <p className="mt-2 max-w-lg text-center text-sm leading-relaxed text-muted-foreground text-pretty">
        {subtitle}
      </p>
      <div className="mt-10 flex w-full flex-wrap justify-center gap-8">
        {items.map((item) => (
          <article
            key={item.title}
            className="w-full max-w-72 transition-transform duration-300 hover:-translate-y-0.5"
          >
            <img
              src={item.imageSrc}
              alt={item.imageAlt}
              className="aspect-[3/2] w-full rounded-xl object-cover"
              loading="lazy"
              decoding="async"
            />
            <h3 className="mt-3 font-sans text-base font-medium text-foreground">{item.title}</h3>
            <p className="mt-1 font-sans text-xs font-semibold text-primary">{item.category}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
