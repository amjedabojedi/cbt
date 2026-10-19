export type ReportPeriod = "week" | "month" | "all";

export function pdfExportUrl(type: string, period: ReportPeriod = "all", clientId?: number | null) {
  const query = new URLSearchParams({ type, period });
  if (clientId != null) query.set("clientId", String(clientId));
  return `/api/export/pdf?${query}`;
}

export async function fetchPDF(url: string): Promise<Blob> {
  const response = await fetch(url, { credentials: "include", cache: "no-store" });
  if (!response.ok) throw new Error("PDF report request failed");
  const mime = response.headers.get("Content-Type")?.split(";")[0].trim().toLowerCase();
  if (mime !== "application/pdf") throw new Error("Expected a PDF report");
  const blob = await response.blob();
  const signature = new Uint8Array(await blob.slice(0, 5).arrayBuffer());
  if (String.fromCharCode(...Array.from(signature)) !== "%PDF-") throw new Error("Invalid PDF report");
  return blob;
}

/** Only initiate a download after the response has been checked, not on a timer. */
export async function downloadPDF(url: string): Promise<void> {
  const blob = await fetchPDF(url);
  const objectUrl = URL.createObjectURL(blob);
  const link = document.createElement("a");
  try {
    link.href = objectUrl;
    link.download = "resiliencehub-report.pdf";
    document.body.appendChild(link);
    link.click();
  } finally {
    link.remove();
    // Give the browser time to consume the bytes; this does not confirm a save.
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  }
}

export async function openPDF(url: string): Promise<void> {
  // Reserve the window during the click, before awaiting the request.
  const preview = window.open("about:blank", "_blank");
  if (!preview) throw new Error("PDF preview window blocked");
  preview.opener = null;
  try {
    const blob = await fetchPDF(url);
    const objectUrl = URL.createObjectURL(blob);
    preview.location.replace(objectUrl);
    setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
  } catch (error) {
    preview.close();
    throw error;
  }
}
