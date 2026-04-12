export async function startButton({ instance, type }) {
  if (type !== "start" && type !== "submit" && type !== "next") return;

  const html = instance.ui.html;

  const close_btn = html`<button>${instance.labels.close || "Close"}</button>`;
  close_btn.addEventListener("click", instance.start);

  if (type === "submit" || type === "next")
    return instance.element.querySelector("nav").appendChild(close_btn);

  const start_btn = html`<button>${instance.labels.start || "Start"}</button>`;
  start_btn.addEventListener("click", () => {
    start_btn.hidden = true;
    instance.element.firstElementChild.hidden = false;
    instance.element.querySelector("nav").appendChild(close_btn);
  });

  instance.element.firstElementChild.hidden = true;
  instance.element.appendChild(start_btn);
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
  if (type !== "finish") return;
  await instance.store.set(instance.state);
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
// save
// save user-specific
// result mode
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
