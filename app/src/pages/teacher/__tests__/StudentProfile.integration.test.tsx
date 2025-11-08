import { describe, it, vi, expect, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import StudentProfile from "../StudentProfile";
import { ToastProvider } from "../../../../src/ui/ToastProvider";

// Mock teacherService to avoid real writes
vi.mock("../../../src/services/teacherService", () => ({
  addAttendanceRecord: vi.fn().mockResolvedValue(undefined),
  updateCurriculumTopic: vi.fn().mockResolvedValue(true),
  seedSampleData: vi.fn().mockResolvedValue(true),
}));

// Mock firebase/firestore functions used inside StudentProfile
let getDocsCallCount = 0;
vi.mock("firebase/firestore", async () => {
  const original = await vi.importActual<any>("firebase/firestore");
  return {
    ...original,
  getDoc: vi.fn().mockImplementation(async (_docRef: any) => ({
      exists: () => true,
      id: "student1",
      data: () => ({ firstName: "Test", lastName: "Kid", age: 6, assignedTeacherId: "t1", enrolledCourses: ["Phonics"] }),
    })),
  getDocs: vi.fn().mockImplementation(async (_ref: any) => {
      // first call -> sessions, second call -> curriculum
      getDocsCallCount++;
      if (getDocsCallCount === 1) {
        return {
          forEach: (cb: any) => cb({ id: 'sess1', data: () => ({ scheduledDate: '2024-11-06', scheduledTime: '10:00 AM', topic: 'Test Session', status: 'completed', outcomes: 'Good', rubric: { accuracy: 5, fluency: 4, confidence: 5 } }) }),
          docs: [],
        };
      }
      return {
        forEach: (cb: any) => cb({ id: 'topic1', data: () => ({ title: 'T1', status: 'in_progress', teacherNote: 'Note', completedDate: '2024-10-01' }) }),
        docs: [ { id: 'topic1', data: () => ({ title: 'T1', status: 'in_progress', teacherNote: 'Note', completedDate: '2024-10-01' }) } ],
      };
    }),
  };
});

describe("StudentProfile integration (mocked Firestore)", () => {
  beforeEach(() => {
    getDocsCallCount = 0;
  });

  it("renders student info and curriculum from mocked firestore", async () => {
    render(
      <MemoryRouter initialEntries={["/teacher/students/student1"]}>
        <ToastProvider>
          <Routes>
            <Route path="/teacher/students/:studentId" element={<StudentProfile />} />
          </Routes>
        </ToastProvider>
      </MemoryRouter>
    );

    // wait for student name to appear
    await waitFor(() => expect(screen.getByText(/Test Kid/)).toBeTruthy());

    // switch to Curriculum tab so topics render
    const curriculumTab = screen.getByText(/Curriculum Progress/i);
    fireEvent.click(curriculumTab);

    // curriculum topic should be visible
  await waitFor(() => expect(screen.getByText('T1')).toBeTruthy());
  });
});
