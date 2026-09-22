/** Stable quiz shell; question changes leave the embedded user component connected. */
export function main(app) {
  return app.ui.html`
    ${app.user && app.ui.html`<header class="user-area">${app.user.host}</header>`}
    <main class="quiz-content"></main>
  `;
}

export function question(app) {
  const question = app.state.questions[app.current];
  const showFeedback = question.evaluated && app.feedback;
  return app.ui.html`
    <section class="question ${question.evaluated && "evaluated"}">
      <h1>${question.text}</h1>
      <p>${question.description}</p>
      
      <ul>
        ${question.answers.map(
          (answer, i) => app.ui.html`
            <li ${showFeedback && answer.correct && 'class="correct"'}>
              <label>
                <input type="${question.type}"
                       class="input"
                       ${question.type === "radio" && 'name="question"'}
                       ${answer.selected && "checked"}
                       ${question.evaluated && "disabled"}>
                <span>${answer.text}</span>
              </label>
              <span class="comment" ${(!showFeedback || !answer.comment) && "hidden"}>
                <label>
                  <input type="checkbox" hidden>
                  <span>ℹ️</span>
                  <div>${answer.comment}</div>
                </label>
              </span>
            </li>
          `,
        )}
      </ul>

      <nav class="buttons">
        <button data-on-click="submit"
                ${showFeedback && "disabled"}
                ${!app.feedback && "hidden"}>
          ${app.labels.submit}
        </button>
        <button data-on-click="next"
                ${((app.feedback && !question.evaluated) || app.current >= app.state.questions.length - 1) && "disabled"}>
          ${app.labels.next}
        </button>
        <button data-on-click="finish"
                ${((app.feedback && !question.evaluated) || app.current < app.state.questions.length - 1) && "disabled"}>
          ${app.labels.finish}
        </button>
      </nav>
    </section>
  `;
}
