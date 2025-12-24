import { copyFileSync, mkdirSync } from "fs";
import { $ } from "bun";

const dist = "./dist";

// Clean and create dist directory
mkdirSync(dist, { recursive: true });
mkdirSync(`${dist}/popup`, { recursive: true });

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

// Build popup JS
const popupBuild = await Bun.build({
  entrypoints: ["./src/popup/main.tsx"],
  outdir: `${dist}/popup`,
  target: "browser",
});

if (!popupBuild.success) {
  console.error("Popup build failed:", popupBuild.logs);
  process.exit(1);
}

// Build CSS with Tailwind
await $`bunx tailwindcss -i ./src/popup/index.css -o ${dist}/popup/main.css --minify`;

// Copy static files
copyFileSync("./manifest.json", `${dist}/manifest.json`);
copyFileSync("./src/popup/index.html", `${dist}/popup/index.html`);

console.log("Build complete!");
