import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import { store, restart } from "../resources/extensions.mjs";

// Exercise the actual framework mapper for both declarative and functional mappings.
const window = {};
vm.runInNewContext(readFileSync(new URL("../libs/framework/ccm.js", import.meta.url), "utf8"), { window });

function create(options = {}) {
  let sequence = 0;
  const saved = new Map();
  const identity = { key: "alice", realm: "we_test" };
  const app = {
    key: "fallback", state: { questions: [] },
    element: { appendChild() {} },
    user: { login: async () => identity, getState: () => identity },
    ccm: { helper: {
      isStore: value => !!value?.set,
      isKey: window.ccm.helper.isKey,
      generateKey: () => `generated${++sequence}`,
      mapObject: window.ccm.helper.mapObject,
    } },
    results: {
      key: "what_is_html", userSpecific: true,
      _: { access: { get: "owner" } },
      store: {
        get: async key => structuredClone(saved.get(JSON.stringify(key)) ?? null),
        set: async data => saved.set(JSON.stringify(data.key), structuredClone(data)),
      },
      ...options,
    },
  };
  app.start = async () => {
    await store({ app, type: "before-start" });
    app.state ??= { questions: [] };
    await store({ app, type: "start" });
  };
  return { app, saved, identity };
}

test("replace uses app/realm/user, saves on finish and preserves changed permissions", async () => {
  const { app, saved } = create();
  await app.start();
  assert.equal(app.state.key, "what_is_html");
  assert.equal(app.state.app, "what_is_html");
  assert.equal(app.state.realm, undefined);
  assert.equal(app.state.user, undefined);
  await store({ app, type: "evaluate" });
  assert.equal(saved.size, 0);
  await store({ app, type: "finish" });
  const record = saved.values().next().value;
  record._.access.get = "all";
  await restart({ app, type: "finish" });
  await store({ app, type: "finish" });
  assert.equal(saved.size, 1);
  assert.equal(saved.values().next().value._.access.get, "all");
  assert.equal(app.results._.access.get, "owner");
});

test("append creates one key per attempt and retries an uncertain write without duplicates", async () => {
  const { app, saved } = create({ mode: "append" });
  await app.start();
  const set = app.results.store.set;
  app.results.store.set = async data => { await set(data); throw new Error("response lost"); };
  await assert.rejects(store({ app, type: "finish" }), /response lost/);
  const key = [...app.state.key];
  app.results.store.set = set;
  await store({ app, type: "finish" });
  assert.deepEqual(app.state.key, key);
  assert.equal(saved.size, 1);
  await restart({ app, type: "finish" });
  assert.notDeepEqual(app.state.key, key);
  await store({ app, type: "finish" });
  assert.equal(saved.size, 2);
});

test("key fallback and anonymous results work without a user component", async () => {
  const { app } = create({ key: undefined, userSpecific: false, _: undefined });
  delete app.user;
  await app.start();
  assert.equal(app.state.key, "fallback");
  assert.equal(app.state.user, undefined);
  delete app.key; delete app.state;
  await app.start();
  const key = app.state.key;
  assert.match(key, /^generated/);
  await app.start();
  assert.equal(app.state.key, key);
});

test("changed accounts cannot take over ongoing attempts", async () => {
  const { app, identity, saved } = create();
  await app.start();
  await store({ app, type: "finish" });
  identity.key = "bob";
  await assert.rejects(store({ app, type: "finish" }), /account that started/);
  assert.equal(saved.size, 1);
});

test("existing public records remain public rather than acquiring initial permissions", async () => {
  const { app, saved } = create();
  await app.start();
  const savedKey = ["what_is_html", "we_test", "alice"];
  saved.set(JSON.stringify(savedKey), { key: savedKey });
  await store({ app, type: "finish" });
  assert.equal(Object.hasOwn(saved.values().next().value, "_"), false);
});


test("on-demand is the default and binds the user only when saving", async () => {
  const { app, saved } = create({ mode: "append" });
  let calls = 0;
  app.user.login = async () => { calls++; return { realm: "we_test", key: "alice" }; };
  await app.start();
  const attempt = app.state.key[1];
  assert.equal(calls, 0);
  assert.equal(app.state.user, undefined);
  await store({ app, type: "evaluate" });
  assert.equal(calls, 0);
  await store({ app, type: "finish" });
  assert.equal(calls, 1);
  assert.deepEqual(app.state.key, ["what_is_html", "we_test", "alice", attempt]);
  assert.equal(saved.size, 1);
});

test("cancelled on-demand login preserves the provisional key for a later submission", async () => {
  const { app, saved } = create({ mode: "append" });
  await app.start();
  const provisional = [...app.state.key];
  app.user.login = async () => { throw new Error("cancelled"); };
  await assert.rejects(store({ app, type: "finish" }), /cancelled/);
  assert.deepEqual(app.state.key, provisional);
  assert.equal(saved.size, 0);
  app.user.login = async () => ({ realm: "we_test", key: "alice" });
  await store({ app, type: "finish" });
  assert.equal(app.state.key.at(-1), provisional.at(-1));
});

test("declarative mapping changes result shape while preserving submission metadata", async () => {
  const { app, saved } = create({ mapper: { questions: "items" } });
  app.state.questions = [{ points: 2 }];
  await app.start();
  await store({ app, type: "finish" });
  const data = saved.values().next().value;
  assert.deepEqual(data.items, [{ points: 2 }]);
  assert.equal(data.questions, undefined);
  assert.deepEqual(data.key, app.state.key);
  assert.equal(data.user, "alice");
  assert.equal(data.realm, "we_test");
  assert.equal(data.app, "what_is_html");
});

test("functional mapper gets a copy and cannot override metadata or saved permissions", async () => {
  const { app, saved } = create({ mapper: async state => {
    state.questions.push({ points: 99 });
    return { score: 5, key: "forged", app: "other", user: "bob", realm: "other", _: {} };
  } });
  await app.start();
  const savedKey = ["what_is_html", "we_test", "alice"];
  saved.set(JSON.stringify(savedKey), { key: savedKey, _: { access: { get: "all" } } });
  await store({ app, type: "finish" });
  const data = saved.values().next().value;
  assert.equal(app.state.questions.length, 0);
  assert.equal(data.score, 5);
  assert.equal(data.user, "alice");
  assert.equal(data.realm, "we_test");
  assert.equal(data.app, "what_is_html");
  assert.equal(data._.access.get, "all");
  assert.deepEqual(data.key, app.state.key);
});

test("mapping failures prevent writes and retain the attempt for retry", async () => {
  const { app, saved } = create({ mapper: () => null });
  await app.start();
  await assert.rejects(store({ app, type: "finish" }), /return an object/);
  const key = structuredClone(app.state.key);
  app.results.mapper = () => { throw new Error("mapping failed"); };
  await assert.rejects(store({ app, type: "finish" }), /mapping failed/);
  assert.equal(saved.size, 0);
  assert.deepEqual(app.state.key, key);
});

test("app and identity key parts reject arrays even though compound dataset keys are valid", async () => {
  const invalidApp = create({ key: ["quiz"] });
  await assert.rejects(invalidApp.app.start(), /simple CCM key/);
  for (const field of ["realm", "key"]) {
    const { app, identity, saved } = create();
    await app.start();
    identity[field] = [identity[field]];
    await assert.rejects(store({ app, type: "finish" }), /valid realm and user key/);
    assert.equal(saved.size, 0);
  }
});
