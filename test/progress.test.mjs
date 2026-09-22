import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { component } from "../ccm.quiz.mjs";
import { restore, store, shuffleQuestions, randomAnswers, decisionScore, timestamps, restart, prevButton } from "../resources/extensions.mjs";

const window = {};
vm.runInNewContext(readFileSync(new URL("../libs/framework/ccm.js", import.meta.url), "utf8"), { window });
let sequence = 0;
const draftKey = ["quiz", "we_test", "alice", "progress"];

/** A shared datastore models server persistence across independently created quiz instances. */
function backend() {
  const records = new Map();
  return {
    records,
    async get(key) { return structuredClone(records.get(JSON.stringify(key)) ?? null); },
    async set(data) { records.set(JSON.stringify(data.key), structuredClone(data)); },
    async del(key) { records.delete(JSON.stringify(key)); },
  };
}

/** Exercise real lifecycle and extensions; substitute only the datastore, login and DOM rendering. */
function create(storage, options = {}) {
  let inputs = [];
  const identity = { realm: "we_test", key: "alice" };
  const app = Object.assign(new component.Instance(), component.config, {
    questions: ["one", "two", "three"].map(key => ({
      key, text: key, type: "radio", answers: [{ text: "yes", correct: true }, { text: "no" }],
    })),
    ccm: { helper: { ...window.ccm.helper, isStore: value => !!value?.get && !!value?.set, generateKey: () => `attempt${++sequence}` } },
    element: { querySelector: () => ({ setAttribute() {} }), querySelectorAll: () => inputs },
    views: { main: () => null, question: () => null }, ui: { render() {} },
    user: { async start() {}, async login() { assert.ok(app.content); return identity; } },
    results: {
      key: "quiz", store: storage, userSpecific: true,
      _: { access: { get: "all", set: "owner", del: "owner" } }, ...options,
    },
    extensions: [restore, shuffleQuestions, randomAnswers, timestamps, decisionScore, store],
  });
  return { app, identity, answer: () => { inputs = app.state.questions[app.current].answers.map(a => ({ checked: !!a.correct })); } };
}

test("reload restores confirmed answers, score, original order and last navigation, without running mapper", async () => {
  const storage = backend();
  const options = { mapper() { throw new Error("Only final results are mapped"); } };
  const first = create(storage, options);
  await first.app.start(); first.answer(); await first.app.events.submit();
  first.app.current = 2; await first.app.emit("jump");
  const saved = await storage.get(draftKey);
  assert.equal(saved.status, "in-progress");
  assert.equal(saved.state.questions[0].points, 1);
  assert.equal(saved.state.questions[1].evaluated, undefined);
  assert.deepEqual(saved._.access, { get: "owner", set: "owner", del: "owner" });
  const second = create(storage, options);
  await second.app.start();
  assert.equal(second.app.current, 2);
  assert.deepEqual(second.app.state, saved.state);
});

test("navigation does not persist unconfirmed checkbox changes", async () => {
  const storage = backend(); const { app } = create(storage);
  await app.start();
  const question = app.state.questions[0];
  question.answers[0].tristate = 3; question.answers[0].selected = true;
  await app.events.next();
  const saved = await storage.get(draftKey);
  assert.equal(saved.state.questions[0].answers[0].tristate, undefined);
  assert.equal(saved.state.questions[0].answers[0].selected, undefined);
  assert.equal(question.answers[0].tristate, 3);
});

test("a lost append response survives reload and retry without another submitted record", async () => {
  const storage = backend(); let fail = true;
  const set = storage.set.bind(storage);
  storage.set = async data => {
    await set(data);
    if (data.status === "submitted" && fail) { fail = false; throw new Error("Lost response"); }
  };
  const first = create(storage, { mode: "append" });
  await first.app.start(); first.answer(); await first.app.events.submit();
  const key = structuredClone(first.app.state.key);
  await assert.rejects(first.app.events.finish(), /Lost response/);
  assert.ok(await storage.get(draftKey));
  const second = create(storage, { mode: "append" }); await second.app.start();
  assert.deepEqual(second.app.state.key, key);
  await second.app.events.finish();
  assert.equal(await storage.get(draftKey), null);
  assert.equal(storage.records.size, 1);
  assert.equal((await storage.get(key)).status, "submitted");
});

test("deletion failure stops restart; retry clears draft before beginning the next attempt", async () => {
  const storage = backend(); const { app } = create(storage, { mode: "append" });
  app.extensions.push(restart);
  await app.start(); const key = structuredClone(app.state.key);
  const del = storage.del.bind(storage); let fail = true;
  storage.del = async key => { if (fail) { fail = false; throw new Error("Delete failed"); } await del(key); };
  await assert.rejects(app.events.finish(), /Delete failed/);
  assert.deepEqual(app.state.key, key);
  await app.events.finish();
  assert.equal(await storage.get(draftKey), null);
  assert.notDeepEqual(app.state.key, key);
  assert.equal(storage.records.size, 1);
});

