import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ParentMobileHeader from "../../../pages/parent/components/ParentMobileHeader";
import type { ParentTabKey } from "../../../pages/parent/parentNavigation";

const expectedTitles: Array<[ParentTabKey, string]> = [
  ["dashboard", "Home"],
  ["classes", "Classes"],
  ["messages", "Messages"],
  ["payments", "Payments"],
  ["insights", "Insights"],
  ["games-progress", "Games Progress"],
  ["skills", "Skills"],
  ["holidays", "Holiday Calendar"],
];

describe("ParentMobileHeader", () => {
  it.each(expectedTitles)("shows the title for %s", (activeTab, title) => {
    render(
      <ParentMobileHeader
        activeTab={activeTab}
        childName="Aarav"
        onMenu={vi.fn()}
        onProfile={vi.fn()}
      />,
    );

    expect(screen.getByRole("heading", { name: title })).toBeInTheDocument();
  });

  it("calls the menu and profile callbacks", () => {
    const onMenu = vi.fn();
    const onProfile = vi.fn();
    render(
      <ParentMobileHeader
        activeTab="dashboard"
        childName="Aarav"
        onMenu={onMenu}
        onProfile={onProfile}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Open parent menu" }));
    fireEvent.click(screen.getByRole("button", { name: "Open profile and payments" }));

    expect(onMenu).toHaveBeenCalledOnce();
    expect(onProfile).toHaveBeenCalledOnce();
  });

  it("provides a truncating child-name structure with the full value as its title", () => {
    const childName = "Aarav With A Very Long Display Name";
    render(
      <ParentMobileHeader
        activeTab="dashboard"
        childName={childName}
        onMenu={vi.fn()}
        onProfile={vi.fn()}
      />,
    );

    const label = screen.getByTestId("parent-mobile-child-name");
    expect(label).toHaveTextContent(childName);
    expect(label).toHaveAttribute("title", childName);
    expect(label).toHaveClass("truncate");
  });
});
