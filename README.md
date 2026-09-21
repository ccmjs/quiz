# ccmjs Quiz Component

A browser-based quiz component with configurable questions, optional immediate
feedback and extensions for scoring, persistence and navigation.

## Tests

From this repository, run:

```sh
node --test
```

The tests use Node.js's built-in `node:test` and `node:assert/strict` modules.
Use Node.js 22 or newer; no package installation or build step is required.
The component itself continues to run in the browser without Node.js.

`test/quiz.test.mjs` runs the actual component and selected extensions. Only
browser inputs, rendering and storage are replaced by small controlled test doubles.
Each test creates an independent instance.

Coverage includes:

- Lifecycle and extension event order, including asynchronous extension failures.
- Separation between configured questions and mutable result data.
- Answer submission with immediate feedback and evaluation during navigation
  without immediate feedback.
- Navigation boundaries, finishing and preserving results when `start()` is called.
- Re-evaluation after changing selections, including clearing previous selections.
- Restoring, saving and restarting attempts, including storage failures.
- Single-choice, multiple-choice and unanswered tri-state scoring.

These are logic tests, not browser end-to-end tests. They do not
verify rendered HTML, keyboard interaction, animations, or every optional UI
extension. Real database access and loading through the CCM framework are also
outside this test suite.

## Result storage

Enable the `store` extension and configure `results`:

```javascript
results: {
  key: "what_is_html",
  store: ["ccm.store", { name: "quiz-results", url: "http://localhost:8080" }],
  userSpecific: true,
  mode: "replace",
  _: { access: { get: "owner", set: "owner", del: "owner" } },
}
```

The app key is `results.key`, otherwise the component's `key`, otherwise a new
CCM key. With `userSpecific: true`, login is required and the result key is
`[app, realm, user]`; these fields are also stored separately for queries.
`mode: "append"` adds a generated attempt key. `replace` is the default.
Without user-specific storage, the key is the app key (or `[app, attempt]` for append).
App keys and realms follow `/^[a-z][a-z0-9_]{0,31}$/`.

Results are saved on `finish`, after evaluation. A failed save leaves the current
attempt and its key intact for retry. Restart creates fresh quiz state without
deleting submitted results. `_` supplies initial permissions only: updates read
and preserve the saved settings. Protected results require authentication even
when `userSpecific` is false. Ownership is assigned and enforced by the server.
The demo enables public reading from 21 September 2026 at 12:00 Europe/Berlin.

The store extension requests authentication only when saving user-specific or
protected results. For login before participation, configure `autoLogin: true`
on the user instance. The quiz emits `before-start` first, then embeds and starts
the user component before rendering questions. A before-start extension may
prepare or stop the quiz, but cannot assume that the user host is connected yet.
App and attempt keys are generated at start; user-specific results receive their
realm and user key on first save. Failed or cancelled logins retain the attempt.
Intermediate saving and restoration remain separate workflows.

### Result mapping

`results.mapper` optionally transforms a copy of the quiz state before saving.
It uses `ccm.helper.mapObject`, accepting a source-path → target-path mapping object
or a function (including one loaded through `ccm.load`). For example:

```javascript
mapper: { questions: "items" }
// Or: mapper: ["ccm.load", "././resources/mappers.mjs#result"]
```

Functions receive the state copy and must return an object; asynchronous functions
are also awaited. Without a mapper, the state is copied as before. The extension
then assigns `key`, `app`, and, for user-specific results, `realm` and `user`.
It supplies `_` from the existing record or the initial permission settings.
The mapper cannot override these managed fields. A mapping failure prevents the
write and preserves the attempt for retry. This mechanism does not prescribe a
shared analytics schema; that format can be agreed independently.

## Embedding and authentication UI

The quiz renders immediately when started. A configured `user` instance appears
in a persistent header at the top right; without it, no header is rendered.
The changing question/summary views share one main content area.
If a surrounding app needs a Start or Exit button, it controls when to call
`ccm.start(...)` and when to show or remove the embedded quiz.