test("busy rejects overlapping actions and releases interaction after success or failure", async () => {
  const storage = backend(); const { app } = create(storage); await app.start();
  const set = storage.set.bind(storage); let release;
  storage.set = async data => {
    await new Promise(resolve => { release = resolve; });
    await set(data);
  };
  const first = app.events.next();
  while (!release) await new Promise(resolve => setImmediate(resolve));
  assert.equal(app.gui.busy, true);
  assert.equal(app.content.inert, true);
  await app.events.next(); await app.events.submit(); await app.events.finish();
  assert.equal(app.current, 1);
  assert.equal(app.state.questions[1].evaluated, undefined);
  release(); await first;
  assert.equal((await storage.get(draftKey)).position, 1);
  assert.equal(app.gui.busy, false);
  assert.equal(app.content.inert, false);
  storage.set = async () => { throw new Error("Offline"); };
  await assert.rejects(app.events.next(), /Offline/);
  assert.equal(app.gui.busy, false);
  assert.equal(app.content.inert, false);
  storage.set = set;
  await app.events.submit();
  assert.equal((await storage.get(draftKey)).position, 2);
});

test("drafts remain private for non-user-specific results and reject an account change", async () => {
  const storage = backend(); const { app, identity } = create(storage, { userSpecific: false });
  await app.start(); await app.emit("jump");
  assert.equal(app.state.key, "quiz");
  assert.equal((await storage.get(draftKey)).user, "alice");
  identity.key = "bob";
  await assert.rejects(app.emit("jump"), /account that started/);
});

test("invalid drafts are not replaced, and progress needs a stable app key", async () => {
  const storage = backend(); await storage.set({ key: draftKey, status: "submitted" });
  const { app } = create(storage);
  await assert.rejects(app.start(), /Invalid saved quiz progress/);
  assert.equal((await storage.get(draftKey)).status, "submitted");
  const other = create(backend(), { key: undefined }).app;
  await assert.rejects(other.start(), /stable results.key/);
});

test("previous navigation waits for evaluation and rendering before saving", async () => {
  const order = [];
  const app = { feedback: false, current: 1, events: {}, run: action => action(),
    async evaluate() { await Promise.resolve(); order.push(`evaluate:${app.current}`); },
    async renderQuestion() { await Promise.resolve(); order.push(`render:${app.current}`); },
    async emit(type) { order.push(type); },
  };
  prevButton({ app, type: "ready" }); await app.events.prev();
  assert.deepEqual(order, ["evaluate:1", "render:0", "prev"]);
});

test("create runs only for new state, and restored state is used for the first render", async () => {
  const storage = backend(); const first = create(storage);
  let creates = 0;
  first.app.extensions.push(({ type }) => { if (type === "create") creates++; });
  await first.app.start();
  const order = structuredClone(first.app.state.questions);
  await first.app.start();
  assert.equal(creates, 1);
  assert.deepEqual(first.app.state.questions, order);
  first.app.current = 2; await first.app.emit("jump");
  const second = create(storage);
  const rendered = [];
  second.app.extensions.push(({ app, type }) => {
    if (type === "create") throw new Error("Restored attempts must not emit create");
    if (type === "render") rendered.push({ current: app.current, questions: structuredClone(app.state.questions) });
  });
  await second.app.start();
  assert.deepEqual(rendered, [{ current: 2, questions: order }]);
});

test("the finishing action keeps its lock through a nested restart and remaining extensions", async () => {
  const storage = backend(); const { app } = create(storage);
  let release;
  app.extensions.push(restart, async ({ type }) => {
    if (type === "finish") await new Promise(resolve => { release = resolve; });
  });
  await app.start(); const old = app.state;
  const finishing = app.events.finish();
  while (!release) await new Promise(resolve => setImmediate(resolve));
  assert.notEqual(app.state, old);
  assert.equal(app.gui.busy, true);
  assert.equal(app.content.inert, true);
  await app.events.next();
  assert.equal(app.current, 0);
  release(); await finishing;
  assert.equal(app.gui.busy, false);
  assert.equal(app.content.inert, false);
});

test("restoration failure releases the UI and can be retried", async () => {
  const storage = backend(); const { app } = create(storage);
  const get = storage.get.bind(storage);
  storage.get = async () => { throw new Error("Offline"); };
  await assert.rejects(app.start(), /Offline/);
  assert.equal(app.gui.busy, false);
  assert.equal(app.content.inert, false);
  assert.equal(app.state, undefined);
  storage.get = get; await app.start();
  assert.ok(app.state);
});

test("non-user-specific submissions omit the draft identity and remove their private draft", async () => {
  const storage = backend(); const { app } = create(storage, { userSpecific: false });
  await app.start(); await app.events.next(); await app.events.finish();
  const result = await storage.get("quiz");
  assert.equal(result.status, "submitted");
  assert.equal(result.realm, undefined);
  assert.equal(result.user, undefined);
  assert.equal(await storage.get(draftKey), null);
});
