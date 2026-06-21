import { describe, expect, it } from "vitest";

import {
  getJoinLinkCandidate,
  resolveSessionJoinLink,
  sessionJoinLinkMatchesEnrollmentTeacher,
} from "../../lib/sessionJoinLink";

describe("sessionJoinLink", () => {
  it("reads canonical join URLs from direct and nested fields", () => {
    expect(getJoinLinkCandidate({ joinUrl: "https://meet.example.com/direct" })).toBe(
      "https://meet.example.com/direct",
    );
    expect(
      getJoinLinkCandidate({
        currentEnrollment: {
          meetingLink: "https://meet.example.com/nested",
        },
      }),
    ).toBe("https://meet.example.com/nested");
  });

  it("prefers the live enrollment join URL over a stale session snapshot", () => {
    const session = {
      id: "enr_123_20260621_0815",
      enrollmentId: "enr_123",
      teacherId: "teacher_old",
      joinUrl: "https://old-teacher.example.com/room",
    };
    const enrollmentsById = new Map<string, Record<string, unknown>>([
      [
        "enr_123",
        {
          id: "enr_123",
          teacherId: "teacher_new",
          joinUrl: "https://new-teacher.example.com/room",
        },
      ],
    ]);

    expect(resolveSessionJoinLink(session, enrollmentsById)).toBe(
      "https://new-teacher.example.com/room",
    );
  });

  it("rejects a stale session join URL when the session teacher no longer matches the enrollment teacher", () => {
    const session = {
      id: "enr_123_20260621_0815",
      enrollmentId: "enr_123",
      teacherId: "teacher_old",
      joinUrl: "https://old-teacher.example.com/room",
    };
    const enrollmentsById = new Map<string, Record<string, unknown>>([
      [
        "enr_123",
        {
          id: "enr_123",
          teacherId: "teacher_new",
          joinUrl: null,
        },
      ],
    ]);

    expect(resolveSessionJoinLink(session, enrollmentsById)).toBe("");
    expect(
      sessionJoinLinkMatchesEnrollmentTeacher(session, {
        teacherId: "teacher_new",
      }),
    ).toBe(false);
  });

  it("keeps a direct session URL when the session still matches the current enrollment teacher", () => {
    const session = {
      id: "enr_123_20260621_0815",
      enrollmentId: "enr_123",
      teacherId: "teacher_new",
      joinUrl: "https://new-teacher.example.com/room",
    };
    const enrollmentsById = new Map<string, Record<string, unknown>>([
      [
        "enr_123",
        {
          id: "enr_123",
          teacherId: "teacher_new",
          joinUrl: null,
        },
      ],
    ]);

    expect(resolveSessionJoinLink(session, enrollmentsById)).toBe(
      "https://new-teacher.example.com/room",
    );
  });
});
