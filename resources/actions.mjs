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

export async function startButton({ app, type }) {
  switch (type) {
    case "start":
      app.element.firstElementChild.hidden = true;
      const startBtn = app.ui.html`<button data-on-click="startbtn">
        ${app.labels.start || "Start"}
      </button>`;
      app.ui.bind(startBtn, app);
      app.element.appendChild(startBtn);
      break;
    case "render":
      const exitBtn = app.ui.html`<button data-on-click="exit">
        ${app.labels.exit || "Exit"}
      </button>`;
      app.ui.bind(exitBtn, app);
      app.element.querySelector("nav").appendChild(exitBtn);
      break;
    case "ready":
      app.events.startbtn = () => {
        app.element.querySelector('[data-on-click="startbtn"]').hidden = true;
        app.element.firstElementChild.hidden = false;
        app.emit("startbtn");
      };
      app.events.exit = async () => {
        await app.start();
        app.emit("exit");
      };
  }
}

export function noFinishButton({ app, type }) {
  if (type !== "render") return;
  app.element.querySelector('[data-on-click="finish"]').remove();
}

export function skippable({ app, type }) {
  if (type !== "render") return;

  if (app.current < app.state.questions.length - 1)
    app.element.querySelector('[data-on-click="next"]').disabled = false;

  const finishBtn = app.element.querySelector('[data-on-click="finish"]');
  if (finishBtn && app.current === app.state.questions.length - 1)
    finishBtn.disabled = false;
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
      app.element.querySelector("nav").prepend(prev_btn);
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
            checkbox.checked = true;
            checkbox.indeterminate = false;
            answer.tristate = 2;
            break;
          case 2:
            checkbox.checked = false;
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

export async function store({ app, type }) {
  if (!app.ccm.helper.isStore(app.store)) return;
  if (type === "start") app.state.key = app.key;
  if (type === "evaluate") await app.store.set(app.state);
}

export function analytics(event) {
  if (event.type === "init") console.log(event.app);
  console.log("Event:", event.type, event.app.state);
  // with datastore
}

export async function restart({ app, type }) {
  if (type !== "finish") return;
  if (app.ccm.helper.isStore(app.store)) await app.store.del(app.key);
  await app.start();
}

// summary
// progress bar (green/red/gray)
// save user-specific
// lang
// sounds
// paging [1|2|...|n]
// routing
// points

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
