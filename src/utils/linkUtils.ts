/**
 * Normalizes a URL by removing trailing slashes and normalizing www subdomain
 * @param url - The URL to normalize
 * @returns Normalized URL
 */
function normalizeURL(url: string): string {
  try {
    const urlObj = new URL(url);

    // Remove trailing slash from pathname (except for root)
    let pathname = urlObj.pathname;
    if (pathname.length > 1 && pathname.endsWith("/")) {
      pathname = pathname.slice(0, -1);
    }

    // Normalize www - remove www subdomain for consistency
    let hostname = urlObj.hostname;
    if (hostname.startsWith("www.")) {
      hostname = hostname.substring(4);
    }

    // Reconstruct URL
    return `${urlObj.protocol}//${hostname}${pathname}${urlObj.search}${urlObj.hash}`;
  } catch {
    // If URL parsing fails, return original
    return url;
  }
}

/**
 * Checks if a URL is a static asset that should be excluded from knowledge base
 * @param url - The URL to check
 * @returns true if the URL is a static asset
 */
function isStaticAsset(url: string): boolean {
  const staticAssetExtensions = [
    ".css",
    ".js",
    ".woff",
    ".woff2",
    ".ttf",
    ".otf",
    ".eot",
    ".ico",
    ".svg",
    ".png",
    ".jpg",
    ".jpeg",
    ".gif",
    ".webp",
    ".pdf", // You might want to keep PDFs, remove this if needed
  ];

  const staticAssetPaths = [
    "/_next/",
    "/static/",
    "/assets/",
    "/images/",
    "/fonts/",
    "/favicon",
    "/icon",
  ];

  const lowerUrl = url.toLowerCase();

  // Check for static asset extensions
  if (staticAssetExtensions.some((ext) => lowerUrl.endsWith(ext))) {
    return true;
  }

  // Check for static asset paths
  if (staticAssetPaths.some((path) => lowerUrl.includes(path))) {
    return true;
  }

  return false;
}

/**
 * Cleans and deduplicates links from API response
 * - Filters out static assets (CSS, JS, fonts, icons, etc.)
 * - Normalizes URLs (removes trailing slashes, normalizes www)
 * - Removes duplicates within the array
 * @param responseLinks - Array of links from API response
 * @returns Array of cleaned, normalized, and deduplicated links
 */
export function cleanAndDeduplicateLinks(responseLinks: string[]): string[] {
  const cleanedLinks: string[] = [];
  const seen = new Set<string>();

  for (const link of responseLinks) {
    // Skip static assets
    if (isStaticAsset(link)) {
      continue;
    }

    // Normalize the URL
    const normalized = normalizeURL(link);

    // Skip if already seen in this batch
    if (seen.has(normalized)) {
      continue;
    }

    seen.add(normalized);
    cleanedLinks.push(normalized);
  }

  return cleanedLinks;
}
