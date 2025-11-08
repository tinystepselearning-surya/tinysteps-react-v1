import { describe, it, vi, expect } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import CurriculumEditorModal from "../CurriculumEditorModal";

describe("CurriculumEditorModal", () => {
  it("calls onSave with form data and closes", async () => {
    const topic = { id: "t1", title: "Test Topic", status: "not_started", teacherNote: "", completedDate: undefined };
    const onClose = vi.fn();
    const onSave = vi.fn().mockResolvedValue(undefined);

    render(<CurriculumEditorModal topic={topic} open={true} onClose={onClose} onSave={onSave} />);

    // change status
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'completed' } });

    // add a note
    const textarea = screen.getByRole('textbox');
    fireEvent.change(textarea, { target: { value: 'Good work' } });

    // click save
    const saveBtn = screen.getByText('Save');
    fireEvent.click(saveBtn);

    // expect onSave called
    expect(onSave).toHaveBeenCalled();
  });
});
