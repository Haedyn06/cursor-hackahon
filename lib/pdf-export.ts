export async function exportElementToPdf(
  elementId: string,
  filename: string
): Promise<void> {
  const el = document.getElementById(elementId);
  if (!el) throw new Error("Export element not found");

  const html2pdf = (await import("html2pdf.js")).default;
  await html2pdf()
    .set({
      margin: 0.4,
      filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
    })
    .from(el)
    .save();
}
