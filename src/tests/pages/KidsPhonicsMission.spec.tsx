import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import KidsPhonicsMission from "../../pages/KidsPhonicsMission";

vi.mock("../../games/engine/recordLevelResult", () => ({
  recordLevelResult: vi.fn(),
}));

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location-probe">{`${location.pathname}${location.search}`}</div>;
}

describe("KidsPhonicsMission", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("redirects tracked letter-sound route without kidId to the public play route", async () => {
    render(
      <MemoryRouter
        initialEntries={[
          "/kids/games/phonics/letter-sound?eemTile=eem-g04-letter-sounds&eemStage=1&eemReturn=%2Fkids%2Fgames%2Fenglish-excellence",
        ]}
      >
        <Routes>
          <Route
            path="*"
            element={
              <>
                <LocationProbe />
                <Routes>
                  <Route path="/kids/games/phonics/letter-sound" element={<KidsPhonicsMission />} />
                  <Route path="/free-letter-sounds-game-for-kids" element={<div>Public Letter Sounds Route</div>} />
                </Routes>
              </>
            }
          />
        </Routes>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("location-probe")).toHaveTextContent(
        "/free-letter-sounds-game-for-kids?play=1",
      );
    });

    expect(screen.getByText("Public Letter Sounds Route")).toBeInTheDocument();
    expect(screen.queryByText(/no child selected/i)).not.toBeInTheDocument();
  });
});
