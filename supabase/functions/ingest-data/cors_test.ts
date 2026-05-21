import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildCorsHeaders, isOriginAllowed } from "../_shared/cors.ts";

Deno.test("ingest-data: allowed origins pass", () => {
  for (const o of [
    "http://localhost:5173",
    "https://foo.lovable.app",
    "https://bar.lovableproject.com",
    "https://baz.lovable.dev",
  ]) {
    assertEquals(isOriginAllowed(o), true, `expected ${o} to be allowed`);
  }
});

Deno.test("ingest-data: disallowed origins blocked", () => {
  for (const o of ["https://attacker.com", "http://lovable.app.evil.com", null]) {
    assertEquals(isOriginAllowed(o), false, `expected ${o} to be blocked`);
  }
});

Deno.test("ingest-data: header echoes allowed origin", () => {
  const h = buildCorsHeaders("https://foo.lovable.app");
  assertEquals(h["Access-Control-Allow-Origin"], "https://foo.lovable.app");
});

Deno.test("ingest-data: header is null for blocked origin", () => {
  const h = buildCorsHeaders("https://attacker.com");
  assertEquals(h["Access-Control-Allow-Origin"], "null");
});
