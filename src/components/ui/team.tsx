import * as React from "react";
import { Building2, Coffee, Hotel, Martini, Scissors, UtensilsCrossed } from "lucide-react";

import { Marquee } from "@/components/ui/marquee";

import hotelsImg from "../../../images/Hotels.png";
import barLoungeImg from "../../../images/bar and lounge.png";
import salonSpaImg from "../../../images/salon and spa.png";

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
    image: hotelsImg,
    name: "Hotels",
    role: "Front desk & concierge • room service • track performance",
    Icon: Hotel,
  },
  {
    image: salonSpaImg,
    name: "Salons & Spas",
    role: "Personal QR • service-based tipping • staff profiles",
    Icon: Scissors,
  },
  {
    image:
      "https://images.unsplash.com/photo-1528605248644-14dd04022da1?auto=format&fit=crop&w=1200&q=80",
    name: "Hospitality groups",
    role: "Locations & tables • staff mapping • consistent reporting",
    Icon: Building2,
  },
];

export default function Component() {
  return (
    <section className="relative w-full overflow-hidden bg-white py-12 md:py-20">
      <div>
        <svg
          className="absolute bottom-0 right-0 text-neutral-200 dark:text-neutral-800"
          fill="none"
          height="154"
          viewBox="0 0 460 154"
          width="460"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g clipPath="url(#clip0_494_1104)">
            <path
              d="M-87.463 458.432C-102.118 348.092 -77.3418 238.841 -15.0744 188.274C57.4129 129.408 180.708 150.071 351.748 341.128C278.246 -374.233 633.954 380.602 548.123 42.7707"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="40"
            />
          </g>
          <defs>
            <clipPath id="clip0_494_1104">
              <rect fill="white" height="154" width="460" />
            </clipPath>
          </defs>
        </svg>
      </div>

      <div className="relative z-10 mx-auto max-w-7xl">
        <div className="relative w-full">
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-24 bg-gradient-to-r from-white to-transparent" />
          <div className="pointer-events-none absolute right-0 top-0 z-10 h-full w-24 bg-gradient-to-l from-white to-transparent" />

          <Marquee className="[--gap:1.5rem]" pauseOnHover durationSeconds={30} gapPx={24}>
            {businesses.map((b) => (
              <div className="group flex w-80 shrink-0 flex-col sm:w-[26rem]" key={b.name}>
                <div className="relative h-[26rem] w-full overflow-hidden rounded-2xl bg-neutral-100 sm:h-[28rem]">
                  <img
                    alt={b.name}
                    className="h-full w-full object-cover grayscale transition-all duration-300 group-hover:grayscale-0"
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
                        <p className="text-sm text-muted-foreground">{b.role}</p>
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

