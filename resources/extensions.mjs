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
        <main>
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
        </main>
      `,
      app.element,
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
      app.element.querySelector(".buttons").appendChild(exitBtn);
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
