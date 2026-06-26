/** How It Works page — hero + timeline presentation (spacing/layout only). */
export const howItWorksPageUi = {
  page: "caretip-how-it-works-page",
  heroHeader: "pb-0",
  journeyList:
    "caretip-how-journey-list mx-auto grid w-full max-w-full list-none grid-cols-2 gap-x-3 gap-y-2.5 sm:gap-x-4 sm:gap-y-3 md:gap-x-12 lg:gap-x-14",
  journeyListItem: "caretip-how-journey-list__item flex min-w-0 items-center gap-2 text-left md:gap-3",
  timeline:
    "caretip-how-timeline relative mt-10 space-y-10 sm:mt-12 sm:space-y-12 lg:mt-14 lg:space-y-14 xl:space-y-16",
  hero: "caretip-how-hero-v2-wrap pb-2 sm:pb-4",
} as const;
