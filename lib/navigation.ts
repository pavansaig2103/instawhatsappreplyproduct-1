import {
  Bot,
  Bell,
  Inbox,
  LayoutDashboard,
  MessageSquareText,
  Settings,
  Users
} from "lucide-react";

export const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/dashboard/leads", label: "Leads", icon: Users },
  { href: "/dashboard/conversations", label: "Conversations", icon: Inbox },
  { href: "/dashboard/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard/faqs", label: "FAQs", icon: MessageSquareText },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
  { href: "/test-dm", label: "Test DM", icon: Bot }
];
