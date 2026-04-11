export function question(instance, showFeedback) {
  const question = instance.questions[instance.current];
  return instance.ui.html`
    <div>
      <h1>${question.text}</h1>
      <p>${question.description}</p>
      
      <ul>
        ${question.answers.map(
          (answer, i) => instance.ui.html`
            <li ${showFeedback && answer.correct && 'class="correct"'}>
              <label>
                <input type="${question.type}"
                       class="input"
                       name="question"
                       ${instance.state.items[instance.current].input?.includes(i) && "checked"}
                       ${showFeedback && "disabled"}>
                <span>${answer.text}</span>
              </label>
              <span class="comment" ${(!showFeedback || !question.answers[i].comment) && "hidden"}>
                <label>
                  <input type="checkbox" hidden>
                  <span>ℹ️</span>
                  <div>${question.answers[i].comment}</div>
                </label>
              </span>
            </li>
          `,
        )}
      </ul>

      <button data-on-click="submit"
              ${showFeedback && "disabled"}
              ${!instance.feedback && "hidden"}>
        ${instance.labels.submit}
      </button>
      <button data-on-click="next"
              ${(!showFeedback || instance.current >= instance.questions.length - 1) && "disabled"}>
        ${instance.labels.next}
      </button>
      <button data-on-click="finish"
              ${(!showFeedback || instance.current < instance.questions.length - 1) && "disabled"}>
        ${instance.labels.finish}
      </button>
    </div>
  `;
}
