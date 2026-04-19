export function downloadFile(fileUrl: string, fileName: string): void {
  try {
    if (typeof window === "undefined") return;

    const safeName = (fileName || "document")
      .trim()
      .replace(/[<>:"/\\|?*]+/g, "-");

    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = safeName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  } catch {
    return;
  }
}
