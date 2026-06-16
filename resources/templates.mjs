export function question(app, showFeedback) {
  const question = app.questions[app.current];
  const item = app.state.items[app.current];
  return app.ui.html`
    <main>
      <h1>${question.text}</h1>
      <p>${question.description}</p>
      
      <ul>
        ${question.answers.map(
          (answer, i) => app.ui.html`
            <li ${showFeedback && answer.correct && 'class="correct"'}>
              <label>
                <input type="${question.type}"
                       class="input"
                       name="question"
                       ${(question.type === "radio" ? item.input === i + 1 : item.input?.[i]) && "checked"}
                       ${showFeedback && "disabled"}>
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

      <nav>
        <button data-on-click="submit"
                ${showFeedback && "disabled"}
                ${!app.feedback && "hidden"}>
          ${app.labels.submit}
        </button>
        <button data-on-click="next"
                ${((app.feedback && !showFeedback) || app.current >= app.questions.length - 1) && "disabled"}>
          ${app.labels.next}
        </button>
        <button data-on-click="finish"
                ${((app.feedback && !showFeedback) || app.current < app.questions.length - 1) && "disabled"}>
          ${app.labels.finish}
        </button>
      </nav>
    </main>
  `;
}
