// Builds a single double-clickable standalone.html from src/ — no bundler.
// It concatenates the ES modules in dependency order, strips import/export
// keywords, inlines styles.css, and appends the startGame() call from main.js.
//
//   node tools/build-standalone.mjs
//
// Note: sprite PNGs only load when served over http (dev server or a deployed
// site); opened from file:// the game runs on its procedural art.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (f) => readFileSync(join(root, "src", f), "utf8");

// Dependency order: leaves first, entry (game) last.
const MODULE_ORDER = [
  "storage.js",
  "core.js",
  "world.js",
  "decor.js",
  "scenarios.js",
  "sideQuests.js",
  "collectables.js",
  "quiz.js",
  "cosmetics.js",
  "progression.js",
  "pools.js",
  "render.js",
  "theme.js",
  "savefile.js",
  "ui.js",
  "comms.js",
  "ledger.js",
  "visitors.js",
  "training.js",
  "clock.js",
  "net.js",
  "soc.js",
  "flows.js",
  "days.js",
  "score.js",
  "game.js"
];

// Every src/*.js except main.js must be listed, or the standalone silently
// omits it and throws on boot. Fail the build loudly instead.
{
  const { readdirSync } = await import("node:fs");
  const all = readdirSync(join(root, "src")).filter((f) => f.endsWith(".js") && f !== "main.js");
  const missing = all.filter((f) => !MODULE_ORDER.includes(f));
  if (missing.length) { console.error("MODULE_ORDER is missing: " + missing.join(", ")); process.exit(1); }
}

// Remove `import ... from "...";` (including multi-line) and `export ` prefixes.
function strip(code) {
  return code
    .replace(/import\s+[\s\S]*?from\s*["'][^"']+["'];?/g, "")
    .replace(/^\s*export\s+/gm, "")
    .trim();
}

const modules = MODULE_ORDER
  .map((f) => `/* ===== src/${f} ===== */\n${strip(src(f))}`)
  .join("\n\n");

const css = readFileSync(join(root, "src", "styles.css"), "utf8").trim();

// Body markup from index.html, minus the head <link> and the module <script>.
const indexHtml = readFileSync(join(root, "index.html"), "utf8");
const bodyInner = indexHtml
  .replace(/[\s\S]*<body>/, "")
  .replace(/<\/body>[\s\S]*/, "")
  .replace(/\s*<script[^>]*src=["'][^"']*main\.js["'][^>]*><\/script>/, "")
  .trim();

const out = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
<title>The Ticket Queue: Cutover Week</title>
<!-- STANDALONE BUILD: double-click to play, no Node/build needed. -->
<!-- Auto-generated from src/ by tools/build-standalone.mjs. Do not hand-edit. -->
<!-- Sprite PNGs only load when served over http (dev server or deployed site). -->
<style>
${css}
</style>
</head>
<body>
${bodyInner}
<script type="module">
${modules}

startGame();
</script>
</body>
</html>
`;

writeFileSync(join(root, "standalone.html"), out, "utf8");
console.log(`Wrote standalone.html (${(out.length / 1024).toFixed(1)} KB)`);
