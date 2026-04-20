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
  /** Custom visual (e.g. animated QR); takes precedence over `imageSrc`. */
  image?: React.ReactNode;
  imageCaption?: string;
  overview: React.ReactNode;
  shortcuts: React.ReactNode;
  actions: React.ReactNode;
  /** Larger beam for main marketing hero */
  beamSize?: number;
  /** When true, omit the right-hand image column (single-column hero). */
  hideImage?: boolean;
};

/**
 * Shared hero shell (admin / business / employee): white card, black/yellow beam, high-contrast tabs.
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
}: DashboardHeroProps) {
  return (
    <div className={cn("mb-8 lg:mb-10", className)}>
      <Card className="relative overflow-hidden border-2 border-border bg-card shadow-sm">
        <BorderBeam size={beamSize} duration={14} colorFrom="#e9932f" colorTo="#000000" />
        <div
          className={cn(
            "grid gap-0",
            !hideImage && "lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]",
          )}
        >
          <CardHeader className="space-y-8 px-4 pb-8 pt-6 sm:space-y-10 sm:px-6 sm:pt-8 lg:pl-10 lg:pr-4 lg:pt-10">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-wide text-foreground">
              {badge}
            </div>
            <CardTitle className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl lg:text-5xl">
              {title}
            </CardTitle>
            <CardDescription className="break-words text-base leading-relaxed sm:text-lg text-foreground/80">
              {description}
            </CardDescription>

            <Tabs defaultValue="overview" className="w-full max-w-md pt-8 sm:pt-10">
              <TabsList className="grid w-full grid-cols-2 bg-muted">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="links">Shortcuts</TabsTrigger>
              </TabsList>
              <TabsContent
                value="overview"
                className="rounded-md border border-border bg-background p-4 sm:p-5 text-sm text-foreground"
              >
                {overview}
              </TabsContent>
              <TabsContent
                value="links"
                className="space-y-2 rounded-md border border-border bg-background p-4 sm:p-5 text-sm"
              >
                {shortcuts}
              </TabsContent>
            </Tabs>

            <div className="flex flex-wrap gap-2 sm:gap-3 pt-10 sm:pt-12">{actions}</div>
          </CardHeader>

          {!hideImage && (
            <CardContent className="relative min-h-[240px] p-0 lg:min-h-full">
              <div className="absolute inset-0 bg-muted">
                {image ? (
                  <div className="relative h-full w-full overflow-hidden rounded-r-lg">{image}</div>
                ) : imageSrc ? (
                  <img
                    src={imageSrc}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-transparent" />
              </div>
              <div className="relative flex h-full min-h-[260px] flex-col justify-end p-8 lg:min-h-[320px]">
                <p className="max-w-sm text-sm font-semibold text-foreground drop-shadow-sm">{imageCaption}</p>
              </div>
            </CardContent>
          )}
        </div>
      </Card>
    </div>
  );
}
