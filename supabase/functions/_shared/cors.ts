// Shared CORS helper used by all edge functions in this project.
// Tests in each function directory exercise this helper to catch
// regressions in the origin allow-list.

export const ALLOWED_ORIGIN_PATTERNS: (string | RegExp)[] = [
  /^https?:\/\/localhost(:\d+)?$/,
  /\.lovable\.app$/,
  /\.lovableproject\.com$/,
  /\.lovable\.dev$/,
];

export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;
  return ALLOWED_ORIGIN_PATTERNS.some((p) =>
    typeof p === "string" ? p === origin : p.test(origin)
  );
}

export function buildCorsHeaders(origin: string | null): Record<string, string> {
  const allowed = isOriginAllowed(origin);
  return {
    "Access-Control-Allow-Origin": allowed ? origin! : "null",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}
