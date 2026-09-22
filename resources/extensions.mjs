export async function escapeHTML({ app, type }) {
  if (type !== "ready") return;
  app.questions.forEach((question) => {
    question.text = escape(question.text);
    if (question.description)
      question.description = escape(question.description);
    question.answers.forEach((answer) => (answer.text = escape(answer.text)));
  });
}

export async function restore({ app, type }) {
  if (type !== "before-start") return;
  if (app.state) return;
  if (!app.ccm.helper.isStore(app.store) || !app.ccm.helper.isKey(app.key))
    return;
  const state = await app.store.get(app.key);
  if (state) app.state = state;
}

export async function shuffleQuestions({ app, type }) {
  if (type !== "start") return;
  shuffle(app.state.questions);
  await app.renderQuestion();
}

export async function randomAnswers({ app, type }) {
  if (type !== "start") return;
  app.state.questions.forEach((question) => shuffle(question.answers));
  app.renderQuestion();
}

export function summary({ app, type }) {
  if (!app.feedback) return;
  if (type === "ready") app.events.finish2 = app.events.finish;
  if (type !== "start") return;
  if (app.events.finish !== app.events.finish2) return;

  app.events.finish = async () => {
    const total = app.state.questions.length;
    let correct = 0;
    let max = 0;
    let points = 0;

    app.state.questions.forEach((question) => {
      question.answers.every((answer) => answer.selected === answer.correct) &&
        correct++;
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

    // animate progress bar
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

    // restore original finish handler
    app.events.finish = app.events.finish2;
  };
}

export function progressBar({ app, type }) {
  if (type !== "render") return;
  const total = app.state.questions.length;
  const evaluated = app.state.questions.filter(
    (question) => question.evaluated,
  ).length;
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
            classes.push(
              question.answers.every(
                (answer) => answer.selected === answer.correct,
              )
                ? "correct"
                : "wrong",
            );
        }
        return app.ui
          .html`<span class="page ${classes.join(" ")}">${i + 1}</span>`;
      })}
    </nav>
  `;

  app.element.querySelector("main").appendChild(paging);
}

export function noFinishButton({ app, type }) {
  if (type !== "render") return;
  app.element.querySelector('[data-on-click="finish"]').remove();
}

export function skippable({ app, type }) {
  if (type !== "render") return;

  // Enable "Next"
  if (app.current < app.state.questions.length - 1)
    app.element.querySelector('[data-on-click="next"]').disabled = false;

  // Enable "Finish" on last question
  const finishBtn = app.element.querySelector('[data-on-click="finish"]');
  if (finishBtn && app.current === app.state.questions.length - 1)
    finishBtn.disabled = false;

  // Enable forward navigation in paging (if present)
  app.element.querySelectorAll(".paging .page").forEach((page, i) => {
    if (i <= app.current) return;
    page.classList.add("clickable");
    page.addEventListener("click", async () => {
      app.current = i;
      await app.renderQuestion();
      await app.emit("jump");
    });
  });
}

export function anytimeFinish({ app, type }) {
  if (type !== "render") return;
  const finishBtn = app.element.querySelector('[data-on-click="finish"]');
  if (finishBtn) finishBtn.disabled = false;
}

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
        page.addEventListener("click", async () => {
          app.current = i;
          await app.renderQuestion();
          await app.emit("jump");
        });
      });

      break;
    case "ready":
      app.events.prev = () => {
        if (app.current === 0) return;
        if (!app.feedback) app.evaluate();
        app.current--;
        app.renderQuestion();
        app.emit("prev");
      };
  }
}

export function triState({ app, type }) {
  if (type !== "render") return;
  const question = app.state.questions[app.current];
  if (question.type !== "checkbox") return;
  if (!question.answers[0].tristate)
    question.answers.forEach((answer) => (answer.tristate = 1));
  app.element
    .querySelectorAll('.input[type="checkbox"]')
    .forEach((checkbox, i) => {
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

export function decisionScore({ app, type }) {
  if (type !== "evaluate") return;
  const question = app.state.questions[app.current];
  switch (question.type) {
    case "radio":
      question.points = question.answers.some(
        (answer) => answer.selected && answer.correct,
      )
        ? 1
        : 0;
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
  const mode = results.mode ?? "replace";
  if (!["replace", "append"].includes(mode))
    throw new Error("Invalid results.mode.");

  // Preserve an existing attempt key when start() is called again without clearing state.
  // Until user binding, the key is appKey or [appKey, attemptKey].
  if (type === "start" && !app.state.key) {
    const appKey = results.key ?? app.key ?? app.ccm.helper.generateKey();
    if (!app.ccm.helper.isKey(appKey, false))
      throw new Error("The results app key must be a simple CCM key.");
    app.state.app = appKey;
    const parts = [appKey];
    if (mode === "append") parts.push(app.ccm.helper.generateKey());
    app.state.key = parts.length === 1 ? appKey : parts;
  }
  if (type !== "finish") return;

  // login() reuses an existing session or opens the login dialog when necessary.
  // Protected results also need a login when their keys are not user-specific.
  if (results.userSpecific || results._) {
    if (!app.user)
      throw new Error("Saving these results requires a user component.");
    const identity = await app.user.login();
    if (results.userSpecific) bindUser(identity);
  }
  // Map a copy so custom transformations cannot change the running quiz state.
  const state = structuredClone(app.state);
  const mapped = !results.mapper
    ? state
    : await app.ccm.helper.mapObject(state, results.mapper);
  if (!mapped || typeof mapped !== "object" || Array.isArray(mapped))
    throw new Error("The result mapper must return an object.");
  /** Mapped result with authoritative submission metadata restored after the transformation. */
  const data = {
    ...mapped,
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

  /**
   * Binds the attempt to one identity, rejecting a different account on later submissions.
   * Produces [app, realm, user] or [app, realm, user, attempt] without regenerating key parts.
   * @param {Object|null} identity - Public identity returned by user.login() or user.getState().
   * @param {string} identity.realm - User realm following the simple CCM key format.
   * @param {string} identity.key - Stable account key, not the displayed username.
   * @returns {void}
   * @throws {Error} If the identity is invalid or differs from the attempt's bound user.
   */
  function bindUser(identity) {
    if (
      !identity ||
      !app.ccm.helper.isKey(identity.realm, false) ||
      !app.ccm.helper.isKey(identity.key, false)
    )
      throw new Error("Results require a valid realm and user key.");
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
}

export function analytics(event) {
  if (event.type === "init") console.log(event.app);
  console.log("Event:", event.type, event.app.state);
  // with datastore
}

export async function restart({ app, type }) {
  if (type !== "finish") return;
  delete app.state;
  await app.start();
}

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

function shuffle(array) {
  // Fisher–Yates algorithm
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
