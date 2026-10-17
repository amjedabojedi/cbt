import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const directCreate = vi.fn();
  const managedCreate = vi.fn();
  const toFile = vi.fn();
  const OpenAI = vi.fn()
    .mockImplementationOnce(function () {
      return { audio: { transcriptions: { create: managedCreate } } };
    })
    .mockImplementation(function () {
      return { audio: { transcriptions: { create: directCreate } } };
    });

  return { OpenAI, directCreate, managedCreate, toFile };
});

// Replace the entire SDK, including the dynamically imported file converter.
// Neither client can make requests or require a real API key.
vi.mock("openai", () => ({
  default: mocks.OpenAI,
  toFile: mocks.toFile,
}));

import { transcribeAudio } from "../server/services/openai";

describe("transcribeAudio", () => {
  const buffer = Buffer.from("mock audio bytes");
  const file = { name: "mock-upload", type: "audio/webm" };

  beforeEach(() => {
    mocks.toFile.mockReset().mockResolvedValue(file);
    mocks.directCreate.mockReset().mockResolvedValue({ text: "Recognized speech" });
    mocks.managedCreate.mockReset();
  });

  it("passes the converted file to the direct Whisper client and returns non-streaming text", async () => {
    await expect(transcribeAudio(buffer, "audio/webm")).resolves.toBe("Recognized speech");

    expect(mocks.toFile).toHaveBeenCalledExactlyOnceWith(buffer, "audio.webm", {
      type: "audio/webm",
    });
    expect(mocks.toFile.mock.calls[0][0]).toBe(buffer);
    expect(mocks.directCreate).toHaveBeenCalledExactlyOnceWith({
      file,
      model: "whisper-1",
    });
    const params = mocks.directCreate.mock.calls[0][0];
    expect(params.file).toBe(file);
    expect(params.stream).not.toBe(true);
    expect(params).not.toHaveProperty("language");
    expect(mocks.managedCreate).not.toHaveBeenCalled();
  });

  it.each([
    ["audio/webm;codecs=opus", "audio.webm"],
    ["audio/ogg", "audio.ogg"],
    ["audio/mp4", "audio.mp4"],
    ["audio/mpeg", "audio.mpeg"],
    ["audio/", "audio.webm"],
    ["", "audio.webm"],
  ])("derives %s's filename as %s while preserving its MIME type", async (mimeType, filename) => {
    await transcribeAudio(buffer, mimeType);

    expect(mocks.toFile).toHaveBeenCalledExactlyOnceWith(buffer, filename, {
      type: mimeType,
    });
  });

  it.each(["en", "ar", "en-US"])("forwards the optional language hint %s unchanged", async (language) => {
    await transcribeAudio(buffer, "audio/webm", language);

    expect(mocks.directCreate).toHaveBeenCalledExactlyOnceWith({
      file,
      model: "whisper-1",
      language,
    });
  });

  it("omits an empty language hint", async () => {
    await transcribeAudio(buffer, "audio/webm", "");

    expect(mocks.directCreate.mock.calls[0][0]).not.toHaveProperty("language");
  });

  it.each([{}, { text: undefined }, { text: null }, { text: "" }])(
    "preserves the empty-string result for response %j",
    async (response) => {
      mocks.directCreate.mockResolvedValue(response);

      await expect(transcribeAudio(buffer, "audio/webm")).resolves.toBe("");
    },
  );

  it("returns provider text without trimming or changing it", async () => {
    mocks.directCreate.mockResolvedValue({ text: "  Recognized speech.\n" });

    await expect(transcribeAudio(buffer, "audio/webm")).resolves.toBe("  Recognized speech.\n");
  });

  it("propagates the original provider error", async () => {
    const error = new Error("Whisper unavailable");
    mocks.directCreate.mockRejectedValue(error);

    await expect(transcribeAudio(buffer, "audio/webm")).rejects.toBe(error);
    expect(mocks.directCreate).toHaveBeenCalledTimes(1);
    expect(mocks.managedCreate).not.toHaveBeenCalled();
  });

  it("propagates file-conversion failures without calling Whisper", async () => {
    const error = new Error("Unable to convert audio");
    mocks.toFile.mockRejectedValue(error);

    await expect(transcribeAudio(buffer, "audio/webm")).rejects.toBe(error);
    expect(mocks.directCreate).not.toHaveBeenCalled();
    expect(mocks.managedCreate).not.toHaveBeenCalled();
  });
});
