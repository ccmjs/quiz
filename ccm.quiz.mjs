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
      // ["ccm.load", "././resources/actions.mjs#startButton"],
      // ["ccm.load", "././resources/actions.mjs#shuffleQuestions"],
      // ["ccm.load", "././resources/actions.mjs#randomAnswers"],
      // ["ccm.load", "././resources/actions.mjs#anytimeFinish"],
      // ["ccm.load", "././resources/actions.mjs#analytics"],
      // ["ccm.load", "././resources/actions.mjs#restart"],
    ],
  },
  Instance: function () {
    this.init = async () => {
      await this.emit("init");
    };

    this.ready = async () => {
      await this.emit("ready");
    };

    this.start = async () => {
      await this.emit("before-start");
      this.state = { items: this.questions.map(() => ({})) };
      this.current = 0;
      this.renderQuestion(false);
      await this.emit("start");
    };

    this.events = {
      submit: () => {
        if (!this.feedback) return;
        this.evaluate();
        this.renderQuestion(true);
        this.emit("submit");
      },

      next: () => {
        if (this.current >= this.questions.length - 1) return;
        if (!this.feedback) this.evaluate();
        this.current++;
        this.renderQuestion(false);
        this.emit("next");
      },

      finish: () => {
        if (!this.feedback) this.evaluate();
        this.emit("finish");
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

    this.emit = async (type, data) => {
      if (!this.onaction) return;
      const event = { instance: this, type, data };
      if (!Array.isArray(this.onaction)) this.onaction(event);
      for (const fn of this.onaction) fn && (await fn(event));
    };
  },
};
