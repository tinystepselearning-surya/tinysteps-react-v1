import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { describe, expect, it } from "vitest";
import LegacyFreeGamesHubRedirect from "../../../pages/public/LegacyFreeGamesHubRedirect";

function Destination() {
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <div data-testid="location">{location.pathname}</div>
      <button type="button" onClick={() => navigate(-1)}>Back</button>
    </>
  );
}

describe("LegacyFreeGamesHubRedirect", () => {
  it("replaces the legacy route with the canonical English games hub", async () => {
    render(
      <MemoryRouter initialEntries={["/before", "/free-games-for-kids"]} initialIndex={1}>
        <Routes>
          <Route path="/free-games-for-kids" element={<LegacyFreeGamesHubRedirect />} />
          <Route path="/free-english-games-for-kids" element={<Destination />} />
          <Route path="/before" element={<div>Previous page</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(await screen.findByTestId("location")).toHaveTextContent("/free-english-games-for-kids");
    fireEvent.click(screen.getByRole("button", { name: "Back" }));
    await waitFor(() => expect(screen.getByText("Previous page")).toBeInTheDocument());
  });
});
