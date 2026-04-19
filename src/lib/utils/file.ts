export function isValidFileUrl(url?: string | null): url is string {
  if (typeof url !== "string" || !url || url.trim() === "") {
    return false;
  }

  const trimmed = url.trim();
  if (trimmed.startsWith("http://")) return true;
  if (trimmed.startsWith("https://")) return true;
  if (trimmed.startsWith("/")) return true;
  if (trimmed.startsWith("blob:")) return true;
  return false;
}
