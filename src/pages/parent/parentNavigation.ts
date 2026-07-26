import {
  CalendarDays,
  CreditCard,
  Home,
  MessageSquare,
  TrendingUp,
} from "lucide-react";

import type { MobileTabBarItem } from "../../components/common/MobileTabBar";

export type ParentTabKey =
  | "dashboard"
  | "insights"
  | "games-progress"
  | "skills"
  | "classes"
  | "messages"
  | "holidays"
  | "profile"
  | "payments";

export const PARENT_TAB_TITLES: Record<ParentTabKey, string> = {
  dashboard: "Home",
  classes: "Classes",
  messages: "Messages",
  payments: "Payments",
  insights: "Insights",
  "games-progress": "Games Progress",
  skills: "Skills",
  holidays: "Holiday Calendar",
  profile: "Profile",
};

export const PARENT_MOBILE_TABS: MobileTabBarItem[] = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "classes", label: "Classes", icon: CalendarDays },
  { id: "messages", label: "Messages", icon: MessageSquare },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "insights", label: "Insights", icon: TrendingUp },
];

export function getParentTabTitle(tab: ParentTabKey): string {
  return PARENT_TAB_TITLES[tab];
}

export function isNativeParentChatFocus(
  isNativeParentApp: boolean,
  activeTab: ParentTabKey,
  activeThreadId: string | null,
): boolean {
  return isNativeParentApp && activeTab === "messages" && Boolean(activeThreadId);
}

export function shouldShowParentMessagesHeading(
  isNativeParentApp: boolean,
  isNativeMessagesThreadFocus: boolean,
): boolean {
  return !isNativeParentApp && !isNativeMessagesThreadFocus;
}
