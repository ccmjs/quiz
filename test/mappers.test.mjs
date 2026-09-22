import test from "node:test";
import assert from "node:assert/strict";
import { result } from "../resources/mappers.mjs";
import { timestamps } from "../resources/extensions.mjs";
import { demo } from "../resources/configs.mjs";

test("analytics aggregates scored, partly correct and skipped tasks without mutating state", () => {
  const state = { startedAt: "2026-09-22T08:00:00Z", submittedAt: "2026-09-22T08:02:00Z", questions: [
    { key: "radio", type: "radio", evaluated: true, points: 1, answers: [{ correct: true, selected: true }, {}] },
    { key: "multi", type: "checkbox", evaluated: true, points: 1, answers: [{ correct: true, selected: true }, { correct: true }, {}] },
    { key: "skip", type: "radio", answers: [{ correct: true }] },
  ] };
  const before = structuredClone(state);
  const data = result(state);
  assert.deepEqual(data.score, { achieved: 2, maximum: 5 });
  assert.deepEqual(data.items.map(item => item.correct), [true, false, false]);
  assert.equal(data.schema, "ccm-result");
  assert.equal(data.version, 1);
  assert.equal(data.startedAt, state.startedAt);
  assert.equal(data.submittedAt, state.submittedAt);
  assert.deepEqual(state, before);
  assert.equal(data.questions, undefined);
  assert.deepEqual(result({ questions: [...state.questions].reverse() }).items.map(item => item.key), ["skip", "multi", "radio"]);
});

test("demo tasks have unique stable keys and mapper does not invent missing timestamps", () => {
  assert.equal(new Set(demo.questions.map(question => question.key)).size, demo.questions.length);
  const data = result({ questions: demo.questions });
  assert.equal(data.items.length, demo.questions.length);
  assert.equal(data.score.achieved, 0);
  assert.equal(data.startedAt, undefined);
  assert.throws(() => result({ questions: [{ answers: [] }] }), /stable question keys/);
});

test("timestamps survive repeated starts and retries but reset with a new attempt", () => {
  const app = { state: {} };
  timestamps({ app, type: "start" });
  timestamps({ app, type: "finish" });
  const first = { ...app.state };
  timestamps({ app, type: "start" });
  timestamps({ app, type: "finish" });
  assert.deepEqual(app.state, first);
  assert.ok(Number.isFinite(Date.parse(first.startedAt)));
  app.state = {};
  timestamps({ app, type: "start" });
  assert.equal(app.state.submittedAt, undefined);
});
