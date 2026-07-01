import * as React from "react";
import { Link } from "react-router";
import { Building2, ShieldCheck, LineChart } from "lucide-react";

import { Button } from "@/components/ui/button";
import { DashboardHero } from "@/components/ui/dashboard-hero";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1400&q=80";

export type Hero195Props = {
  className?: string;
  headlineStats?: {
    tipsLabel: string;
    businessesLabel: string;
    locationsLabel: string;
    staffLabel: string;
  };
};

export function Hero195({ className, headlineStats }: Hero195Props) {
  const tips = headlineStats?.tipsLabel ?? "N/A";
  const businesses = headlineStats?.businessesLabel ?? "N/A";
  const locations = headlineStats?.locationsLabel ?? "N/A";
  const staff = headlineStats?.staffLabel ?? "N/A";

  return (
    <DashboardHero
      className={className}
      beamSize={280}
      badge={
        <>
          <ShieldCheck className="h-3.5 w-3.5 text-foreground" />
          Platform control center
        </>
      }
      title="Operate with clarity"
      description="Global tips, businesses, and staff in one high-contrast workspace. Yellow actions, black type, white surfaces, built for fast decisions."
      imageSrc={HERO_IMAGE}
      imageCaption="Live aggregates refresh with your dashboard, same palette on every surface."
      overview={
        <div className="grid grid-cols-2 gap-3 text-center sm:grid-cols-4">
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Tips</p>
            <p className="text-lg font-bold tabular-nums">{tips}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Venues</p>
            <p className="text-lg font-bold tabular-nums">{businesses}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Locations</p>
            <p className="text-lg font-bold tabular-nums">{locations}</p>
          </div>
          <div>
            <p className="text-xs font-medium uppercase text-muted-foreground">Staff</p>
            <p className="text-lg font-bold tabular-nums">{staff}</p>
          </div>
        </div>
      }
      shortcuts={
        <>
          <Link
            to="/platform-admin/businesses"
            className="flex items-center justify-between rounded-lg px-2 py-2 font-medium text-foreground hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              KYC &amp; verification
            </span>
          </Link>
          <Link
            to="/platform-admin/revenue/transactions"
            className="flex items-center justify-between rounded-lg px-2 py-2 font-medium text-foreground hover:bg-muted"
          >
            <span className="flex items-center gap-2">
              <LineChart className="h-4 w-4" />
              Global transactions
            </span>
          </Link>
        </>
      }
      actions={
        <>
          <Button asChild>
            <Link to="/platform-admin/businesses/onboarding-verification">Review businesses</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/platform-admin/revenue/transactions">View transactions</Link>
          </Button>
        </>
      }
    />
  );
}
