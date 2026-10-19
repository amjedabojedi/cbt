import type { ReactNode } from "react";
import type { ProgressDataStatus } from "@/hooks/use-progress-insights";
import { useLocalization } from "@/lib/localize.tsx";

/** Never render an empty-data interpretation for a read that has not succeeded. */
export default function ProgressDataBoundary({
  status, children, allowPartial = false,
}: { status: ProgressDataStatus; children: ReactNode; allowPartial?: boolean }) {
  const { t } = useLocalization();
  const showData = status.available || allowPartial;
  return (
    <div className="min-w-0">
      {(!status.available || status.error || status.refreshing) && (
        <p role="status" className="text-sm font-medium p-3 rounded-lg bg-amber-50 text-amber-900 mb-3">
          {t(!status.available
            ? status.loading
              ? "Loading records. Totals are not yet available."
              : "Data unavailable. Totals cannot be calculated."
            : status.error
              ? "Refresh failed. Showing previously loaded data, which may be out of date."
              : "Refreshing. Showing previously loaded data.")}
          {allowPartial && !status.available && <> {t("Partial timeline: only available records are shown.")}</>}
        </p>
      )}
      {showData && children}
    </div>
  );
}
