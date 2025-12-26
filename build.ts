import { copyFileSync, mkdirSync } from "fs";
import { $ } from "bun";

const dist = "./dist";

// Clean and create dist directory
mkdirSync(dist, { recursive: true });
mkdirSync(`${dist}/sidepanel`, { recursive: true });

// Build content script
const contentBuild = await Bun.build({
  entrypoints: ["./src/content.ts"],
  outdir: dist,
  target: "browser",
});

if (!contentBuild.success) {
  console.error("Content script build failed:", contentBuild.logs);
  process.exit(1);
}

// Rename content script
const contentOutput = contentBuild.outputs[0];
if (contentOutput) {
  await $`mv ${contentOutput.path} ${dist}/content.js`;
}

// Build background service worker
const backgroundBuild = await Bun.build({
  entrypoints: ["./src/background.ts"],
  outdir: dist,
  target: "browser",
});

if (!backgroundBuild.success) {
  console.error("Background build failed:", backgroundBuild.logs);
  process.exit(1);
}

// Rename background script
const backgroundOutput = backgroundBuild.outputs[0];
if (backgroundOutput) {
  await $`mv ${backgroundOutput.path} ${dist}/background.js`;
}

// Build sidepanel JS
const sidepanelBuild = await Bun.build({
  entrypoints: ["./src/sidepanel/main.tsx"],
  outdir: `${dist}/sidepanel`,
  target: "browser",
});

if (!sidepanelBuild.success) {
  console.error("Sidepanel build failed:", sidepanelBuild.logs);
  process.exit(1);
}

// Build CSS with Tailwind
await $`bunx tailwindcss -i ./src/sidepanel/index.css -o ${dist}/sidepanel/main.css --minify`;

// Copy static files
copyFileSync("./manifest.json", `${dist}/manifest.json`);
copyFileSync("./src/sidepanel/index.html", `${dist}/sidepanel/index.html`);

console.log("Build complete!");
