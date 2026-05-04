/** Dummy dashboard copy for the 3D hero showcase. */
export const HERO_STATS = [
  { label: "Revenue", value: "€48.2k", delta: "+12.4%", up: true },
  { label: "Active users", value: "2,847", delta: "+3.1%", up: true },
  { label: "Retention", value: "94%", delta: "+0.8%", up: true },
] as const;

export const HERO_CHART_POINTS = [
  { m: "Jan", v: 12 },
  { m: "Feb", v: 18 },
  { m: "Mar", v: 15 },
  { m: "Apr", v: 28 },
  { m: "May", v: 32 },
  { m: "Jun", v: 38 },
] as const;

export const HERO_NOTIFICATIONS = [
  { title: "Payout settled", time: "2m ago", tone: "ok" as const },
  { title: "New team member", time: "18m ago", tone: "info" as const },
  { title: "Goal reached: Q2", time: "1h ago", tone: "accent" as const },
];
