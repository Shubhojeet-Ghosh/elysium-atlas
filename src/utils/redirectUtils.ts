/**
 * Utility functions for handling redirects
 */

/**
 * Gets the redirect URL from query parameters, with fallback to default route
 * @param defaultRoute - The default route to redirect to if no redirect parameter is found
 * @returns The redirect URL
 */
export const getRedirectUrl = (defaultRoute: string = "/my-agents"): string => {
  if (typeof window !== "undefined") {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get("redirect") || defaultRoute;
  }
  return defaultRoute;
};
