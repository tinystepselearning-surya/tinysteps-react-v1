import { describe, expect, it } from "vitest";

import { isNativeParentChatFocus } from "../../../pages/parent/parentNavigation";

describe("parent native navigation visibility", () => {
  it("enters full-screen focus only for an active native message thread", () => {
    expect(isNativeParentChatFocus(true, "messages", "thread-1")).toBe(true);
    expect(isNativeParentChatFocus(true, "messages", null)).toBe(false);
    expect(isNativeParentChatFocus(false, "messages", "thread-1")).toBe(false);
    expect(isNativeParentChatFocus(true, "dashboard", "thread-1")).toBe(false);
  });
});
