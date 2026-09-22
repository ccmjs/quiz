/**
 * Optional quiz extensions, loaded individually through ccm.load with a #function export.
 * Each receives { app, type }; events are dispatched sequentially in config.extensions order.
 * Lifecycle: ready -> before-start -> restore (when state is absent) -> create (if still absent)
 * -> render -> start. User actions evaluate/render as needed, then emit submit/next/prev/jump/finish.
 * store emits stored after writing the final result, before later finish extensions run.
 * UI extensions rely on the selectors in resources/views.mjs. Use app.run for async user actions.
 */

/**
 * Encodes question text, descriptions and answer text as HTML entities during ready.
 * Changes app.questions before it is copied into an attempt; answer comments are untouched.
 * Only needed for templates expecting pre-escaped strings. ccm-ui's html template already
 * escapes plain strings, so combining both can display the entities themselves.
 * @param {Object} event - Quiz event with app and type.
 */
export async function escapeHTML({ app, type }) {
  if (type !== "ready") return;
  app.questions.forEach((question) => {
    question.text = escape(question.text);
    if (question.description) question.description = escape(question.description);
    question.answers.forEach((answer) => (answer.text = escape(answer.text)));
  });
}

/**
 * Restores a personal attempt and saves confirmed answers and navigation in `results.store`.
 * Enable before `store` extension. A stable `results.key` (or `app.key`) and a user component are required.
 * Drafts remain private and bypass the result mapper. Position means the open question,
 * not completion. User actions await their save while the quiz holds `gui.busy`.
 * On restore, loads [app, realm, user, "progress"]; on start, prepares the stable result key.
 * Saves on submit/next/prev/jump and finish; stored deletes the draft after successful submission.
 * finish also saves the last evaluated answer when feedback is disabled.
 * @param {Object} event - Quiz event containing `app` and `type`.
 * @returns {Promise<void>} Rejects on failed authentication, loading, saving or deletion.
 */
export async function restore({ app, type }) {
  if (!["restore", "start", "submit", "next", "prev", "jump", "finish", "stored"].includes(type)) return;
  const results = app.results;
  if (!results || !app.ccm.helper.isStore(results.store)) return;
  const appKey = results.key ?? app.key;
  if (!app.ccm.helper.isKey(appKey, false))
    throw new Error("Restoring progress requires a stable results.key or app.key.");
  if (!app.user) throw new Error("Private progress requires a user component.");
  const identity = await app.user.login();
  validateIdentity(app, identity);
  if (app.state?.user !== undefined && (app.state.realm !== identity.realm || app.state.user !== identity.key))
    throw new Error("Sign in with the account that started this attempt.");
  const key = [appKey, identity.realm, identity.key, "progress"];

  if (type === "restore") {
    // The quiz requests restoration before creating state, with the user host already attached.
    const saved = await results.store.get(key);
    if (!saved) return;
    const state = saved.state;
    const position = saved.position;
    if (
      !state ||
      state.app !== appKey ||
      !app.ccm.helper.isKey(state.key) ||
      !Array.isArray(state.questions) ||
      !state.questions.every((question) => Array.isArray(question?.answers)) ||
      !Number.isInteger(position) ||
      position < 0 ||
      position >= state.questions.length
    )
      throw new Error("Invalid saved quiz progress.");
    app.state = state;
    app.current = position;
    return;
  }
  if (type === "start") {
    // Retain the final submission key in the draft, including a unique append attempt key.
    prepareResultKey(app);
    if (results.userSpecific) bindUser(app, identity);
    // Even shared results have personal drafts; final storage removes these fields when not user-specific.
    app.state.realm = identity.realm;
    app.state.user = identity.key;
    return;
  }
  if (type === "stored") {
    // Only a successful final result write emits this event; a failure leaves the draft available.
    await results.store.del(key);
    return;
  }
  const state = structuredClone(app.state);
  for (const question of state.questions) {
    if (question.evaluated) continue;
    // Checkbox clicks change tristate immediately; unconfirmed input is not a saved answer.
    for (const answer of question.answers) {
      delete answer.selected;
      delete answer.tristate;
    }
  }
  const previous = await results.store.get(key);
  await results.store.set({
    key,
    app: state.app,
    realm: state.realm,
    user: state.user,
    status: "in-progress",
    state,
    position: app.current,
    _: previous?._ ?? { access: { get: "owner", set: "owner", del: "owner" } },
  });
}

/**
 * Shuffles questions in place on create, preserving order on restoration and repeated starts.
 * @param {Object} event - Quiz event with app and type.
 */
