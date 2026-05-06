import * as React from "react";

import { cn } from "@/lib/utils";
import { BorderBeam } from "@/components/ui/border-beam";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export type DashboardHeroProps = {
  className?: string;
  badge: React.ReactNode;
  title: string;
  description: string;
  /** Static hero image (ignored when `image` is set). */
  imageSrc?: string;
  /** Custom visual (e.g. WebGL); uses tight intrinsic layout instead of stretched cover. */
  image?: React.ReactNode;
  imageCaption?: string;
  overview: React.ReactNode;
  shortcuts: React.ReactNode;
  actions: React.ReactNode;
  /** Larger beam for main marketing hero */
  beamSize?: number;
  /** When true, omit the right-hand image column (single-column hero). */
  hideImage?: boolean;
  /** When false, skips the bottom gradient scrim over the media column (e.g. for WebGL / custom visuals). */
  imageOverlay?: boolean;
  /**
   * Dashboard routes only: on small screens, stack hero as heading → media → supporting copy/tabs → actions.
   * Large screens keep the two-column layout. Does not affect landing or marketing pages unless they pass this flag.
   */
  stackHeroOnMobile?: boolean;
};

/**
 * Shared hero shell: two-column grid on large screens, tight vertical rhythm, no dead space under media.
 */
export function DashboardHero({
  className,
  badge,
  title,
  description,
  imageSrc,
  image,
  imageCaption = "Yellow highlights, black type, and white surfaces. Same system-wide palette.",
  overview,
  shortcuts,
  actions,
  beamSize = 260,
  hideImage = false,
  imageOverlay = true,
  stackHeroOnMobile = false,
}: DashboardHeroProps) {
  const hasCustomMedia = Boolean(image);
  const hasPhoto = Boolean(imageSrc) && !hasCustomMedia;

  const badgeRow = (
    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground">
      {badge}
    </div>
  );

  const titleRow = (
    <CardTitle className="text-balance break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
      {title}
    </CardTitle>
  );

  const supportingBlock = (
    <div className="min-w-0 space-y-5">
      <CardDescription className="max-w-xl break-words text-base leading-relaxed text-foreground/80 sm:text-lg">
        {description}
      </CardDescription>

      <Tabs defaultValue="overview" className="w-full max-w-md pt-0 sm:pt-1">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="links">Shortcuts</TabsTrigger>
        </TabsList>
        <TabsContent
          value="overview"
          className="rounded-md border border-border bg-background p-4 text-sm text-foreground sm:p-5"
        >
          {overview}
        </TabsContent>
        <TabsContent
          value="links"
          className="space-y-2 rounded-md border border-border bg-background p-4 text-sm sm:p-5"
        >
          {shortcuts}
        </TabsContent>
      </Tabs>
    </div>
  );

  const actionsRow = (
    <div className="dashboard-hero-actions flex min-w-0 flex-row flex-wrap items-center gap-2 pt-1 sm:gap-3 sm:pt-2 lg:pt-0">
      {actions}
    </div>
  );

  const mediaShellClass = (opts: { forStackedMobile: boolean }) =>
    cn(
      "dashboard-hero-media relative w-full min-w-0",
      imageOverlay === false
        ? "bg-transparent p-0 sm:p-0 lg:pt-0"
        : cn(
            "border-t border-border bg-muted p-2.5 sm:p-4 lg:border-t-0 lg:pt-6",
            opts.forStackedMobile && "max-lg:border-t-0 max-lg:bg-transparent max-lg:p-0",
          ),
      "lg:mx-0 lg:max-w-none",
    );

  const mediaInner = (opts: { stackedMobileFrame: boolean }) => (
    <div
      className={cn(
        "relative w-full min-w-0 touch-manipulation [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:max-w-full [&_img]:block [&_img]:h-auto [&_img]:w-full [&_img]:max-w-full",
        opts.stackedMobileFrame && "max-lg:mx-auto max-lg:w-[min(92%,min(560px,95vw))]",
      )}
    >
      {image}
    </div>
  );

  const renderMediaColumn = (opts: { stackedLayout: boolean }) => {
    if (hideImage) return null;
    return (
      <CardContent
        className={cn(
          "dashboard-hero-media-column relative flex min-h-0 min-w-0 flex-col p-0 lg:border-border",
          !(hasCustomMedia && imageOverlay === false) && "lg:border-l",
          hasPhoto && "min-h-[220px] lg:min-h-[min(100%,28rem)]",
          hasCustomMedia && "lg:justify-center",
          opts.stackedLayout &&
            "max-lg:w-full max-lg:max-w-none lg:col-start-2 lg:row-start-1 lg:row-span-3 lg:self-stretch",
        )}
      >
        {hasCustomMedia ? (
          <>
            <div className={mediaShellClass({ forStackedMobile: opts.stackedLayout })}>{mediaInner({ stackedMobileFrame: opts.stackedLayout })}</div>
            {imageCaption ? (
              <div className="shrink-0 border-t border-border/80 bg-muted/90 px-4 py-4 sm:px-5 sm:py-5 max-lg:border-t-0 max-lg:bg-transparent max-lg:px-0 max-lg:py-3 lg:bg-muted/90">
                <p className="max-w-prose text-sm font-medium leading-snug text-foreground">{imageCaption}</p>
              </div>
            ) : null}
          </>
        ) : hasPhoto ? (
          <div className="relative flex min-h-[220px] flex-1 flex-col lg:min-h-[min(100%,28rem)]">
            <div
              className={cn(
                "relative min-h-0 flex-1 bg-muted lg:bg-muted",
                opts.stackedLayout && "max-lg:bg-transparent",
              )}
            >
              <img
                src={imageSrc}
                alt=""
                className={cn(
                  "h-full min-h-[220px] w-full object-cover lg:min-h-0",
                  opts.stackedLayout && "max-lg:mx-auto max-lg:min-h-0 max-lg:w-[min(92%,min(560px,95vw))] max-lg:object-contain",
                )}
                loading="lazy"
                decoding="async"
              />
              {imageOverlay ? (
                <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-background/25 to-transparent max-lg:hidden" />
              ) : null}
            </div>
            <div className="relative shrink-0 px-4 py-3 sm:px-5 sm:py-4 max-lg:px-0">
              <p className="max-w-sm text-sm font-semibold text-foreground">{imageCaption}</p>
            </div>
          </div>
        ) : null}
      </CardContent>
    );
  };

  return (
    <div className={cn("mb-5 lg:mb-6", className)}>
      <Card className="relative overflow-hidden border-2 border-border bg-card shadow-sm">
        <BorderBeam size={beamSize} duration={14} colorFrom="#e9932f" colorTo="#000000" />
        {stackHeroOnMobile ? (
          <div
            className={cn(
              "dashboard-hero-container flex min-w-0 flex-col gap-y-5 px-4 pb-6 pt-6 sm:gap-y-6 sm:px-6 sm:pb-7 sm:pt-7",
              "lg:grid lg:items-start lg:gap-x-8 lg:gap-y-6 lg:px-0 lg:pb-0 lg:pt-0",
              hideImage ? "lg:grid-cols-1" : "lg:grid-cols-2 lg:grid-rows-[auto_auto_auto]",
            )}
          >
            <div className="min-w-0 space-y-3 lg:col-start-1 lg:row-start-1 lg:space-y-5 lg:self-start lg:px-8 lg:pr-2 lg:pt-8">
              {badgeRow}
              {titleRow}
            </div>

            {renderMediaColumn({ stackedLayout: true })}

            <div className="min-w-0 lg:col-start-1 lg:row-start-2 lg:px-8 lg:pr-2">{supportingBlock}</div>

            <div className="min-w-0 lg:col-start-1 lg:row-start-3 lg:px-8 lg:pb-8 lg:pr-2">{actionsRow}</div>
          </div>
        ) : (
          <div
            className={cn(
              "dashboard-hero-container grid min-w-0 gap-0 lg:grid-cols-2 lg:items-start lg:gap-8",
            )}
          >
            <CardHeader className="min-w-0 space-y-5 px-4 pb-6 pt-6 sm:space-y-6 sm:px-6 sm:pb-6 sm:pt-7 lg:pl-8 lg:pr-2 lg:pt-8">
              {badgeRow}
              {titleRow}
              <CardDescription className="max-w-xl break-words text-base leading-relaxed text-foreground/80 sm:text-lg">
                {description}
              </CardDescription>

              <Tabs defaultValue="overview" className="w-full max-w-md pt-2 sm:pt-3">
                <TabsList className="grid w-full grid-cols-2 bg-muted">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="links">Shortcuts</TabsTrigger>
                </TabsList>
                <TabsContent
                  value="overview"
                  className="rounded-md border border-border bg-background p-4 text-sm text-foreground sm:p-5"
                >
                  {overview}
                </TabsContent>
                <TabsContent
                  value="links"
                  className="space-y-2 rounded-md border border-border bg-background p-4 text-sm sm:p-5"
                >
                  {shortcuts}
                </TabsContent>
              </Tabs>

              <div className="dashboard-hero-actions flex min-w-0 flex-row flex-wrap items-center gap-2 pt-4 sm:gap-3 sm:pt-5">
                {actions}
              </div>
            </CardHeader>

            {renderMediaColumn({ stackedLayout: false })}
          </div>
        )}
      </Card>
    </div>
  );
}
