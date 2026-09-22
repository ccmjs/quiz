/**
 * Maps the demo's decisionScore results to version 1 of the shared analytics format.
 * Task keys come from configuration, never their shuffled display positions.
 * Unsubmitted questions count as zero points and incorrect; they still contribute to the maximum.
 * Submission identity and permissions are added by the store extension after mapping.
 * @param {Object} state - Copy of the quiz state, including questions and optional attempt timestamps.
 * @returns {Object} Trainer-independent result with total score and per-task scores.
 */
export function result(state) {
  const items = state.questions.map(question => {
    if (typeof question.key !== "string" || !question.key)
      throw new Error("Analytics results require stable question keys.");
    return {
      key: question.key,
      score: {
        achieved: question.evaluated ? question.points ?? 0 : 0,
        maximum: question.type === "radio" ? 1 : question.answers.length,
      },
      correct: !!question.evaluated && question.answers.every(answer => !!answer.selected === !!answer.correct),
    };
  });
  return {
    schema: "ccm-result",
    version: 1,
    component: "quiz",
    ...(state.startedAt && { startedAt: state.startedAt }),
    ...(state.submittedAt && { submittedAt: state.submittedAt }),
    score: {
      achieved: items.reduce((sum, item) => sum + item.score.achieved, 0),
      maximum: items.reduce((sum, item) => sum + item.score.maximum, 0),
    },
    items,
  };
}
