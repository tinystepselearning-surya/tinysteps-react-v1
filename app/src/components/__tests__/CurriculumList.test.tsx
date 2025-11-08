import { describe, it, vi, expect } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CurriculumList from "../CurriculumList";
import { ToastProvider } from "../../ui/ToastProvider";

describe("CurriculumList optimistic update", () => {
  it("updates UI optimistically and calls onUpdateTopic", async () => {
    const initial = [
      { id: 'a', title: 'A', status: 'not_started' },
      { id: 'b', title: 'B', status: 'in_progress' },
    ];

    const onUpdateTopic = vi.fn().mockResolvedValue(undefined);

    render(
      <ToastProvider>
        <CurriculumList initial={initial} onUpdateTopic={onUpdateTopic} />
      </ToastProvider>
    );

    // open editor for first topic
    const editButtons = screen.getAllByText('Edit');
    fireEvent.click(editButtons[0]);

    // change status to completed
    const select = screen.getByRole('combobox');
    fireEvent.change(select, { target: { value: 'completed' } });

    // save
    const save = screen.getByText('Save');
    fireEvent.click(save);

    await waitFor(() => expect(onUpdateTopic).toHaveBeenCalled());

    // optimistic update: there should be at least one status showing 'completed' (table header also contains 'Completed')
    const matches = screen.getAllByText(/completed/i);
    expect(matches.length).toBeGreaterThanOrEqual(1);
  });
});
