import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import { basename, join } from "node:path";
import { test } from "node:test";

// Next renders a page alongside its layout, so the layout's sign-in check alone
// still streams the page's data to signed-out visitors. Every admin page checks itself.
test("Every protected admin page checks sign-in itself", async () => {
  const root = "app/admin/(protected)";
  const pages = (await readdir(root, { recursive: true })).filter(file => basename(file) === "page.tsx");
  assert.ok(pages.length >= 9);
  for (const page of pages) {
    const source = await readFile(join(root, page), "utf8");
    assert.match(source, /export default async function \w+\([^)]*\)[^{]*\{\s+(const \w+ = )?await requireAdmin\(\)/, `${page} must call requireAdmin() first`);
  }
});
