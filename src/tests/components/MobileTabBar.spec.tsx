import { fireEvent, render, screen } from "@testing-library/react";
import { CalendarDays, CreditCard, Home, MessageSquare, TrendingUp } from "lucide-react";
import { describe, expect, it, vi } from "vitest";

import MobileTabBar, {
  type MobileTabBarItem,
} from "../../components/common/MobileTabBar";

vi.mock("../../lib/nativeHaptics", () => ({
  hapticSelection: vi.fn(),
}));

const items: MobileTabBarItem[] = [
  { id: "dashboard", label: "Home", icon: Home },
  { id: "classes", label: "Classes", icon: CalendarDays },
  { id: "messages", label: "Messages", icon: MessageSquare, badgeCount: 8 },
  { id: "payments", label: "Payments", icon: CreditCard },
  { id: "insights", label: "Insights", icon: TrendingUp },
];

describe("MobileTabBar", () => {
  it("renders five navigation items and selects the requested ID", () => {
    const onSelect = vi.fn();
    render(<MobileTabBar items={items} activeId="classes" onSelect={onSelect} />);

    const buttons = screen.getAllByRole("button");
    expect(buttons).toHaveLength(5);

    fireEvent.click(screen.getByRole("button", { name: "Messages 8" }));
    expect(onSelect).toHaveBeenCalledWith("messages");
  });

  it("applies aria-current only to the active tab and uses the light icon-capsule state", () => {
    render(<MobileTabBar items={items} activeId="classes" onSelect={vi.fn()} />);

    const currentItems = screen
      .getAllByRole("button")
      .filter((button) => button.hasAttribute("aria-current"));

    expect(currentItems).toHaveLength(1);
    expect(currentItems[0]).toHaveAccessibleName("Classes");
    expect(currentItems[0]).toHaveAttribute("aria-current", "page");
    expect(currentItems[0]).toHaveAttribute("data-selected-style", "icon-capsule");
  });

  it.each([
    [8, "8"],
    [100, "99+"],
  ])("renders badge count %s as %s", (badgeCount, expected) => {
    const badgeItems = items.map((item) =>
      item.id === "messages" ? { ...item, badgeCount } : item,
    );
    render(<MobileTabBar items={badgeItems} activeId="messages" onSelect={vi.fn()} />);

    expect(screen.getByText(expected)).toBeInTheDocument();
  });
});
