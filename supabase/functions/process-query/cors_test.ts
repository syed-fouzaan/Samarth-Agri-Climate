import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { buildCorsHeaders, isOriginAllowed } from "../_shared/cors.ts";

Deno.test("allows localhost origin", () => {
  assertEquals(isOriginAllowed("http://localhost:3000"), true);
  assertEquals(isOriginAllowed("https://localhost"), true);
});

Deno.test("allows lovable preview / app / dev hosts", () => {
  assertEquals(isOriginAllowed("https://abc.lovable.app"), true);
  assertEquals(isOriginAllowed("https://x.lovableproject.com"), true);
  assertEquals(isOriginAllowed("https://id-preview--x.lovable.dev"), true);
});

Deno.test("rejects disallowed origins", () => {
  assertEquals(isOriginAllowed("https://evil.example.com"), false);
  assertEquals(isOriginAllowed("https://lovable.app.evil.com"), false);
  assertEquals(isOriginAllowed(null), false);
  assertEquals(isOriginAllowed(""), false);
});

Deno.test("CORS header reflects allowed origin verbatim", () => {
  const h = buildCorsHeaders("https://abc.lovable.app");
  assertEquals(h["Access-Control-Allow-Origin"], "https://abc.lovable.app");
  assertEquals(h["Vary"], "Origin");
});

Deno.test("CORS header sends 'null' for disallowed origin", () => {
  const h = buildCorsHeaders("https://evil.example.com");
  assertEquals(h["Access-Control-Allow-Origin"], "null");
});
