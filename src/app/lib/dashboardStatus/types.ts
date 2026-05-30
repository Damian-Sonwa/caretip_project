export type DashboardStatusTone = "live" | "updating" | "action";

export type DashboardStatusItem = {
  id: string;
  tone: DashboardStatusTone;
  label: string;
  description?: string;
};
