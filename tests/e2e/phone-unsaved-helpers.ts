import { expect, type Dialog, type Locator, type Page } from "@playwright/test";

export async function typeByTouch(input: Locator, writing: string) {
  await input.tap();
  // Browser key events after a touch focus, NOT the native iOS keyboard.
  await input.pressSequentially(writing);
  await expect(input).toHaveValue(writing);
  await expect(input).toBeFocused();
}

export async function phoneNavigate(page: Page, name: string) {
  await page.getByRole("button", { name: "Open navigation menu", exact: true }).tap();
  await page.getByRole("dialog", { name: "Navigation Menu" })
    .getByRole("link", { name, exact: true }).tap();
}

export async function expectNoStoredWriting(page: Page, writing: string[]) {
  const storage = await page.evaluate(() => JSON.stringify({
    local: { ...localStorage }, session: { ...sessionStorage },
  }));
  for (const text of writing) expect(storage).not.toContain(text);
}

// Observe the entire journey, including settled UI and reopen/reload, so late
// duplicate prompts or unintended saves cannot silently pass.
export function watchUnsavedJourney(page: Page) {
  const dialogs: { type: string; message: string }[] = [];
  const writes: string[] = [];
  let accept = false;
  let handled: Promise<void>[] = [];
  page.on("request", request => {
    if (/\/api\/users\/\d+\/thoughts(?:\/\d+)?$/.test(new URL(request.url()).pathname)
      && ["POST", "PATCH", "PUT", "DELETE"].includes(request.method())) {
      writes.push(`${request.method()} ${new URL(request.url()).pathname}`);
    }
  });
  page.on("dialog", (dialog: Dialog) => {
    dialogs.push({ type: dialog.type(), message: dialog.message() });
    handled.push(accept ? dialog.accept() : dialog.dismiss());
  });
  return {
    async confirm(shouldAccept: boolean, action: () => Promise<unknown>, settled: () => Promise<void>) {
      const before = dialogs.length;
      accept = shouldAccept;
      handled = [];
      await action();
      await Promise.all(handled);
      await settled();
      expect(dialogs.slice(before)).toEqual([{
        type: "confirm", message: "Discard your entry? Your unsaved work will be lost.",
      }]);
    },
    expectFinished(promptCount: number) {
      expect(dialogs).toHaveLength(promptCount);
      expect(writes, "Leaving unsaved writing must not issue a save or delete").toEqual([]);
    },
  };
}
