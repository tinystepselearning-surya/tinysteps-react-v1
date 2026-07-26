import { describe, expect, it } from "vitest";

import {
  isNativeParentChatFocus,
  shouldShowParentMessagesHeading,
} from "../../../pages/parent/parentNavigation";

describe("parent native navigation visibility", () => {
  it("enters full-screen focus only for an active native message thread", () => {
    expect(isNativeParentChatFocus(true, "messages", "thread-1")).toBe(true);
    expect(isNativeParentChatFocus(true, "messages", null)).toBe(false);
    expect(isNativeParentChatFocus(false, "messages", "thread-1")).toBe(false);
    expect(isNativeParentChatFocus(true, "dashboard", "thread-1")).toBe(false);
  });

  it("hides the redundant messages heading only in the native shell", () => {
    expect(shouldShowParentMessagesHeading(true, false)).toBe(false);
    expect(shouldShowParentMessagesHeading(true, true)).toBe(false);
    expect(shouldShowParentMessagesHeading(false, false)).toBe(true);
  });
});
