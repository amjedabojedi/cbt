import { useLocalization, DynamicTranslator } from "@/lib/localize.tsx";
import { formatJournalTag, needsDynamicJournalTag } from "@/features/journal/utils/journalLabels";

interface JournalTagProps {
  text: string;
  className?: string;
}

/** Renders a journal emotion/topic tag with static wheel translations or dynamic API translation */
export function JournalTag({ text, className }: JournalTagProps) {
  const { t, currentLanguage } = useLocalization();

  if (!text) return null;

  if (needsDynamicJournalTag(text, t, currentLanguage)) {
    return <DynamicTranslator text={text} className={className} />;
  }

  return <span className={className}>{formatJournalTag(text, t, currentLanguage)}</span>;
}
