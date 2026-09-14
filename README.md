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
