import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ParentDashboardHero from "../../../pages/parent/components/ParentDashboardHero";

const baseProps = {
  childName: "Aarav",
  heroMessage: "Today is a good day to practice.",
  programLabel: "Phonics Foundations",
  activeStageLabel: "Blending words",
  classesCompleted: 4,
  classesUpcoming: 2,
  classesScopeLabel: "July 2026",
  alertText: "No urgent alerts right now",
  hasAlert: false,
  onViewInsights: vi.fn(),
  onViewClasses: vi.fn(),
};

describe("ParentDashboardHero", () => {
  it("renders the selected child and preserves Home navigation callbacks", () => {
    const onViewInsights = vi.fn();
    const onViewClasses = vi.fn();
    render(
      <ParentDashboardHero
        {...baseProps}
        onViewInsights={onViewInsights}
        onViewClasses={onViewClasses}
      />,
    );

    expect(screen.getByRole("heading", { name: "Aarav at a glance" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "View Classes" }));
    fireEvent.click(screen.getByRole("button", { name: "View Insights" }));
    expect(onViewClasses).toHaveBeenCalledOnce();
    expect(onViewInsights).toHaveBeenCalledOnce();
  });

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
    expect(joinLink.closest("[data-testid='hero-primary-action']")).toBeInTheDocument();
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
