import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ParentSkillsView from "../../../pages/parent/components/skills/ParentSkillsView";
import type {
  ParentSkillsLesson,
  ParentSkillsStage,
} from "../../../pages/parent/components/skills/parentSkillsPresentation";

const lesson = (overrides: Partial<ParentSkillsLesson> = {}): ParentSkillsLesson => ({
  id: "lesson-1",
  label: "Blend CVC words",
  courseId: "early-phonics",
  courseLabel: "Early Phonics",
  stageLabel: "Stage 2 — Digraphs + vowel teams",
  updatedAtMs: new Date("2026-07-20T00:00:00Z").getTime(),
  ratedSkillCount: 1,
  totalSkillCount: 2,
  averageRating: 3,
  roundedAverageRating: 3,
  ratingState: "partially_rated",
  ratingStateLabel: "Partially rated",
  ratingEntries: [
    { key: "blend", label: "Blend sounds", value: 3, text: "Proficient", state: "rated", origin: "explicit" },
    { key: "write", label: "Write words", value: null, text: "Not rated yet", state: "unrated", origin: "explicit" },
  ],
  strengthChips: ["Blending"],
  practiceChips: ["Writing"],
  remark: "Clear blending.\nKeep practising word writing.",
  source: { id: "lesson-1" },
  ...overrides,
});

const stages: ParentSkillsStage[] = [
  {
    id: "2__Stage 2 — Digraphs + vowel teams",
    label: "Stage 2 — Digraphs + vowel teams",
    order: 2,
    displayLabel: "Digraphs + vowel teams",
    skills: [
      { tag: "digraph_recognition", label: "Digraph Recognition", count: 2 },
      { tag: "sound_pronunciation", label: "Sound Pronunciation", count: 1 },
    ],
  },
];

const baseProps = {
  isNativeIOSApp: false,
  childName: "Aanya",
  loading: false,
  error: null,
  courses: [
    { id: "early-phonics", label: "Early Phonics" },
    { id: "basic-grammar", label: "Basic Grammar" },
  ],
  selectedCourseId: "early-phonics",
  lessons: [lesson(), lesson({ id: "lesson-2", label: "Segment sounds", remark: "" })],
  recentAverage: 2.5,
  recentAverageLabel: "Developing",
  ratedLessonCount: 2,
  strengths: ["Blending"],
  practiceAreas: ["Writing"],
  stages,
  recentUpdates: [
    {
      id: "digraph__stage-2__123",
      label: "Digraph Recognition",
      stageLabel: "Digraphs + vowel teams",
      updatedAtMs: 123,
    },
  ],
  onCourseChange: vi.fn(),
  onOpenLesson: vi.fn(),
};

