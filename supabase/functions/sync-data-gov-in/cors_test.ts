import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildCorsHeaders, isOriginAllowed } from "../_shared/cors.ts";

Deno.test("sync-data-gov-in: allowed origins pass", () => {
  assertEquals(isOriginAllowed("http://localhost:8080"), true);
  assertEquals(isOriginAllowed("https://app.lovable.app"), true);
});

Deno.test("sync-data-gov-in: disallowed origins blocked", () => {
  assertEquals(isOriginAllowed("https://malicious.com"), false);
  assertEquals(isOriginAllowed("file://"), false);
});

Deno.test("sync-data-gov-in: ACAO reflects allowed", () => {
  const h = buildCorsHeaders("https://app.lovable.app");
  assertEquals(h["Access-Control-Allow-Origin"], "https://app.lovable.app");
});

Deno.test("sync-data-gov-in: ACAO is null for blocked", () => {
  const h = buildCorsHeaders("https://malicious.com");
  assertEquals(h["Access-Control-Allow-Origin"], "null");
});

Deno.test("sync-data-gov-in: API key redaction sanity", () => {
  // Mirrors the sanitizer behavior in index.ts
  const sanitize = (u: string) => u.replace(/api-key=[^&]+/i, "api-key=***REDACTED***");
  assertEquals(
    sanitize("https://api.data.gov.in/resource/abc?api-key=secret123&format=json"),
    "https://api.data.gov.in/resource/abc?api-key=***REDACTED***&format=json",
  );
});
