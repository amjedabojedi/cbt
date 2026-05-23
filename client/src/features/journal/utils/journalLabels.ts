import { translateEmotion } from "@/features/therapy/components/emotion/EmotionWheelFixed";
import { formatDistortionLabel } from "@/features/reframe/utils/reframeLabels";

function toTitleCaseWords(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function normalizeKey(value: string): string {
  return value.trim().toLowerCase().replace(/[-_]/g, " ");
}

/** Static translation for emotion/topic tags; returns original if only dynamic translation can help */
export function formatJournalTag(
  tag: string,
  t: (key: string) => string,
  language: string = "en"
): string {
  if (!tag) return "";
  if (tag === "None") return t("None");

  const trimmed = tag.trim();
  const titleCased = toTitleCaseWords(trimmed);

  for (const candidate of [titleCased, trimmed]) {
    const fromWheel = translateEmotion(candidate, language);
    if (fromWheel !== candidate) return fromWheel;
  }

  const translated = t(titleCased);
  if (translated !== titleCased) return translated;

  const translatedRaw = t(trimmed);
  if (translatedRaw !== trimmed) return translatedRaw;

  return titleCased;
}

export function needsDynamicJournalTag(
  tag: string,
  t: (key: string) => string,
  language: string
): boolean {
  if (language !== "ar" || !tag) return false;
  const formatted = formatJournalTag(tag, t, language);
  return formatted.trim().toLowerCase() === tag.trim().toLowerCase();
}

const DISTORTION_DESCRIPTION_KEYS: Record<string, string> = {
  "all-or-nothing thinking":
    "Viewing situations in absolute, black-and-white categories without considering middle ground.",
  "catastrophising":
    "Expecting the worst possible outcome and exaggerating the importance of negative events.",
  catastrophizing:
    "Expecting the worst possible outcome and exaggerating the importance of negative events.",
  "emotional reasoning":
    "Believing that feelings reflect reality—'I feel it, therefore it must be true.'",
  "fortune telling":
    "Predicting negative outcomes without adequate evidence.",
  labelling:
    "Attaching a negative label to yourself or others instead of describing specific behaviors.",
  labeling:
    "Attaching a negative label to yourself or others instead of describing specific behaviors.",
  magnification:
    "Exaggerating the importance of problems or shortcomings while minimizing successes.",
  "mental filter":
    "Focusing exclusively on negative aspects while filtering out all positive information.",
  "mind reading":
    "Assuming you know what others are thinking without sufficient evidence.",
  overgeneralization:
    "Drawing broad negative conclusions based on a single incident.",
  "over-generalising":
    "Drawing broad negative conclusions based on a single incident.",
  personalization:
    "Believing you're responsible for external events outside your control.",
  personalising:
    "Believing you're responsible for external events outside your control.",
  "should statements":
    "Imposing rigid demands on yourself or others with 'should', 'must', or 'ought to' statements.",
  "disqualifying the positive":
    "Rejecting positive experiences by insisting they 'don't count'.",
  "jumping to conclusions":
    "Making negative interpretations without supporting facts.",
  minimization:
    "Downplaying or dismissing your positive qualities or achievements.",
};

export function getDistortionDescription(
  distortion: string,
  t: (key: string) => string
): string {
  const normalized = normalizeKey(distortion);
  const descKey =
    DISTORTION_DESCRIPTION_KEYS[normalized] ??
    DISTORTION_DESCRIPTION_KEYS[normalized.replace(/ /g, "-")] ??
    "A pattern of thought that may distort your perception of reality or situations.";
  return t(descKey);
}

export function formatDistortionTag(
  distortion: string,
  t: (key: string) => string
): string {
  return formatDistortionLabel(distortion, t);
}
