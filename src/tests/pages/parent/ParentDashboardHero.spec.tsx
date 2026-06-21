import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ParentDashboardHero from "../../../pages/parent/components/ParentDashboardHero";

const baseProps = {
  childName: "Aarav",
  heroMessage: "Today is a good day to practice.",
  heroGradientClass: "from-slate-50 to-indigo-50",
  programIcon: "📘",
  programLabel: "Phonics Foundations",
  activeStageLabel: "Blending words",
  classesCompleted: 4,
  classesUpcoming: 2,
  alertText: "No urgent alerts right now",
  onViewInsights: vi.fn(),
  onViewClasses: vi.fn(),
};

describe("ParentDashboardHero", () => {
  it("renders a Join Class link when a join URL is available", () => {
    render(
      <ParentDashboardHero
        {...baseProps}
        joinClassUrl="https://meet.example.com/tiny-steps"
      />,
    );

    const joinLink = screen.getByRole("link", { name: /join class in a new tab/i });
    expect(joinLink).toHaveAttribute("href", "https://meet.example.com/tiny-steps");
    expect(joinLink).toHaveAttribute("target", "_blank");
    expect(joinLink).toHaveAttribute("rel", "noopener noreferrer");
  });

  it("renders a disabled fallback state when no join URL is available", () => {
    render(
      <ParentDashboardHero
        {...baseProps}
        joinClassDisabledReason="Class link will appear once assigned."
      />,
    );

    const joinButton = screen.getByRole("button", { name: /class link will appear once assigned\./i });
    expect(joinButton).toBeDisabled();
    expect(screen.getByText("Class link will appear once assigned.")).toBeInTheDocument();
  });
});
