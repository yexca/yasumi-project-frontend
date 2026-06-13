import type { LucideIcon } from "lucide-react";
import {
  Archive,
  CalendarDays,
  CheckCircle2,
  CircleDashed,
  Inbox,
  Layers3,
  Lightbulb,
  Settings,
  SunMedium,
} from "lucide-react";

export const ROUTE_PATHS = {
  root: "/",
  today: "/today",
  inbox: "/inbox",
  upcoming: "/upcoming",
  deadlines: "/deadlines",
  ideas: "/ideas",
  areas: "/areas",
  areaDetail: "/areas/:areaId",
  completed: "/completed",
  archive: "/archive",
  settings: "/settings",
} as const;

export type AppRoutePath = (typeof ROUTE_PATHS)[keyof typeof ROUTE_PATHS];

export type NavItem = {
  path: AppRoutePath;
  labelKey: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { path: ROUTE_PATHS.today, labelKey: "nav.today", icon: SunMedium },
  { path: ROUTE_PATHS.inbox, labelKey: "nav.inbox", icon: Inbox },
  { path: ROUTE_PATHS.upcoming, labelKey: "nav.upcoming", icon: CalendarDays },
  { path: ROUTE_PATHS.deadlines, labelKey: "nav.deadlines", icon: CircleDashed },
  { path: ROUTE_PATHS.ideas, labelKey: "nav.ideas", icon: Lightbulb },
  { path: ROUTE_PATHS.areas, labelKey: "nav.areas", icon: Layers3 },
  { path: ROUTE_PATHS.completed, labelKey: "nav.completed", icon: CheckCircle2 },
  { path: ROUTE_PATHS.archive, labelKey: "nav.archive", icon: Archive },
  { path: ROUTE_PATHS.settings, labelKey: "nav.settings", icon: Settings },
];
