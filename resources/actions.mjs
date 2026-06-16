export async function restore({ instance, type }) {
  if (type === "start") {
    const state = await loadState(instance);
    if (!state) return;
    instance.state = state;
  }
  if (type === "start" || type === "next")
    instance.renderQuestion(
      instance.feedback && instance.state.items[instance.current].input,
    );
}

export async function escapeHTML({ instance, type }) {
  if (type !== "ready") return;
  instance.questions.forEach((question) => {
    question.text = escape(question.text);
    if (question.description)
      question.description = escape(question.description);
    question.answers.forEach((answer) => (answer.text = escape(answer.text)));
  });
}

export async function shuffleQuestions({ instance, type }) {
  if (type !== "start") return;
  if (await loadState(instance)) return;
  instance.questions.forEach((question, i) => (question.originalNr = i + 1));
  shuffle(instance.questions);
  instance.renderQuestion(instance.state.items[0].input);
}

export async function randomAnswers({ instance, type }) {
  if (type !== "start") return;
  if (await loadState(instance)) return;
  instance.questions.forEach((question) => {
    question.answers.forEach((answer, i) => (answer.originalNr = i + 1));
    shuffle(question.answers);
  });
  instance.renderQuestion(instance.state.items[0].input);
}

export function skippable({ instance, type }) {
  if (type !== "render") return;
  if (instance.current < instance.questions.length - 1)
    instance.element.querySelector('[data-on-click="next"]').disabled = false;
}

export async function startButton({ instance, type }) {
  switch (type) {
    case "start":
      instance.element.firstElementChild.hidden = true;
      const startBtn = instance.ui.html`<button data-on-click="startbtn">
        ${instance.labels.start || "Start"}
      </button>`;
      instance.ui.bind(startBtn, instance);
      instance.element.appendChild(startBtn);
      break;
    case "render":
      const exitBtn = instance.ui.html`<button data-on-click="exit">
        ${instance.labels.exit || "Exit"}
      </button>`;
      instance.ui.bind(exitBtn, instance);
      instance.element.querySelector("nav").appendChild(exitBtn);
      break;
    case "ready":
      instance.events.startbtn = () => {
        instance.element.querySelector('[data-on-click="startbtn"]').hidden =
          true;
        instance.element.firstElementChild.hidden = false;
        instance.emit("startbtn");
      };
      instance.events.exit = async () => {
        await instance.start();
        instance.emit("exit");
      };
  }
}

export function prevButton({ instance, type }) {
  switch (type) {
    case "render":
      const prev_btn = instance.ui
        .html`<button data-on-click="prev" ${instance.current === 0 && "disabled"}>${instance.labels.prev || "Previous"}</button>`;
      instance.ui.bind(prev_btn, instance);
      instance.element.querySelector("nav").prepend(prev_btn);
      break;
    case "ready":
      instance.events.prev = () => {
        if (instance.current === 0) return;
        if (!instance.feedback) instance.evaluate();
        instance.current--;
        instance.renderQuestion(
          instance.feedback && instance.state.items[instance.current].input,
        );
        instance.emit("prev");
      };
  }
}

export function anytimeFinish({ instance, type }) {
  if (type !== "render") return;
  const finishBtn = instance.element.querySelector('[data-on-click="finish"]');
  if (!finishBtn) return;
  finishBtn.disabled = false;
}

export function noFinishButton({ instance, type }) {
  if (type !== "render") return;
  instance.element.querySelector('[data-on-click="finish"]').remove();
}

export function triState({ instance, type }) {
  const question = instance.questions[instance.current];
  const item = instance.state.items[instance.current];
  switch (type) {
    case "evaluate":
      if (question.type !== "checkbox") return;
      item.input = item.state;
      delete item.state;
      break;
    case "render":
      if (instance.questions[instance.current].type !== "checkbox") return;
      const state =
        item.input || item.state || Array(question.answers.length).fill(2);
      if (!item.input) item.state = state;
      instance.element
        .querySelectorAll('.input[type="checkbox"]')
        .forEach((checkbox, i) => {
          if (state[i] === 2) checkbox.indeterminate = true;
          checkbox.addEventListener("click", () => {
            switch (state[i]) {
              case 2:
                checkbox.checked = true;
                checkbox.indeterminate = false;
                state[i] = 1;
                break;
              case 1:
                checkbox.checked = false;
                checkbox.indeterminate = false;
                state[i] = 0;
                break;
              case 0:
                checkbox.checked = false;
                checkbox.indeterminate = true;
                state[i] = 2;
                break;
            }
          });
        });
  }
}

export async function store({ instance, type }) {
  if (!instance.ccm.helper.isStore(instance.store)) return;

  switch (type) {
    case "start":
      instance.state.key = instance.key;
      break;
    case "submit":
      await save(instance);
      break;
    case "prev":
      if (!instance.feedback) await save(instance, 1);
      break;
    case "next":
      if (!instance.feedback) await save(instance, -1);
      break;
    case "finish":
    case "exit":
      if (!instance.feedback) await save(instance);
  }
}

export function analytics(event) {
  if (event.type === "init") console.log(event.instance);
  console.log("Event:", event.type, event.instance.state);
  // with datastore
}

export async function restart({ instance, type }) {
  if (type !== "finish") return;
  if (instance.feedback && (await loadState(instance)))
    await instance.store.del(instance.key);
  await instance.start();
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

async function save(instance, diff = 0) {
  const current = instance.current + diff;
  const question = instance.questions[current];

  let state = instance.ccm.helper.clone(instance.state);
  const item = state.items[current];

  if (question.answers[0].originalNr) {
    if (question.type === "radio") {
      item.input = question.answers[item.input - 1].originalNr;
      item.solution = question.answers[item.solution - 1].originalNr;
    } else {
      const input = [];
      const solution = [];
      item.input.forEach(
        (value, i) => (input[question.answers[i].originalNr - 1] = value),
      );
      item.solution.forEach(
        (value, i) => (solution[question.answers[i].originalNr - 1] = value),
      );
      item.input = input;
      item.solution = solution;
    }
  }

  if (question.originalNr) {
    state.items = instance.state.items
      .map((item, i) => ({
        item,
        index: instance.questions[i].originalNr - 1,
      }))
      .sort((a, b) => a.index - b.index)
      .map((entry) => entry.item);
  }

  await instance.store.set(state);
}

function shuffle(array) {
  // Fisher–Yates algorithm
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

async function loadState(instance) {
  if (
    instance.ccm.helper.isStore(instance.store) &&
    instance.ccm.helper.isKey(instance.key)
  )
    return instance.store.get(instance.key);
}
