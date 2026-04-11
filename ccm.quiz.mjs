export const component = {
  name: "quiz",
  ccm: "././libs/ccmjs/ccm.js",
  config: {
    ui: ["ccm.load", "././libs/ccm-ui/ccm-ui.mjs"],
    html: ["ccm.load", "././resources/templates.mjs"],
    css: ["ccm.load", "././resources/styles.css"],
    questions: [],
    feedback: true,
    labels: {
      submit: "Submit",
      next: "Next",
      finish: "Finish",
    },
    onaction: [
      // ["ccm.load", "././resources/actions.mjs#shuffleQuestions"],
      // ["ccm.load", "././resources/actions.mjs#randomAnswers"],
      // ["ccm.load", "././resources/actions.mjs#restart"],
      // ["ccm.load", "././resources/actions.mjs#analytics"],
    ],
  },
  Instance: function () {
    this.init = async () => {
      await emit("init");
    };

    this.ready = async () => {
      await emit("ready");
    };

    this.start = async () => {
      this.state = { items: this.questions.map(() => ({})) };
      this.current = 0;
      this.renderQuestion(false);
      await emit("start");
    };

    this.events = {
      submit: () => {
        if (!this.feedback) return;
        this.evaluate();
        this.renderQuestion(true);
        emit("submit");
      },

      next: () => {
        if (this.current >= this.questions.length - 1) return;
        if (!this.feedback) this.evaluate();
        this.current++;
        this.renderQuestion();
        emit("next");
      },

      finish: () => {
        if (this.current < this.questions.length - 1) return;
        if (!this.feedback) this.evaluate();
        emit("finish");
      },
    };

    this.renderQuestion = (showFeedback) => {
      this.ui.render(
        this.html.question(this, showFeedback),
        this.element,
        this,
      );
    };

    this.evaluate = () => {
      const item = this.state.items[this.current];
      const inputs = [...this.element.querySelectorAll(".input")];

      item.input = [];
      inputs.forEach((input, i) => input.checked && item.input.push(i));

      item.solution = [];
      this.questions[this.current].answers.forEach(
        (answer, i) => answer.correct && item.solution.push(i),
      );
    };

    const emit = async (type, data) => {
      if (!this.onaction) return;
      const event = { instance: this, type, data };
      if (!Array.isArray(this.onaction)) this.onaction(event);
      for (const fn of this.onaction) fn && (await fn(event));
    };
  },
};
