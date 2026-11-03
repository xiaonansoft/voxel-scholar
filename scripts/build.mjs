import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { loadPack, packScript } from "./pack.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const bankFlag = process.argv.indexOf("--bank");
const bank = bankFlag === -1 ? "demo" : process.argv[bankFlag + 1];
if (!bank || bank.startsWith("-")) {
  console.error("usage: node scripts/build.mjs [--bank demo|extracted]");
  process.exit(1);
}

const pack = loadPack(root, bank);
const css = readFileSync(join(root, "src/styles.css"), "utf8");
const three = readFileSync(join(root, "vendor/three/three.r160.min.js"), "utf8");
const generators = readFileSync(join(root, "src/quiz/generators.js"), "utf8");
const pinyin = readFileSync(join(root, "src/quiz/pinyin-stroke.js"), "utf8");
const stem = readFileSync(join(root, "src/quiz/stem-guard.js"), "utf8");
const main = readFileSync(join(root, "src/game/main.js"), "utf8");
let html = readFileSync(join(root, "src/index.html"), "utf8");

function inlineScript(code, label) {
  if (code.includes("</script>")) {
    throw new Error(`${label} contains a closing script tag`);
  }
  return `<script>\n${code.trim()}\n</script>`;
}

if (css.includes("</style>")) throw new Error("CSS contains a closing style tag");

const start = "<!-- voxel-scholar:packs -->";
const end = "<!-- /voxel-scholar:packs -->";
const i = html.indexOf(start);
const j = html.indexOf(end);
if (i < 0 || j < 0 || j < i) throw new Error("pack markers missing in src/index.html");

const scripts = [
  inlineScript(three, "three.js"),
  inlineScript(packScript(pack), "question pack"),
  inlineScript(generators, "generators"),
  inlineScript(pinyin, "pinyin"),
  inlineScript(stem, "stem-guard"),
  inlineScript(main, "main"),
].join("\n");

html =
  html.slice(0, i) +
  `<!-- voxel-scholar offline bank=${bank} -->\n` +
  scripts +
  html.slice(j + end.length);
html = html.replace(
  '<link rel="stylesheet" href="./styles.css">',
  `<style>\n${css.trim()}\n</style>`,
);

const generatedDir = join(root, "src/generated");
mkdirSync(generatedDir, { recursive: true });
writeFileSync(join(generatedDir, "question-pack.js"), packScript(pack));

const dist = join(root, "dist");
mkdirSync(dist, { recursive: true });

const names =
  bank === "demo"
    ? ["voxel-scholar-offline.html", "方块备考_offline.html", "index.html"]
    : ["personal/voxel-scholar-offline.html", "personal/方块备考_offline.html"];

for (const name of names) {
  const path = join(dist, name);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, html);
  console.log("wrote", path, html.length);
}

if (bank === "extracted") {
  writeFileSync(
    join(dist, "personal/README.txt"),
    [
      "个人提取题库构建。题目带 NEED_REWRITE，不能当作已获教材授权。",
      "不要把这个目录发布成公开站点，除非你已经换成自编题目。",
      "默认公开构建请用 npm run build（示范题 ORIGINAL）。",
      "",
    ].join("\n"),
  );
}

console.log(`voxel-scholar build ok (bank=${bank})`);
