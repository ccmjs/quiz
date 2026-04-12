export async function startButton({ instance, type }) {
  if (type === "start") {
    instance.element.firstElementChild.hidden = true;
    const start_btn = instance.ui.html`<button data-on-click="start">
      ${instance.labels.start || "Start"}
    </button>`;
    instance.ui.bind(start_btn, instance);
    instance.element.appendChild(start_btn);
  }

  switch (type) {
    case "ready":
      instance.events.start = () => {
        instance.element.querySelector('[data-on-click="start"]').hidden = true;
        instance.element.firstElementChild.hidden = false;
      };
      instance.events.exit = instance.start;
      break;
    case "start":
    case "submit":
    case "next":
      const exit_btn = instance.ui.html`<button data-on-click="exit">
        ${instance.labels.exit || "Exit"}
      </button>`;
      instance.ui.bind(exit_btn, instance);
      instance.element.querySelector("nav").appendChild(exit_btn);
      break;
  }
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

export function randomAnswers({ instance, type }) {
  if (type !== "before-start") return;
  instance.questions.forEach((question) => shuffle(question.answers));
}

export function prevButton({ instance, type }) {
  const prev_btn = instance.ui
    .html`<button data-on-click="prev" ${instance.current === 1 && "disabled"}>${instance.labels.prev || "Previous"}</button>`;
  instance.ui.bind(prev_btn, instance);

  switch (type) {
    case "start":
    case "submit":
    case "next":
      instance.element.querySelector("nav").prepend(prev_btn);
      break;
    case "ready":
      instance.events.prev = () => {
        if (instance.current === 0) return;
        instance.current--;
        instance.renderQuestion(instance.state.items[instance.current].input);
        instance.element.querySelector("nav").prepend(prev_btn);
      };
  }
}

export function anytimeFinish({ instance, type }) {
  switch (type) {
    case "start":
    case "submit":
    case "next":
      instance.element.querySelector('[data-on-click="finish"]').disabled =
        false;
  }
}

export async function store({ instance, type }) {
  if (!instance.ccm.helper.isStore(instance.store)) return;
  if (type === "start" && instance.key) instance.state.key = instance.key;
  if (type === "submit") await instance.store.set(instance.state);
}

export async function restore({ instance, type }) {
  const helper = instance.ccm.helper;
  if (!helper.isStore(instance.store) || !helper.isKey(instance.key)) return;
  if (type !== "start") return;
  const state = await instance.store.get(instance.key);
  if (!state) return;
  instance.state = state;
  instance.renderQuestion(false);
}

export async function resultMode({ instance, type }) {
  if (type !== "start" && type !== "next") return;
  if (!instance.state.items.every((item) => item.input)) return;
  instance.renderQuestion(true);
  instance.element.querySelector('[data-on-click="submit"]').remove();
  instance.element.querySelector('[data-on-click="finish"]').remove();
}

export function analytics(event) {
  console.log("Action:", event.type, event.instance.state, event.data);
  // with datastore
}

export async function restart({ instance, type }) {
  if (type !== "finish") return;
  await instance.start();
}

// explicitAnswer [Yes| |No]
// skippable
// navigation [prev|next]
// summary
// progress bar
// save user-specific
// lang

export function escape(str) {
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