export function shuffleQuestions({ app, type }) {
  if (type === "create") shuffle(app.state.questions);
}

/**
 * Shuffles each question's answers in place on create; restored answer order stays intact.
 * @param {Object} event - Quiz event with app and type.
 */
export function randomAnswers({ app, type }) {
  if (type === "create") app.state.questions.forEach((question) => shuffle(question.answers));
}

/**
 * Records attempt times for analytics; enable before store and restart.
 * Sets state.startedAt on start and state.submittedAt on the first finish event (UTC ISO strings).
 * submittedAt describes the submission attempt, not the server's confirmed storage time.
 * Re-rendering and retried submissions retain their original timestamps.
 * @param {Object} event - Quiz event with app and type.
 */
export function timestamps({ app, type }) {
  if (type === "start") app.state.startedAt ??= new Date().toISOString();
  if (type === "finish") app.state.submittedAt ??= new Date().toISOString();
}

/**
 * Shows a summary before the actual finish action, when feedback is enabled.
 * On ready, remembers the original handler; on start, replaces it for this attempt.
 * The first Finish click shows the summary without emitting finish or submitting results.
 * The summary's Finish button then invokes the original handler, including storage/restart.
 * Uses question.points when the total is nonzero; otherwise shows fully correct questions.
 * Optional config: duration (animation milliseconds, default 800), labels.points and labels.corrects.
 * @param {Object} event - Quiz event with app and type.
 */
export function summary({ app, type }) {
  if (!app.feedback) return;
  if (type === "ready") app.events.finish2 = app.events.finish;
  if (type !== "start") return;
  if (app.events.finish !== app.events.finish2) return;

  app.events.finish = () =>
    app.run(async () => {
      const total = app.state.questions.length;
      let correct = 0;
      let max = 0;
      let points = 0;

      app.state.questions.forEach((question) => {
        question.answers.every((answer) => answer.selected === answer.correct) && correct++;
        max += question.type === "radio" ? 1 : question.answers.length;
        points += question.points || 0;
      });

      app.ui.render(
        app.ui.html`
        <section class="summary">
          <h1>Summary</h1>
          <p>
            ${
              points
                ? app.ui.html`
                  <progress value="${points}" max="${max}"></progress>
                  ${points} / ${max} ${app.labels.points || "points"}
                `
                : app.ui.html`
                  <progress value="${correct}" max="${total}"></progress>
                  ${correct} / ${total} ${app.labels.corrects || "correct"}
                `
            }
          </p>
          <nav>
            <button data-on-click="finish">${app.labels.finish}</button>
          </nav>
        </section>
      `,
        app.content,
        app,
      );

      // Animate from zero to the result; duration uses milliseconds.
      const progress = app.element.querySelector("progress");
      const target = progress.value;
      progress.value = 0;
      const duration = app.duration || 800;
      const start = performance.now();
      function animate(now) {
        const t = Math.min((now - start) / duration, 1);
        // ease-out
        progress.value = target * (1 - Math.pow(1 - t, 3));
        if (t < 1) requestAnimationFrame(animate);
      }
      requestAnimationFrame(animate);

      // The next Finish click submits instead of showing this summary again.
      app.events.finish = app.events.finish2;
    });
}

/**
 * Appends a progress bar on render, counting evaluated questions regardless of correctness.
 * Skipped questions do not count; the current navigation position does not affect progress.
 * Expects the question template to be rendered inside the quiz's main element.
 * @param {Object} event - Quiz event with app and type.
 */
export function progressBar({ app, type }) {
  if (type !== "render") return;
  const total = app.state.questions.length;
  const evaluated = app.state.questions.filter((question) => question.evaluated).length;
  const progress = app.ui.html`
    <div class="progress">
      <progress
        value="${evaluated}"
        max="${total}">
      </progress>
    <div>
  `;
  app.element.querySelector("main").appendChild(progress);
}

/**
 * Renders question numbers with current/evaluated classes and, with feedback, correctness.
 * This extension only displays pages. Enable it before skippable or prevButton so those
 * extensions can attach forward/backward navigation to the newly rendered page elements.
 * @param {Object} event - Quiz event with app and type; handles render.
 */
