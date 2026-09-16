import test from "node:test";
import assert from "node:assert/strict";
import { component } from "../ccm.quiz.mjs";
import { decisionScore, restore, store, restart } from "../resources/extensions.mjs";

// Run the real component and extensions; replace only rendering and browser inputs.
function create(config = {}) {
  const events = [], renders = [];
  let inputs = [];
  const app = Object.assign(new component.Instance(), component.config, {
    questions: [
      { text: "Single choice", type: "radio", answers: [{ text: "A", correct: true }, { text: "B" }] },
      { text: "Multiple choice", type: "checkbox", answers: [{ text: "C", correct: true }, { text: "D", correct: true }, { text: "E" }] },
    ],
    ccm: { helper: { isStore: value => !!value && typeof value.get === "function", isKey: value => typeof value === "string" && !!value } },
    element: { querySelectorAll: () => inputs },
    views: { question: app => app.state.questions[app.current] },
    ui: { render: question => renders.push(structuredClone(question)) },
    ...config,
    extensions: [({ type }) => events.push(type), ...[].concat(config.extensions || [])],
  });
  return { app, events, renders, answer: (...checked) => { inputs = checked.map(checked => ({ checked })); } };
}

test("lifecycle order and independent result data", async () => {
  const { app, events } = create();
  await app.init(); await app.ready(); await app.start();
  assert.deepEqual(events, ["init", "ready", "before-start", "render", "start"]);
  app.state.questions[0].answers[0].selected = true;
  assert.equal(app.questions[0].answers[0].selected, undefined);
  assert.equal(app.current, 0);
});

test("feedback evaluates before rendering and submitting", async () => {
  const { app, events, renders, answer } = create();
  await app.start(); events.length = 0; answer(true, false);
  await app.events.submit();
  assert.equal(app.state.questions[0].evaluated, true);
  assert.equal(app.state.questions[0].answers[0].selected, true);
  assert.equal(renders.at(-1).evaluated, true);
  assert.deepEqual(events, ["evaluate", "render", "submit"]);
});

test("without feedback next evaluates the old question and finish the last", async () => {
  const { app, events, answer } = create({ feedback: false });
  await app.start(); events.length = 0;
  await app.events.submit(); assert.deepEqual(events, []);
  answer(false, true); await app.events.next();
  assert.equal(app.state.questions[0].answers[1].selected, true);
  assert.equal(app.current, 1);
  assert.equal(app.state.questions[1].evaluated, undefined);
  assert.deepEqual(events, ["evaluate", "render", "next"]);
  answer(true, false, true); await app.events.finish();
  assert.equal(app.state.questions[1].evaluated, true);
  assert.deepEqual(events.slice(-2), ["evaluate", "finish"]);
});

test("next stops at the last question and feedback navigation does not evaluate", async () => {
  const { app, events } = create(); await app.start(); events.length = 0;
  await app.events.next(); await app.events.next();
  assert.equal(app.current, 1);
  assert.deepEqual(events, ["render", "next"]);
  assert.equal(app.state.questions[0].evaluated, undefined);
});

test("re-evaluation clears a previously selected answer", async () => {
  const { app, answer } = create(); await app.start();
  answer(true, false); await app.evaluate();
  answer(false, true); await app.evaluate();
  assert.equal(!!app.state.questions[0].answers[0].selected, false);
  assert.equal(app.state.questions[0].answers[1].selected, true);
});

test("start preserves restored answers and resets only navigation", async () => {
  const { app, answer } = create(); await app.start();
  answer(true, false); await app.evaluate(); await app.events.next();
  const state = app.state; await app.start();
  assert.equal(app.state, state); assert.equal(app.current, 0);
  assert.equal(app.state.questions[0].answers[0].selected, true);
});

test("extensions are awaited in order and failures stop subsequent extensions", async () => {
  const calls = [];
  const failure = new Error("extension failed");
  const { app } = create({ extensions: [
    async ({ app: instance, type }) => { assert.equal(instance, app); await Promise.resolve(); calls.push(type); },
    () => { calls.push("second"); throw failure; },
    () => calls.push("unreachable"),
  ] });
  await assert.rejects(app.emit("custom"), error => error === failure);
  assert.deepEqual(calls, ["custom", "second"]);
});

test("restore loads once before the first render", async () => {
  let reads = 0;
  const saved = { questions: [{ text: "Saved", answers: [], evaluated: true }] };
  const { app, renders } = create({ key: "attempt", store: { async get(key) { reads++; assert.equal(key, "attempt"); return saved; } }, extensions: [restore] });
  await app.start(); await app.start();
  assert.equal(reads, 1); assert.equal(app.state, saved);
  assert.equal(renders[0].text, "Saved");
});

test("storage receives evaluated state, and write failures propagate", async () => {
  const writes = [];
  const backend = { get() {}, async set(value) { writes.push(structuredClone(value)); } };
  const { app, answer } = create({ key: "attempt", store: backend, extensions: [store] });
  await app.start(); assert.equal(writes.length, 0);
  answer(true, false); await app.evaluate();
  assert.equal(writes[0].key, "attempt"); assert.equal(writes[0].questions[0].evaluated, true);
  const failure = new Error("offline"); backend.set = async () => { throw failure; };
  await assert.rejects(app.evaluate(), error => error === failure);
});

test("restart deletes the saved attempt and creates fresh results", async () => {
  const deleted = [];
  const { app, answer } = create({ key: "attempt", store: { get() {}, async del(key) { deleted.push(key); } }, extensions: [restart] });
  await app.start(); answer(true, false); await app.evaluate();
  const old = app.state; await app.events.finish();
  assert.deepEqual(deleted, ["attempt"]); assert.notEqual(app.state, old);
  assert.equal(app.state.questions[0].evaluated, undefined);
  assert.equal(app.state.questions[0].answers[0].selected, undefined);
});

test("decision scores single choice and multiple choice, with a floor of zero", async () => {
  const { app, answer } = create({ extensions: [decisionScore] }); await app.start();
  answer(true, false); await app.evaluate(); assert.equal(app.state.questions[0].points, 1);
  answer(false, true); await app.evaluate(); assert.equal(app.state.questions[0].points, 0);
  await app.events.next();
  answer(true, true, false); await app.evaluate(); assert.equal(app.state.questions[1].points, 3);
  answer(false, false, true); await app.evaluate(); assert.equal(app.state.questions[1].points, 0);
});

test("decision score ignores unanswered tri-state choices", async () => {
  const { app, answer } = create({ extensions: [decisionScore] }); await app.start(); await app.events.next();
  app.state.questions[1].answers.forEach(answer => { answer.tristate = 1; });
  answer(false, false, false); await app.evaluate(); assert.equal(app.state.questions[1].points, 0);
});
