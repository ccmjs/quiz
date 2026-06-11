export async function restore({ instance, type }) {
  if (type !== "start") return;
  const state = await loadState(instance);
  if (!state) return;
  instance.state = state;
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
    question.answers.forEach((answer) => {
      answer.text = escape(answer.text);
    });
  });
}

export async function shuffleQuestions({ instance, type }) {
  if (type !== "before-start") return;
  shuffle(instance.questions);
}

export async function randomAnswers({ instance, type }) {
  if (type !== "start") return;
  if (await loadState(instance)) return;
  instance.questions.forEach((question) => {
    question.answers.forEach((answer, i) => (answer.i = i));
    shuffle(question.answers);
  });
  instance.renderQuestion(instance.state.items[0].input);
}

export function skippable({ instance, type }) {
  switch (type) {
    case "next":
      if (instance.feedback && instance.state.items[instance.current].input)
        instance.renderQuestion(true);
    case "start":
    case "prev":
      if (instance.current < instance.questions.length - 1)
        instance.element.querySelector('[data-on-click="next"]').disabled =
          false;
  }
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
    case "prev":
    case "submit":
    case "next":
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
    case "start":
    case "prev":
    case "submit":
    case "next":
      const prev_btn = instance.ui
        .html`<button data-on-click="prev" ${instance.current === 0 && "disabled"}>${instance.labels.prev || "Previous"}</button>`;
      instance.ui.bind(prev_btn, instance);
      instance.element.querySelector("nav").prepend(prev_btn);
      break;
    case "ready":
      instance.events.prev = () => {
        if (instance.current === 0) return;
        if (!instance.feedback) this.evaluate();
        instance.current--;
        instance.renderQuestion(
          instance.feedback && instance.state.items[instance.current].input,
        );
        instance.emit("prev");
      };
  }
}

export function anytimeFinish({ instance, type }) {
  switch (type) {
    case "start":
    case "prev":
    case "submit":
    case "next":
      const finishBtn = instance.element.querySelector(
        '[data-on-click="finish"]',
      );
      if (!finishBtn) return;
      finishBtn.disabled = false;
  }
}

export function noFinishButton({ instance, type }) {
  switch (type) {
    case "start":
    case "prev":
    case "submit":
    case "next":
      instance.element.querySelector('[data-on-click="finish"]').remove();
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
    case "next":
    case "finish":
    case "exit":
      if (!instance.feedback) await save(instance);
  }
}

export function analytics(event) {
  console.log("Action:", event.type, event.instance.state, event.data);
  // with datastore
}

export async function restart({ instance, type }) {
  if (type !== "finish") return;
  if (instance.feedback && (await loadState(instance)))
    await instance.store.del(instance.key);
  await instance.start();
}

// explicitAnswer [Yes| |No]
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

async function save(instance) {
  const item = instance.state.items[instance.current];
  item.input = item.input.map(
    (input) => instance.questions[instance.current].answers[input].i || input,
  );
  item.solution = item.solution.map(
    (solution) =>
      instance.questions[instance.current].answers[solution].i || solution,
  );
  await instance.store.set(instance.state);
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
