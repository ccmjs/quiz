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

export async function shuffleQuestions({ instance, type }) {
  if (type !== "before-start") return;
  instance.questions = instance.questions.sort(() => Math.random() - 0.5);
}

export function randomAnswers({ instance, type }) {
  if (type !== "before-start") return;
  instance.questions.forEach((question) => {
    question.answers = question.answers.sort(() => Math.random() - 0.5);
  });
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

export function analytics(event) {
  console.log("Action:", event.type, event.instance.state, event.data);
  // with datastore
}

export async function restart({ instance, type }) {
  if (type !== "finish") return;
  await instance.start();
}

// escapeHTML
// explicitAnswer [Yes| |No]
// skippable
// navigation [prev|next]
// summary
// progress bar
// save
// save user-specific
// result mode
// lang