describe("ParentSkillsView", () => {
  it("prioritises latest feedback, exact course context, four-point averages, and central highlights", () => {
    render(<ParentSkillsView {...baseProps} />);

    expect(screen.getByRole("heading", { name: "Latest teacher feedback" })).toBeInTheDocument();
    expect(screen.getAllByText("Blend CVC words").length).toBeGreaterThan(0);
    expect(screen.getByText("2.5/4")).toBeInTheDocument();
    expect(screen.queryByText(/%/)).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Strengths observed" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Practice areas" })).toBeInTheDocument();
    expect(screen.getByRole("combobox", { name: "Teacher feedback course" })).toHaveValue("early-phonics");
  });

  it("keeps lesson grids collapsed, expands one lesson at a time, and exposes four decorative stars per skill", () => {
    render(<ParentSkillsView {...baseProps} />);
    const firstDisclosure = screen.getByRole("button", { name: "Show rating details for Blend CVC words" });
    const secondDisclosure = screen.getByRole("button", { name: "Show rating details for Segment sounds" });

    expect(firstDisclosure).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByTestId("parent-read-only-skill-ratings")).not.toBeInTheDocument();

    fireEvent.click(firstDisclosure);
    expect(firstDisclosure).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByLabelText("Blend sounds: 3 of 4, Proficient")).toBeInTheDocument();
    expect(screen.getByLabelText("Write words: Not rated yet")).toBeInTheDocument();
    expect(screen.getByTestId("parent-read-only-skill-ratings").querySelectorAll("svg")).toHaveLength(8);

    fireEvent.click(secondDisclosure);
    expect(firstDisclosure).toHaveAttribute("aria-expanded", "false");
    expect(secondDisclosure).toHaveAttribute("aria-expanded", "true");
  });

  it("preserves course selection locally and never labels another course as the selected course", () => {
    const onCourseChange = vi.fn();
    render(<ParentSkillsView {...baseProps} onCourseChange={onCourseChange} />);

    fireEvent.change(screen.getByRole("combobox", { name: "Teacher feedback course" }), {
      target: { value: "basic-grammar" },
    });

    expect(onCourseChange).toHaveBeenCalledWith("basic-grammar");
    expect(screen.getAllByText("Early Phonics").length).toBeGreaterThan(0);
    expect(screen.queryByText("early-phonics")).not.toBeInTheDocument();
  });

  it("opens the existing lesson-detail callback", () => {
    const onOpenLesson = vi.fn();
    render(<ParentSkillsView {...baseProps} onOpenLesson={onOpenLesson} />);

    fireEvent.click(screen.getByRole("button", { name: "Open Blend CVC words details" }));
    expect(onOpenLesson).toHaveBeenCalledWith(expect.objectContaining({ id: "lesson-1" }));
  });

  it("uses accessible canonical stage disclosure without unsupported progress claims", () => {
    render(<ParentSkillsView {...baseProps} />);
    const stageDisclosure = screen.getByRole("button", {
      name: "Show skills for Stage 2: Digraphs + vowel teams",
    });
    const detailsId = stageDisclosure.getAttribute("aria-controls");

    expect(stageDisclosure).toHaveAttribute("aria-expanded", "false");
    expect(document.getElementById(detailsId!)).not.toBeInTheDocument();
    fireEvent.click(stageDisclosure);
    expect(stageDisclosure).toHaveAttribute("aria-expanded", "true");
    expect(document.getElementById(detailsId!)).toHaveTextContent("Sound Pronunciation");
    expect(screen.queryByText(/current|completed|%/i)).not.toBeInTheDocument();
  });

  it("distinguishes loading, error, no child, and no positive recent average", () => {
    const { rerender } = render(<ParentSkillsView {...baseProps} childName={null} />);
    expect(screen.getByText("Select a child to view lesson ratings and teacher notes.")).toBeInTheDocument();

    rerender(<ParentSkillsView {...baseProps} loading />);
    expect(screen.getByRole("status", { name: "Loading teacher feedback" })).toBeInTheDocument();

    rerender(<ParentSkillsView {...baseProps} error="Unable to load progress right now." />);
    expect(screen.getByRole("alert")).toHaveTextContent("Unable to load progress right now.");

    rerender(<ParentSkillsView {...baseProps} recentAverage={null} recentAverageLabel={null} ratedLessonCount={0} />);
    expect(screen.getByText("No positive ratings yet")).toBeInTheDocument();
    expect(screen.queryByText("0/4")).not.toBeInTheDocument();
  });

  it("labels unknown course context honestly and preserves recent update order", () => {
    render(
      <ParentSkillsView
        {...baseProps}
        courses={[]}
        selectedCourseId=""
        lessons={[lesson({ courseId: null, courseLabel: null })]}
        recentUpdates={[
          { id: "first", label: "First skill", stageLabel: "Stage A", updatedAtMs: 2 },
          { id: "second", label: "Second skill", stageLabel: "Stage B", updatedAtMs: 1 },
        ]}
      />,
    );

    expect(screen.getAllByText("Course context unavailable").length).toBeGreaterThan(0);
    const updates = screen.getByRole("heading", { name: "Recent skill updates" }).parentElement?.parentElement;
    expect(updates).not.toBeNull();
    expect(within(updates!).getAllByRole("listitem").map((row) => row.textContent)).toEqual([
      expect.stringContaining("First skill"),
      expect.stringContaining("Second skill"),
    ]);
  });

  it("consolidates duplicate recent updates in the rendered summary", () => {
    render(
      <ParentSkillsView
        {...baseProps}
        recentUpdates={[
          {
            id: "old",
            label: "Digraph Recognition",
            stageLabel: "Digraphs + vowel teams",
            updatedAtMs: 1,
          },
          {
            id: "new",
            label: "Digraph Recognition",
            stageLabel: "Digraphs + vowel teams",
            updatedAtMs: 2,
          },
        ]}
      />,
    );

    const updates = screen.getByRole("heading", { name: "Recent skill updates" }).parentElement?.parentElement;
    expect(updates).not.toBeNull();
    expect(within(updates!).getAllByRole("listitem")).toHaveLength(1);
  });

  it("filters a stale Magic-E skill from the canonical Diphthongs stage summary", () => {
    render(
      <ParentSkillsView
        {...baseProps}
        stages={[
          {
            id: "legacy-stage-5",
            label: "Stage 5 — Diphthongs",
            order: 5,
            displayLabel: "Diphthongs",
            skills: [
              { tag: "magic_e_rule", label: "Magic E Rule", count: 1 },
              { tag: "diphthong_recognition", label: "Diphthong Recognition", count: 1 },
            ],
          },
        ]}
        recentUpdates={[]}
      />,
    );

    const stageDisclosure = screen.getByRole("button", { name: "Show skills for Stage 5: Diphthongs" });
    const detailsId = stageDisclosure.getAttribute("aria-controls");
    fireEvent.click(stageDisclosure);
    const details = document.getElementById(detailsId!);
    expect(details).not.toBeNull();
    expect(within(details!).getByText("Diphthong Recognition")).toBeInTheDocument();
    expect(within(details!).queryByText("Magic E Rule")).not.toBeInTheDocument();
  });
});