export function paging({ app, type }) {
  if (type !== "render") return;

  const paging = app.ui.html`
    <nav class="paging">
      ${app.state.questions.map((question, i) => {
        const classes = [];
        if (i === app.current) classes.push("current");
        if (question.evaluated) {
          classes.push("evaluated");
          app.feedback &&
            classes.push(question.answers.every((answer) => answer.selected === answer.correct) ? "correct" : "wrong");
        }
        return app.ui.html`<span class="page ${classes.join(" ")}">${i + 1}</span>`;
      })}
    </nav>
  `;

  app.element.querySelector("main").appendChild(paging);
}

/**
 * Removes the question template's Finish button on render.
 * The embedding app or another extension must provide a way to finish if submission is needed.
 * Expects a button with data-on-click="finish" in each question view.
 * @param {Object} event - Quiz event with app and type.
 */
export function noFinishButton({ app, type }) {
  if (type !== "render") return;
  app.element.querySelector('[data-on-click="finish"]').remove();
}

/**
 * Allows advancing without submitting first, and finishing on the last question.
 * On render, enables Next/Finish and attaches forward jumps to pages created by paging.
 * Page jumps emit jump after rendering and do not evaluate the question being left.
 * Next still follows the core behavior: without feedback, it evaluates before advancing.
 * All page jumps use app.run so they cannot overlap another user action.
 * @param {Object} event - Quiz event with app and type.
 */
export function skippable({ app, type }) {
  if (type !== "render") return;

  // Enable "Next"
  if (app.current < app.state.questions.length - 1)
    app.element.querySelector('[data-on-click="next"]').disabled = false;

  // Enable "Finish" on last question
  const finishBtn = app.element.querySelector('[data-on-click="finish"]');
  if (finishBtn && app.current === app.state.questions.length - 1) finishBtn.disabled = false;

  // Enable forward navigation in paging (if present)
  app.element.querySelectorAll(".paging .page").forEach((page, i) => {
    if (i <= app.current) return;
    page.classList.add("clickable");
    page.addEventListener("click", () =>
      app.run(async () => {
        app.current = i;
        await app.renderQuestion();
        await app.emit("jump");
      }),
    );
  });
}

/**
 * Enables an existing Finish button on every question, even before evaluation.
 * Does not add a button or evaluate skipped questions; finish keeps the core behavior.
 * @param {Object} event - Quiz event with app and type; handles render.
 */
export function anytimeFinish({ app, type }) {
  if (type !== "render") return;
  const finishBtn = app.element.querySelector('[data-on-click="finish"]');
  if (finishBtn) finishBtn.disabled = false;
}

/**
 * Registers Previous on ready and adds its button on each render.
 * With paging enabled earlier, also makes preceding page numbers clickable.
 * Previous evaluates the current question only without feedback; page jumps never evaluate.
 * Emits prev or jump after rendering, allowing restore to save the new position.
 * Uses app.run for both actions; optional labels.prev defaults to "Previous".
 * @param {Object} event - Quiz event with app and type.
 */
export function prevButton({ app, type }) {
  switch (type) {
    case "render":
      const prev_btn = app.ui
        .html`<button data-on-click="prev" ${app.current === 0 && "disabled"}>${app.labels.prev || "Previous"}</button>`;
      app.ui.bind(prev_btn, app);
      app.element.querySelector(".buttons").prepend(prev_btn);

      // Enable backward navigation in paging (if present)
      app.element.querySelectorAll(".paging .page").forEach((page, i) => {
        if (i >= app.current) return;
        page.classList.add("clickable");
        page.addEventListener("click", () =>
          app.run(async () => {
            app.current = i;
            await app.renderQuestion();
            await app.emit("jump");
          }),
        );
      });

      break;
    case "ready":
      app.events.prev = () =>
        app.run(async () => {
          if (app.current === 0) return;
          if (!app.feedback) await app.evaluate();
          app.current--;
          await app.renderQuestion();
          await app.emit("prev");
        });
  }
}

/**
 * Gives checkbox answers three states: 1 = undecided, 2 = rejected, 3 = selected.
 * On render, restores indeterminate presentation and attaches the click cycle 1 -> 2 -> 3 -> 1.
 * Clicks update answer.tristate immediately; answer.selected is written by core evaluation.
 * Combine with decisionScore to give undecided answers zero points instead of treating
 * an unchecked box as a deliberate rejection. Radio questions are unchanged.
 * @param {Object} event - Quiz event with app and type.
 */
