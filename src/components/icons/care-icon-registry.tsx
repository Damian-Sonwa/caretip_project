import type { FC, SVGProps } from "react";
import type { LucideIcon } from "lucide-react";
import {
  ArrowRight,
  ChevronDown,
  CreditCard,
  FileText,
  HelpCircle,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Mail,
  MapPin,
  Megaphone,
  Palette,
  Search,
  Settings,
  Settings2,
  Shield,
  User,
  Users,
} from "lucide-react";
import {
  CareTipAnalyticsIcon,
  CareTipEarningsIcon,
  CareTipEmployeePerformanceIcon,
  CareTipGoalsIcon,
  CareTipHospitalityVenueIcon,
  CareTipNotificationsIcon,
  CareTipTableQrIcon,
  CareTipTipsIcon,
  type CareTipIconProps,
} from "./caretip-custom-icons";

/** Semantic icon names used across CareTip dashboards and settings. */
export type CareIconName =
  | "tips"
  | "earnings"
  | "employeePerformance"
  | "goals"
  | "hospitalityVenue"
  | "tableQr"
  | "analytics"
  | "notifications"
  | "overview"
  | "team"
  | "locations"
  | "tables"
  | "tipsActivity"
  | "support"
  | "settings"
  | "inbox"
  | "tipGoals"
  | "businesses"
  | "transactions"
  | "logs"
  | "announcements"
  | "users"
  | "billing"
  | "security"
  | "branding"
  | "general"
  | "signOut"
  | "arrowRight"
  | "search"
  | "chevronDown";

export type CareIconComponent = LucideIcon | FC<CareTipIconProps & SVGProps<SVGSVGElement>>;

type RegistryEntry = CareIconComponent;

export const CARE_ICON_REGISTRY: Record<CareIconName, RegistryEntry> = {
  tips: CareTipTipsIcon,
  earnings: CareTipEarningsIcon,
  employeePerformance: CareTipEmployeePerformanceIcon,
  goals: CareTipGoalsIcon,
  hospitalityVenue: CareTipHospitalityVenueIcon,
  tableQr: CareTipTableQrIcon,
  analytics: CareTipAnalyticsIcon,
  notifications: CareTipNotificationsIcon,
  overview: LayoutDashboard,
  team: Users,
  locations: MapPin,
  tables: LayoutGrid,
  tipsActivity: CareTipTipsIcon,
  support: HelpCircle,
  settings: Settings,
  inbox: Inbox,
  tipGoals: CareTipGoalsIcon,
  businesses: CareTipHospitalityVenueIcon,
  transactions: CreditCard,
  logs: FileText,
  announcements: Megaphone,
  users: Users,
  billing: CreditCard,
  security: Shield,
  branding: Palette,
  general: User,
  signOut: LogOut,
  arrowRight: ArrowRight,
  search: Search,
  chevronDown: ChevronDown,
};

/** Settings shell uses Settings2 in some layouts — map for section tabs. */
export const CARE_ICON_SETTINGS_ALT = Settings2;
