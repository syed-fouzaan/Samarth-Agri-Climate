import { describe, it, expect } from "vitest";
import fs from "node:fs";
import path from "node:path";

/**
 * Frontend-side regression guard for edge function CORS.
 * Ensures no edge function reintroduces wildcard CORS or removes
 * the shared allow-list helper.
 */
const FUNCTIONS_DIR = path.resolve(__dirname, "../../supabase/functions");

function listFunctionEntrypoints(): string[] {
  return fs
    .readdirSync(FUNCTIONS_DIR, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("_"))
    .map((d) => path.join(FUNCTIONS_DIR, d.name, "index.ts"))
    .filter((p) => fs.existsSync(p));
}

describe("edge function CORS configuration", () => {
  const files = listFunctionEntrypoints();

  it("discovers at least one edge function", () => {
    expect(files.length).toBeGreaterThan(0);
  });

  it.each(files)("%s does not use wildcard CORS", (file) => {
    const src = fs.readFileSync(file, "utf8");
    expect(src).not.toMatch(/['"]Access-Control-Allow-Origin['"]\s*:\s*['"]\*['"]/);
  });

  it.each(files)("%s validates JWT via getClaims()", (file) => {
    const src = fs.readFileSync(file, "utf8");
    expect(src).toMatch(/getClaims\(/);
  });
});
