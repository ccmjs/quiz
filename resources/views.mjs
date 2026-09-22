/**
 * Quiz templates rendered through ccm-ui: interpolated text is escaped automatically.
 * `data-on-click` names refer to `app.events` handlers. Classes and input selectors are also
 * used by evaluation and optional extensions; preserve these hooks in replacement views.
 */

/**
 * Creates the stable shell with an optional user header and a replaceable quiz content area.
 * Inserts the actual `user.host` DOM node, keeping its login dialog connected as questions change.
 * The component makes `.quiz-content` inert while busy; the user header remains outside that area.
 * @param {Object} app - Quiz instance with ui and an optional user component.
 * @returns {Node|DocumentFragment} Shell containing the header, if configured, and the main content area.
 */
export function main(app) {
  return app.ui.html`
    ${app.user && app.ui.html`<header class="user-area">${app.user.host}</header>`}
    <main class="quiz-content"></main>
  `;
}

/**
 * Renders state.questions[current], including answers, optional feedback and action buttons.
 * Evaluated answers stay disabled even without visible feedback. With feedback enabled,
 * solution highlights and answer comments appear after evaluation; Submit then becomes disabled.
 * Without feedback, Submit is hidden and the core evaluates on Next or Finish instead.
 *
 * Hooks used elsewhere: .input for evaluation/triState, .buttons for prevButton, and
 * data-on-click="next"/"finish" for navigation extensions that relax the default restrictions.
 * Answer comments use a hidden checkbox followed by an icon and a panel; CSS toggles the
 * panel when the label is clicked, so their sibling order matters.
 * @param {Object} app - Quiz instance with ui, state, current, feedback and labels.
 * @returns {Node|DocumentFragment} Current question view; rendering binds its event handlers.
 */
export function question(app) {
  const question = app.state.questions[app.current];
  // Evaluation records an answer; feedback separately controls whether its solution is revealed.
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
