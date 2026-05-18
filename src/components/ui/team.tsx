import * as React from "react";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Building2,
  Coffee,
  Hotel,
  Martini,
  PartyPopper,
  Scissors,
  Truck,
  UtensilsCrossed,
} from "lucide-react";

import { Marquee } from "@/components/ui/marquee";
import { landingImageFrameClassName } from "@/components/ui/landing-image-frame";
import { cn } from "@/lib/utils";

import hotelsImg from "../../../images/Hotels.png";
import barLoungeImg from "../../../images/bar and lounge.png";
import salonSpaImg from "../../../images/salon and spa.png";
import beachClubImg from "../../../images/Beach_club.png";

type MarqueeSpec = {
  id:
    | "restaurants"
    | "cafes"
    | "barsLounges"
    | "nightclubs"
    | "hotels"
    | "resorts"
    | "beachClubs"
    | "salonsSpas"
    | "barbershops"
    | "foodTrucks"
    | "eventCenters"
    | "hospitalityGroups";
  image: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const MARQUEE_SPECS: MarqueeSpec[] = [
  {
    id: "restaurants",
    image:
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80",
    Icon: UtensilsCrossed,
  },
  {
    id: "cafes",
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    Icon: Coffee,
  },
  {
    id: "barsLounges",
    image: barLoungeImg,
    Icon: Martini,
  },
  {
    id: "nightclubs",
    image:
      "https://images.stockcake.com/public/1/6/d/16ddd8d6-02f0-4219-ac7d-82ffb23be7ad/dj-at-club-stockcake.jpg",
    Icon: PartyPopper,
  },
  {
    id: "hotels",
    image: hotelsImg,
    Icon: Hotel,
  },
  {
    id: "resorts",
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    Icon: Hotel,
  },
  {
    id: "beachClubs",
    image: beachClubImg,
    Icon: Martini,
  },
  {
    id: "salonsSpas",
    image: salonSpaImg,
    Icon: Scissors,
  },
  {
    id: "barbershops",
    image:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
    Icon: Scissors,
  },
  {
    id: "foodTrucks",
    image:
      "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=80",
    Icon: Truck,
  },
  {
    id: "eventCenters",
    image:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
    Icon: PartyPopper,
  },
  {
    id: "hospitalityGroups",
    image:
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
    Icon: Building2,
  },
];

export default function HospitalityBusinessesMarquee() {
  const { t, i18n } = useTranslation();

  /** `t` is often referentially stable across language changes; depend on `resolvedLanguage` so labels refresh. */
  const businesses = useMemo(
    () =>
      MARQUEE_SPECS.map((spec) => ({
        ...spec,
        name: t(`landing.hospitalityMarquee.${spec.id}.name`),
        role: t(`landing.hospitalityMarquee.${spec.id}.role`),
      })),
    [t, i18n.resolvedLanguage],
  );

  return (
    <div className="relative w-full overflow-hidden bg-transparent py-7 sm:py-8">
      <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-white via-white/80 to-transparent dark:from-neutral-950 dark:via-neutral-950/80 sm:w-20" />
      <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white via-white/80 to-transparent dark:from-neutral-950 dark:via-neutral-950/80 sm:w-20" />

      <Marquee className="[--gap:1rem]" pauseOnHover durationSeconds={65} gapPx={16}>
            {businesses.map((b) => (
              <div className="group flex w-[17.5rem] shrink-0 flex-col sm:w-[19rem]" key={b.id} tabIndex={0}>
                <div
                  className={cn(
                    landingImageFrameClassName,
                    "relative aspect-[4/5] w-full bg-neutral-100 shadow-[0_4px_16px_rgba(0,0,0,0.05)] dark:bg-neutral-900 dark:shadow-[0_6px_20px_rgba(0,0,0,0.28)]",
                  )}
                >
                  <img
                    alt={b.name}
                    className="h-full w-full object-cover object-center transition-opacity duration-300 ease-out group-hover:opacity-[0.97]"
                    src={b.image}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-0 bottom-0 border-t border-neutral-200/60 bg-white/92 px-2.5 py-2 max-md:backdrop-blur-none md:backdrop-blur-[4px] dark:border-neutral-800/80 dark:bg-neutral-950/88 sm:px-3 sm:py-2.5">
                    <div className="flex items-start gap-2">
                      <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary sm:h-8 sm:w-8">
                        <b.Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate text-sm font-semibold leading-snug text-neutral-900 dark:text-neutral-50">
                          {b.name}
                        </h3>
                        <p className="mt-0.5 text-xs leading-snug text-neutral-600 dark:text-neutral-400 sm:text-[13px]">
                          {b.role}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
      </Marquee>
    </div>
  );
}
