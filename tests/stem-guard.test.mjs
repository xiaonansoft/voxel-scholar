import assert from "node:assert/strict";
import { dirname, join } from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import {
  auditRecords,
  collectStemRecords,
  loadStemFns,
  smokeGenerators,
} from "../scripts/audit-stems.mjs";
import { loadPack } from "../scripts/pack.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const fns = loadStemFns();

test("countStemQMarks ignores ellipsis and counts both question marks", () => {
  assert.equal(fns.countStemQMarks("没有问号"), 0);
  assert.equal(fns.countStemQMarks("只有一句？"), 1);
  assert.equal(fns.countStemQMarks("one?"), 1);
  assert.equal(fns.countStemQMarks("第一句？第二句？"), 2);
  assert.equal(fns.countStemQMarks("等等……然后呢？"), 1);
  assert.equal(fns.countStemQMarks("wait... done?"), 1);
  assert.equal(fns.stemHasMultiQuestion("只有一句？"), false);
  assert.equal(fns.stemHasMultiQuestion("第一句？第二句？"), true);
});

test("sanitizeStemIfNeeded keeps a single question and the last question of a multi-stem", () => {
  assert.equal(fns.sanitizeStemIfNeeded("方块镇有几间小屋？"), "方块镇有几间小屋？");
  assert.equal(fns.sanitizeStemIfNeeded("没有问号的句子"), "没有问号的句子");
  const kept = fns.sanitizeStemIfNeeded("先问这个？再问方块有几个面？");
  assert.equal(fns.countStemQMarks(kept), 1);
  assert.match(kept, /方块有几个面？/);
});

test("demo and extracted JSON stems are single-question", () => {
  for (const bank of ["demo", "extracted"]) {
    const pack = loadPack(root, bank);
    const result = auditRecords(collectStemRecords(pack), fns);
    assert.ok(result.checked > 20, `${bank} checked ${result.checked}`);
    assert.deepEqual(result.bad, [], `${bank} multi-question stems`);
    const tagged = collectStemRecords(pack).filter((rec) => rec.licenseStatus);
    const expect = bank === "demo" ? "ORIGINAL" : "NEED_REWRITE";
    assert.ok(tagged.length > 10);
    assert.ok(tagged.every((rec) => rec.licenseStatus === expect));
  }
});

test("demo runtime generators stay playable and single-question", () => {
  const pack = loadPack(root, "demo");
  const smoke = smokeGenerators(pack, 3);
  assert.deepEqual(smoke.problems, []);
});

test("extracted runtime generators stay playable and single-question", () => {
  const pack = loadPack(root, "extracted");
  const smoke = smokeGenerators(pack, 2);
  assert.deepEqual(smoke.problems, []);
});
