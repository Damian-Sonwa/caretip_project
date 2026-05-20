import type { LucideIcon } from "lucide-react";
import { Building2, Coffee, Hotel, Scissors, UtensilsCrossed } from "lucide-react";

export type SolutionId = "restaurants" | "hotels" | "cafes" | "events" | "salonBarbershop";

export type SolutionDef = {
  id: SolutionId;
  Icon: LucideIcon;
  reverse?: boolean;
};

export const SOLUTIONS: SolutionDef[] = [
  { id: "restaurants", Icon: UtensilsCrossed },
  { id: "hotels", Icon: Hotel, reverse: true },
  { id: "cafes", Icon: Coffee },
  { id: "events", Icon: Building2, reverse: true },
  { id: "salonBarbershop", Icon: Scissors },
];
