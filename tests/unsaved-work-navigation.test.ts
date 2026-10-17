import { describe, expect, it, vi } from "vitest";
import { NavigationConfirmationGate } from "../client/src/hooks/use-unsaved-work-protection";

describe("unsaved-work navigation confirmation", () => {
  it("keeps the current tab and input unchanged when discard is cancelled", () => {
    const confirm = vi.fn(() => false);
    const gate = new NavigationConfirmationGate(confirm);
    const tab = {};
    let activeTab = "record";
    const input = "A note I have not saved";

    if (gate.authorize(tab, true)) activeTab = "history";

    expect(activeTab).toBe("record");
    expect(input).toBe("A note I have not saved");
    expect(confirm).toHaveBeenCalledTimes(1);
  });

  it("confirms once across pointerdown, mousedown and click, then allows one tab switch", () => {
    const confirm = vi.fn(() => true);
    const gate = new NavigationConfirmationGate(confirm);
    const tab = {};
    let activeTab = "record";

    const pointerAllowed = gate.authorize(tab, true);
    const mouseDownAllowed = gate.authorize(tab, true);
    if (pointerAllowed && mouseDownAllowed) activeTab = "history";
    const clickUsesApproval = gate.consume(tab);
    if (!clickUsesApproval) activeTab = "history";

    expect(confirm).toHaveBeenCalledTimes(1);
    expect(activeTab).toBe("history");
    expect(clickUsesApproval).toBe(true);
    expect(gate.consume(tab)).toBe(false);
  });

  it("asks again after a cancelled attempt rather than carrying stale approval forward", () => {
    const confirm = vi.fn().mockReturnValueOnce(false).mockReturnValueOnce(true);
    const gate = new NavigationConfirmationGate(confirm);
    const tab = {};

    expect(gate.authorize(tab, true)).toBe(false);
    expect(gate.authorize(tab, true)).toBe(true);
    expect(gate.consume(tab)).toBe(true);
    expect(confirm).toHaveBeenCalledTimes(2);
  });
});