export function triState({ app, type }) {
  if (type !== "render") return;
  const question = app.state.questions[app.current];
  if (question.type !== "checkbox") return;
  if (!question.answers[0].tristate) question.answers.forEach((answer) => (answer.tristate = 1));
  app.element.querySelectorAll('.input[type="checkbox"]').forEach((checkbox, i) => {
    const answer = question.answers[i];
    if (answer.tristate === 1) checkbox.indeterminate = true;
    checkbox.addEventListener("click", () => {
      switch (answer.tristate) {
        case 1:
          checkbox.checked = false;
          checkbox.indeterminate = false;
          answer.tristate = 2;
          break;
        case 2:
          checkbox.checked = true;
          checkbox.indeterminate = false;
          answer.tristate = 3;
          break;
        case 3:
          checkbox.checked = false;
          checkbox.indeterminate = true;
          answer.tristate = 1;
          break;
      }
    });
  });
}

/**
 * Calculates question.points on evaluate, after the core has updated answer.selected.
 * Radio questions score 1 for selecting a correct answer, otherwise 0.
 * Checkbox decisions score +1 when correct and -1 when incorrect, with a minimum total of 0.
 * With triState, undecided answers score 0; without it, unchecked answers count as rejections.
 * Place before other evaluate extensions that consume question.points.
 * @param {Object} event - Quiz event with app and type.
 */
export function decisionScore({ app, type }) {
  if (type !== "evaluate") return;
  const question = app.state.questions[app.current];
  switch (question.type) {
    case "radio":
      question.points = question.answers.some((answer) => answer.selected && answer.correct) ? 1 : 0;
      break;
    case "checkbox":
      question.points = Math.max(
        0,
        question.answers.reduce((points, answer) => {
          if (answer.tristate === 1) return points;
          const correct = !!answer.selected === !!answer.correct;
          return points + (correct ? 1 : -1);
        }, 0),
      );
      break;
  }
}

/**
 * Saves completed attempts using `config.results`.
 * Enable this extension before any finish extension that clears state (such as restart).
 * It prepares the result key on start and writes only on finish, not after each answer.
 * Rejected login, mapping or storage promises stop event dispatch and leave the attempt available for retry.
 *
 * Configuration in `app.results`:
 * - `store`: resolved CCM datastore; missing/invalid stores disable this extension.
 * - `key`: app identifier; otherwise `app.key`, otherwise a generated key for this attempt.
 * - `mode`: "replace" (default) reuses the app/user key; "append" adds a unique attempt key.
 * - `userSpecific`: include realm/user in the key and as separate queryable fields.
 * - `mapper`: optional path mapping or function receiving a state copy; may return a promise for an object.
 * - `_`: initial permission settings for new records; existing records retain their saved settings.
 * Authentication uses `app.user` when saving user-specific or protected results.
 * For login before participation, configure `autoLogin` on the user instance.
 * The server assigns ownership and enforces permissions.
 *
 * App and attempt keys are fixed at start; user identity is bound on first required login.
 * A retry keeps the same key because a server write may have succeeded even when its response was lost.
 * Emits and awaits stored after saving, so restore can delete its draft before restart runs.
 * A stored listener error propagates even though the final result has already been written.
 *
 * @param {Object} event - Event dispatched by the quiz.
 * @param {Object} event.app - Quiz instance with state, results, optional user, and the CCM helpers.
 * @param {string} event.type - Handles `start` and `finish`; other events do not save data.
 * @returns {Promise<void>} Resolves when this event is handled; rejects on invalid settings or failed operations.
 */
export async function store({ app, type }) {
  /** Optional persistence settings; the datastore dependency has already been resolved by CCM. */
  const results = app.results;
  if (!results || !app.ccm.helper.isStore(results.store)) return;
  if (type === "start") prepareResultKey(app);
  if (type !== "finish") return;

  // login() reuses an existing session or opens the login dialog when necessary.
  // Protected results also need a login when their keys are not user-specific.
  if (results.userSpecific || results._) {
    if (!app.user) throw new Error("Saving these results requires a user component.");
    const identity = await app.user.login();
    if (results.userSpecific) bindUser(app, identity);
  }
  // Map a copy so custom transformations cannot change the running quiz state.
  const state = structuredClone(app.state);
  const mapped = !results.mapper ? state : await app.ccm.helper.mapObject(state, results.mapper);
  if (!mapped || typeof mapped !== "object" || Array.isArray(mapped))
    throw new Error("The result mapper must return an object.");
  /** Mapped result with authoritative submission metadata restored after the transformation. */
  const data = {
    ...mapped,
    status: "submitted",
    key: structuredClone(app.state.key),
    app: app.state.app,
  };
  // Identity fields belong to the submission, not to the configurable mapping.
  delete data.realm;
  delete data.user;
  if (results.userSpecific) {
    data.realm = app.state.realm;
    data.user = app.state.user;
  }
  // Read the current record so an update does not reset rights changed since the previous submission.
  const previous = await results.store.get(data.key);
  // Permission defaults apply only on creation. Preserve even the absence of _ on existing public data.
  delete data._;
  const permissions = previous ? previous._ : results._;
  if (permissions !== undefined) data._ = structuredClone(permissions);
  // Keep state intact on failure; a following restart extension runs only after this promise resolves.
  await results.store.set(data);

  // Let restore delete its draft before a following finish extension restarts the quiz.
  await app.emit("stored");
}

