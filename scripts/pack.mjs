import { readFileSync } from "node:fs";
import { join } from "node:path";

function readJson(path) {
  return JSON.parse(readFileSync(path, "utf8"));
}

/** Normalize demo or extracted question files into the runtime QUESTION_PACK shape. */
export function loadPack(root, bank) {
  const strokes = readJson(join(root, "data/strokes/hzd.json"));
  if (!strokes.characters || typeof strokes.characters !== "object") {
    throw new Error("data/strokes/hzd.json is missing characters");
  }
  if (bank === "demo") {
    const b = readJson(join(root, "data/questions/demo/bank.json"));
    const py = readJson(join(root, "data/questions/demo/pinyin-lexicon.json"));
    return {
      bank: "demo",
      licenseStatus: "ORIGINAL",
      poems: b.poems || {},
      authors: b.authors || [],
      yw: b.yw,
      oldRj: b.oldRj,
      xy: b.xy,
      xm: b.xm,
      unitNames: b.unitNames || null,
      editionNames: b.editionNames || null,
      hzd: strokes.characters,
      pyd: py.entries,
    };
  }
  if (bank === "extracted") {
    const yw = readJson(join(root, "data/questions/extracted/yuwen.json"));
    const oldRj = readJson(join(root, "data/questions/extracted/yuwen-old.json"));
    const xy = readJson(join(root, "data/questions/extracted/yuwen-practice.json"));
    const xm = readJson(join(root, "data/questions/extracted/math-practice.json"));
    const poems = readJson(join(root, "data/questions/extracted/poems.json"));
    const py = readJson(join(root, "data/questions/extracted/pinyin-lexicon.json"));
    return {
      bank: "extracted",
      licenseStatus: "NEED_REWRITE",
      poems: poems.poems || {},
      authors: poems.authors || [],
      yw: yw.groups,
      oldRj: oldRj.groups,
      xy: xy.groups,
      xm: xm.groups,
      unitNames: null,
      editionNames: null,
      hzd: strokes.characters,
      pyd: py.entries,
    };
  }
  throw new Error(`unknown bank "${bank}" (use demo or extracted)`);
}

export function packScript(pack) {
  const json = JSON.stringify(pack).replace(/</g, "\\u003c");
  return `const QUESTION_PACK=${json};\nconst HZD=QUESTION_PACK.hzd;\nconst PYD=QUESTION_PACK.pyd;\n`;
}
