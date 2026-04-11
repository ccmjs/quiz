export async function shuffleQuestions({ instance, type }) {
  if (type !== "init") return;
  instance.questions = instance.questions.sort(() => Math.random() - 0.5);
}

export function randomAnswers({ instance, type }) {
  if (type !== "init") return;
  instance.questions.forEach((question) => {
    question.answers = question.answers.sort(() => Math.random() - 0.5);
  });
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
// anytime finish
// summary
// progress bar
// start button
// save
// save user-specific
// result mode
// lang
