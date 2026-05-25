import { translateEmotion } from "@/features/therapy/components/emotion/EmotionWheelFixed";

/** Maps API distortion identifiers to localize.tsx translation keys */
const DISTORTION_KEY_MAP: Record<string, string> = {
  all_or_nothing: "All or Nothing Thinking",
  "all-or-nothing": "All or Nothing Thinking",
  mental_filter: "Mental Filter",
  "mental-filter": "Mental Filter",
  mind_reading: "Mind Reading",
  "mind-reading": "Mind Reading",
  fortune_telling: "Fortune Telling",
  "fortune-telling": "Fortune Telling",
  labelling: "Labelling",
  labeling: "Labelling",
  over_generalising: "Over-Generalising",
  overgeneralization: "Over-Generalising",
  overgeneralisation: "Over-Generalising",
  compare_despair: "Compare and Despair",
  "compare-despair": "Compare and Despair",
  emotional_thinking: "Emotional Thinking",
  "emotional-thinking": "Emotional Thinking",
  "emotional-reasoning": "Emotional Thinking",
  emotional_reasoning: "Emotional Thinking",
  guilty_thinking: "Guilty Thinking",
  "guilty-thinking": "Guilty Thinking",
  "should-statements": "Guilty Thinking",
  should_statements: "Guilty Thinking",
  catastrophising: "Catastrophising",
  catastrophizing: "Catastrophising",
  blaming_others: "Blaming Others",
  "blaming-others": "Blaming Others",
  personalising: "Personalising",
  personalizing: "Personalising",
  disqualifying_positive: "Mental Filter",
  "disqualifying-the-positive": "Mental Filter",
  jumping_to_conclusions: "Mind Reading",
  "jumping-to-conclusions": "Mind Reading",
  magnification: "Catastrophising",
  unknown: "Cognitive Distortion",
};

const TRANSLATION_KEYS = Array.from(new Set(Object.values(DISTORTION_KEY_MAP)));

/** Normalize any distortion string for fuzzy lookup (case, spacing, - vs _) */
function normalizeDistortionInput(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[-_]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Extra aliases returned by OpenAI / legacy data */
const NORMALIZED_ALIASES: Record<string, string> = {
  "all or nothing": "All or Nothing Thinking",
  "all or nothing thinking": "All or Nothing Thinking",
  "mental filtering": "Mental Filter",
  "disqualifying the positive": "Mental Filter",
  "jumping to conclusions": "Mind Reading",
  "should statements": "Guilty Thinking",
  "compare and despair": "Compare and Despair",
  "blaming others": "Blaming Others",
  "emotional reasoning": "Emotional Thinking",
  "over generalising": "Over-Generalising",
  "over generalizing": "Over-Generalising",
  "cognitive distortion": "Cognitive Distortion",
  "primary distortion targeted": "Cognitive Distortion",
};

function resolveDistortionTranslationKey(distortion: string): string | null {
  const normalized = normalizeDistortionInput(distortion);
  if (!normalized) return null;

  const asId =
    DISTORTION_KEY_MAP[normalized] ??
    DISTORTION_KEY_MAP[normalized.replace(/ /g, "_")] ??
    DISTORTION_KEY_MAP[normalized.replace(/ /g, "-")];
  if (asId) return asId;

  if (NORMALIZED_ALIASES[normalized]) return NORMALIZED_ALIASES[normalized];

  for (const translationKey of TRANSLATION_KEYS) {
    if (normalizeDistortionInput(translationKey) === normalized) {
      return translationKey;
    }
  }

  return null;
}

export function formatDistortionLabel(
  distortion: string | undefined | null,
  t: (key: string) => string
): string {
  if (!distortion) return t("Unknown");

  const translationKey = resolveDistortionTranslationKey(distortion);
  if (translationKey) return t(translationKey);

  if (normalizeDistortionInput(distortion) === "unknown") {
    return t("Cognitive Distortion");
  }

  return distortion;
}

const EMOTION_KEY_MAP: Record<string, string> = {
  joy: "Joy",
  sadness: "Sadness",
  fear: "Fear",
  anger: "Anger",
  love: "Love",
  surprise: "Surprise",
  disgust: "Disgust",
  anxiety: "Anxiety",
  stress: "Stress",
  worry: "Worry",
  unknown: "Emotion",
};

function toTitleCaseWords(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const EMOTION_TRANSLATION_KEYS = Array.from(new Set(Object.values(EMOTION_KEY_MAP)));

function normalizeEmotionInput(value: string): string {
  return normalizeDistortionInput(value);
}

export function formatEmotionCategoryLabel(
  category: string | undefined | null,
  t: (key: string) => string,
  language: string = "en"
): string {
  if (!category) return t("Unknown");

  const trimmed = category.trim();
  const titleCased = toTitleCaseWords(trimmed);
  const normalized = normalizeEmotionInput(trimmed);

  for (const candidate of [titleCased, trimmed]) {
    const fromWheel = translateEmotion(candidate, language);
    if (fromWheel !== candidate) return fromWheel;
  }

  const asId =
    EMOTION_KEY_MAP[normalized] ??
    EMOTION_KEY_MAP[normalized.replace(/ /g, "_")];
  if (asId) return t(asId);

  for (const translationKey of EMOTION_TRANSLATION_KEYS) {
    if (normalizeEmotionInput(translationKey) === normalized) {
      return t(translationKey);
    }
  }

  const localizedTitle = t(titleCased);
  if (localizedTitle !== titleCased) return localizedTitle;

  if (normalized === "unknown") return t("Emotion (singular)");

  return titleCased;
}
