import * as React from "react";
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
import { cn } from "@/lib/utils";
import { landingImageFrameClassName } from "@/components/ui/landing-image-frame";

import hotelsImg from "../../../images/Hotels.png";
import barLoungeImg from "../../../images/bar and lounge.png";
import salonSpaImg from "../../../images/salon and spa.png";
import beachClubImg from "../../../images/Beach_club.png";

type HospitalityBusiness = {
  image: string;
  name: string;
  role: string;
  Icon: React.ComponentType<{ className?: string }>;
};

const businesses: HospitalityBusiness[] = [
  {
    image:
      "https://images.unsplash.com/photo-1550966871-3ed3cdb5ed0c?auto=format&fit=crop&w=1200&q=80",
    name: "Restaurants",
    role: "Table QR tipping • shift pools • staff goals",
    Icon: UtensilsCrossed,
  },
  {
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&w=1200&q=80",
    name: "Cafés",
    role: "Counter QR • fast tips • repeat guests",
    Icon: Coffee,
  },
  {
    image: barLoungeImg,
    name: "Bars & Lounges",
    role: "High-volume nights • team recognition • live stats",
    Icon: Martini,
  },
  {
    image:
      "https://images.stockcake.com/public/1/6/d/16ddd8d6-02f0-4219-ac7d-82ffb23be7ad/dj-at-club-stockcake.jpg",
    name: "Nightclubs",
    role: "Late-night tipping • fast checkout • live activity",
    Icon: PartyPopper,
  },
  {
    image: hotelsImg,
    name: "Hotels",
    role: "Front desk & concierge • room service • track performance",
    Icon: Hotel,
  },
  {
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    name: "Resorts",
    role: "Multiple venues • staff mapping • simple reporting",
    Icon: Hotel,
  },
  {
    image: beachClubImg,
    name: "Beach clubs",
    role: "Outdoor QR tipping • fast service • happy guests",
    Icon: Martini,
  },
  {
    image: salonSpaImg,
    name: "Salons & Spas",
    role: "Personal QR • service-based tipping • staff profiles",
    Icon: Scissors,
  },
  {
    image:
      "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=1200&q=80",
    name: "Barbershops",
    role: "Personal QR • repeat clients • staff profiles",
    Icon: Scissors,
  },
  {
    image:
      "https://images.unsplash.com/photo-1504754524776-8f4f37790ca0?auto=format&fit=crop&w=1200&q=80",
    name: "Food trucks",
    role: "Counter QR • quick tips • no extra hardware",
    Icon: Truck,
  },
  {
    image:
      "https://images.unsplash.com/photo-1517457373958-b7bdd4587205?auto=format&fit=crop&w=1200&q=80",
    name: "Event centers",
    role: "Pop-up QR codes • staff routing • clear earnings",
    Icon: PartyPopper,
  },
  {
    image:
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
    name: "Hospitality groups",
    role: "Locations & tables • staff mapping • consistent reporting",
    Icon: Building2,
  },
];

type HospitalityBusinessesMarqueeProps = {
  /** Edge-to-edge width (drops inner max-width) for landing sections above full-width content. */
  fullBleed?: boolean;
};

export default function Component({ fullBleed = false }: HospitalityBusinessesMarqueeProps) {
  return (
    <section
      className={cn(
        "relative w-full overflow-hidden bg-white dark:bg-neutral-950",
        fullBleed ? "py-8 md:py-10 lg:py-12" : "py-12 md:py-20",
      )}
    >
      <div
        className={cn(
          "relative z-10 w-full",
          fullBleed ? "mx-0 max-w-none" : "mx-auto max-w-7xl",
        )}
      >
        <div className="relative w-full">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-16 bg-gradient-to-r from-white to-transparent dark:from-neutral-950 sm:w-24" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-16 bg-gradient-to-l from-white to-transparent dark:from-neutral-950 sm:w-24" />

          <Marquee className="[--gap:1.5rem]" pauseOnHover durationSeconds={30} gapPx={24}>
            {businesses.map((b) => (
              <div
                className="group flex w-80 shrink-0 flex-col sm:w-[26rem]"
                key={b.name}
                tabIndex={0}
              >
                <div
                  className={cn(
                    landingImageFrameClassName,
                    "relative h-[26rem] w-full bg-neutral-100 sm:h-[28rem]",
                  )}
                >
                  <img
                    alt={b.name}
                    className="h-full w-full cursor-pointer object-cover transition-transform duration-300 group-hover:scale-[1.01] group-active:scale-[0.99]"
                    src={b.image}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-x-0 bottom-0 bg-white/85 p-3 backdrop-blur-sm">
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <b.Icon className="h-4 w-4" />
                      </span>
                      <div className="min-w-0">
                        <h3 className="truncate font-semibold text-foreground">{b.name}</h3>
                        <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
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
      </div>
    </section>
  );
}

