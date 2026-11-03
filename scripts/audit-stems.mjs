import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import { loadPack, packScript } from "./pack.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function read(rel) {
  return readFileSync(join(root, rel), "utf8");
}

export function loadStemFns() {
  const context = vm.createContext({ console });
  vm.runInContext(read("src/quiz/stem-guard.js"), context);
  return {
    countStemQMarks: context.countStemQMarks,
    stemHasMultiQuestion: context.stemHasMultiQuestion,
    sanitizeStemIfNeeded: context.sanitizeStemIfNeeded,
    auditQuestionStems: context.auditQuestionStems,
  };
}

export function collectStemRecords(pack) {
  const records = [];
  const groups = [
    ["yw", pack.yw],
    ["oldRj", pack.oldRj],
    ["xy", pack.xy],
    ["xm", pack.xm],
  ];
  for (const [name, group] of groups) {
    for (const key of Object.keys(group || {})) {
      const items = group[key];
      if (!Array.isArray(items)) continue;
      items.forEach((item, i) => {
        records.push({ q: item.q, meta: `${name}.${key}[${i}]`, licenseStatus: item.licenseStatus });
      });
    }
  }
  for (const [name, poem] of Object.entries(pack.poems || {})) {
    (poem.lines || []).forEach((line, i) => {
      records.push({ q: line, meta: `poem.${name}[${i}]`, licenseStatus: poem.licenseStatus });
    });
  }
  return records;
}

export function auditRecords(records, fns = loadStemFns()) {
  const bad = [];
  for (const rec of records) {
    if (fns.stemHasMultiQuestion(rec.q)) {
      bad.push({ ...rec, marks: fns.countStemQMarks(rec.q) });
    }
  }
  return { ok: bad.length === 0, bad, checked: records.length };
}

function runtimeSource(pack) {
  return [
    packScript(pack),
    read("src/quiz/generators.js"),
    read("src/quiz/pinyin-stroke.js"),
    read("src/quiz/stem-guard.js"),
    "globalThis.__EXPORT={BOOKS,auditQuestionStems,countStemQMarks,stemHasMultiQuestion,sanitizeStemIfNeeded};",
  ].join("\n");
}

export function loadRuntime(pack) {
  const context = vm.createContext({
    console,
    Math,
    JSON,
    Object,
    Array,
    Set,
    Map,
    String,
    Number,
    Boolean,
    Date,
    RegExp,
    Error,
    parseInt,
    parseFloat,
    isNaN,
    isFinite,
    Infinity,
    NaN,
    undefined,
    performance: { now: () => Date.now() },
  });
  context.globalThis = context;
  vm.runInContext(runtimeSource(pack), context, { filename: "voxel-scholar-runtime.js" });
  return context.__EXPORT;
}

/** Call every unit generator. Throws if a question is missing or has multiple question marks. */
export function smokeGenerators(pack, rounds = 4) {
  const exp = loadRuntime(pack);
  const problems = [];
  for (const ed of ["new", "old"]) {
    for (const sub of Object.keys(exp.BOOKS[ed])) {
      const units = exp.BOOKS[ed][sub];
      if (!Array.isArray(units)) continue;
      for (const unit of units) {
        for (let n = 0; n < rounds; n++) {
          let q;
          try {
            q = unit.gen();
          } catch (err) {
            problems.push(`${ed}.${sub}.${unit.id}#${n} threw ${err.message}`);
            break;
          }
          if (!q || typeof q.q !== "string" || !q.q.trim()) {
            problems.push(`${ed}.${sub}.${unit.id}#${n} missing stem`);
            break;
          }
          if (exp.stemHasMultiQuestion(q.q)) {
            problems.push(`${ed}.${sub}.${unit.id}#${n} multi: ${q.q}`);
          }
          if (q.t === "mc" && (!Array.isArray(q.opts) || !q.opts.includes(q.ans))) {
            problems.push(`${ed}.${sub}.${unit.id}#${n} options missing answer`);
          }
        }
      }
    }
  }
  const audited = exp.auditQuestionStems({ rounds });
  if (!audited.ok) {
    for (const item of audited.bad) problems.push(`audit ${item.meta}: ${item.q}`);
  }
  return { ok: problems.length === 0, problems, unitsChecked: true };
}

function argBank() {
  const i = process.argv.indexOf("--bank");
  if (i === -1) return "both";
  return process.argv[i + 1] || "demo";
}

const isMain = process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1];
if (isMain) {
  const which = argBank();
  const banks = which === "both" ? ["demo", "extracted"] : [which];
  const runtime = process.argv.includes("--runtime") || which === "both";
  let failed = false;
  for (const bank of banks) {
    const pack = loadPack(root, bank);
    const result = auditRecords(collectStemRecords(pack));
    console.log(`${bank} static stems: ${result.checked}, bad ${result.bad.length}`);
    if (!result.ok) {
      failed = true;
      for (const item of result.bad.slice(0, 20)) console.error(item.meta, item.q);
    }
    if (runtime) {
      const smoke = smokeGenerators(pack, bank === "demo" ? 4 : 2);
      console.log(`${bank} runtime: ${smoke.ok ? "ok" : smoke.problems.length + " problems"}`);
      if (!smoke.ok) {
        failed = true;
        for (const line of smoke.problems.slice(0, 20)) console.error(line);
      }
    }
  }
  if (failed) process.exit(1);
}