/**
 * Logs every event and the current state to the browser console for development.
 * Also logs the complete instance on init. This is a debugging example, not an analytics
 * exporter: it neither transforms results nor sends them to a datastore.
 * @param {Object} event - Quiz event with app and type.
 */
export function analytics(event) {
  if (event.type === "init") console.log(event.app);
  console.log("Event:", event.type, event.app.state);
}

/**
 * Discards the in-memory attempt after finish and starts a fresh quiz.
 * Place after store and other finish extensions that need the completed state.
 * Because dispatch is sequential, a storage or draft-cleanup error prevents this restart.
 * Does not delete submitted results; store/restore handle persistence separately.
 * @param {Object} event - Quiz event with app and type.
 * @returns {Promise<void>} Resolves after the new quiz has started.
 */
export async function restart({ app, type }) {
  if (type !== "finish") return;
  delete app.state;
  await app.start();
}

/**
 * Prepares the app and result keys once per attempt, without writing to the datastore.
 * Existing keys survive restoration, repeated starts and retries. Before user binding,
 * the key is appKey in replace mode or [appKey, attemptKey] in append mode.
 * @param {Object} app - Quiz instance with results configuration and initialized state.
 * @returns {void}
 */
function prepareResultKey(app) {
  const mode = app.results.mode ?? "replace";
  if (!["replace", "append"].includes(mode)) throw new Error("Invalid results.mode.");
  if (app.state.key) return;
  const appKey = app.results.key ?? app.key ?? app.ccm.helper.generateKey();
  if (!app.ccm.helper.isKey(appKey, false)) throw new Error("The results app key must be a simple CCM key.");
  app.state.app = appKey;
  app.state.key = mode === "append" ? [appKey, app.ccm.helper.generateKey()] : appKey;
}

/**
 * Encodes HTML-sensitive characters; does not sanitize or validate HTML markup.
 * @param {*} str - Value to convert to text and encode.
 * @returns {string} Text containing HTML entities.
 */
function escape(str) {
  return String(str).replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      })[char],
  );
}

/**
 * Randomizes an array in place using Fisher-Yates.
 * @param {Array} array - Questions or answers to reorder.
 * @returns {Array} The same array, with its elements shuffled.
 */
function shuffle(array) {
  // Fisher–Yates algorithm
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/**
 * Checks the simple realm/account keys used in personal result and draft keys.
 * @param {Object} app - Quiz instance providing the CCM key validator.
 * @param {Object|null} identity - Public identity returned by user.login().
 * @throws {Error} If realm or key is missing, invalid or an array key.
 */
function validateIdentity(app, identity) {
  if (!identity || !app.ccm.helper.isKey(identity.realm, false) || !app.ccm.helper.isKey(identity.key, false))
    throw new Error("Results require a valid realm and user key.");
}

/**
 * Binds the attempt to one identity, rejecting a different account on later submissions.
 * Produces [app, realm, user] or [app, realm, user, attempt] without regenerating key parts.
 * @param {Object} app - Quiz instance whose attempt is being bound.
 * @param {Object|null} identity - Public identity returned by user.login() or user.getState().
 * @param {string} identity.realm - User realm following the simple CCM key format.
 * @param {string} identity.key - Stable account key, not the displayed username.
 * @returns {void}
 * @throws {Error} If the identity is invalid or differs from the attempt's bound user.
 */
function bindUser(app, identity) {
  validateIdentity(app, identity);
  if (app.state.user !== undefined) {
    if (identity.realm !== app.state.realm || identity.key !== app.state.user)
      throw new Error("Sign in with the account that started this attempt.");
    return;
  }
  const parts = [].concat(app.state.key);
  parts.splice(1, 0, identity.realm, identity.key);
  app.state.key = parts;
  app.state.realm = identity.realm;
  app.state.user = identity.key;
}
