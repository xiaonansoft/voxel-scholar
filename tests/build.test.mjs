import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { spawnSync } from "node:child_process";
import test from "node:test";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

test("npm run build writes a self-contained 方块备考 offline page", () => {
  const run = spawnSync(process.execPath, [join(root, "scripts/build.mjs")], {
    cwd: root,
    encoding: "utf8",
  });
  assert.equal(run.status, 0, run.stderr || run.stdout);
  const en = readFileSync(join(root, "dist/voxel-scholar-offline.html"), "utf8");
  const zh = readFileSync(join(root, "dist/方块备考_offline.html"), "utf8");
  const index = readFileSync(join(root, "dist/index.html"), "utf8");
  assert.equal(en, zh);
  assert.equal(en, index);
  assert.match(en, /<title>方块备考 Block Prep<\/title>/);
  assert.match(en, /方块备考/);
  assert.match(en, /Block Prep/);
  assert.match(en, /!function\(t,e\)\{"object"==typeof exports/);
  assert.match(en, /THREE/);
  assert.match(en, /QUESTION_PACK/);
  assert.doesNotMatch(en, /我的世界/);
  assert.doesNotMatch(en, /Minecraft/);
  assert.doesNotMatch(en, /史蒂夫/);
  assert.doesNotMatch(en, /末影龙/);
  assert.doesNotMatch(en, /苦力怕/);
  assert.doesNotMatch(en, /<script[^>]+src=["']https?:/i);
  assert.doesNotMatch(en, /<link[^>]+href=["']https?:/i);
  assert.ok(en.length > 500_000);
});
