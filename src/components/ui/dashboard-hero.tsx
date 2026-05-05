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
}: DashboardHeroProps) {
  const hasCustomMedia = Boolean(image);
  const hasPhoto = Boolean(imageSrc) && !hasCustomMedia;

  return (
    <div className={cn("mb-5 lg:mb-6", className)}>
      <Card className="relative overflow-hidden border-2 border-border bg-card shadow-sm">
        <BorderBeam size={beamSize} duration={14} colorFrom="#e9932f" colorTo="#000000" />
        <div
          className={cn(
            "dashboard-hero-container grid min-w-0 gap-0 lg:grid-cols-2 lg:items-start lg:gap-8",
          )}
        >
          <CardHeader className="min-w-0 space-y-5 px-4 pb-6 pt-6 sm:space-y-6 sm:px-6 sm:pb-6 sm:pt-7 lg:pl-8 lg:pr-2 lg:pt-8">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground">
              {badge}
            </div>
            <CardTitle className="text-balance break-words text-2xl font-bold tracking-tight text-foreground sm:text-3xl md:text-4xl lg:text-5xl">
              {title}
            </CardTitle>
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

            <div className="flex min-w-0 flex-col gap-2 pt-4 sm:flex-row sm:flex-wrap sm:gap-3 sm:pt-5">
              {actions}
            </div>
          </CardHeader>

          {!hideImage && (
            <CardContent
              className={cn(
                "dashboard-hero-media-column",
                "relative flex min-h-0 min-w-0 flex-col p-0 lg:border-l lg:border-border",
                hasPhoto && "min-h-[220px] lg:min-h-[min(100%,28rem)]",
                hasCustomMedia && "lg:justify-center",
              )}
            >
              {hasCustomMedia ? (
                <>
                  <div
                    className={cn(
                      "dashboard-hero-media relative w-full min-w-0 border-t border-border",
                      /**
                       * When `imageOverlay={false}`, callers are typically providing their own visual that
                       * should render flush (no extra padded frame/background behind it).
                       */
                      imageOverlay === false ? "bg-transparent p-0 sm:p-0 lg:pt-0" : "bg-muted p-2.5 sm:p-4 lg:pt-6",
                      "lg:mx-0 lg:max-w-none lg:border-t-0",
                    )}
                  >
                    <div className="relative w-full min-w-0 touch-manipulation [&_canvas]:block [&_canvas]:h-full [&_canvas]:w-full [&_canvas]:max-w-full [&_img]:block [&_img]:h-auto [&_img]:w-full [&_img]:max-w-full">
                      {image}
                    </div>
                  </div>
                  {imageCaption ? (
                    <div className="shrink-0 border-t border-border/80 bg-muted/90 px-4 py-4 sm:px-5 sm:py-5">
                      <p className="max-w-prose text-sm font-medium leading-snug text-foreground">{imageCaption}</p>
                    </div>
                  ) : null}
                </>
              ) : hasPhoto ? (
                <div className="relative flex min-h-[220px] flex-1 flex-col lg:min-h-[min(100%,28rem)]">
                  <div className="relative min-h-0 flex-1 bg-muted">
                    <img
                      src={imageSrc}
                      alt=""
                      className="h-full min-h-[220px] w-full object-cover lg:min-h-0"
                      loading="lazy"
                      decoding="async"
                    />
                    {imageOverlay ? (
                      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-background/90 via-background/25 to-transparent" />
                    ) : null}
                  </div>
                  <div className="relative shrink-0 px-4 py-3 sm:px-5 sm:py-4">
                    <p className="max-w-sm text-sm font-semibold text-foreground">{imageCaption}</p>
                  </div>
                </div>
              ) : null}
            </CardContent>
          )}
        </div>
      </Card>
    </div>
  );
}
