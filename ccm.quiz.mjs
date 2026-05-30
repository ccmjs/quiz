export const component = {
  name: "quiz",
  ccm: "././libs/ccmjs/ccm.js",
  config: {
    // UI utilities (templating + event binding)
    ui: ["ccm.load", "././libs/ccm-ui/ccm-ui.mjs"],

    // HTML templates
    html: ["ccm.load", "././resources/templates.mjs"],

    // Component styles
    css: ["ccm.load", "././resources/styles.css"],

    /**
     * Quiz questions.
     *
     * Structure:
     * ```
     * [
     *   {
     *     text: "Question text",
     *     description: "Optional description",
     *     type: "radio" | "checkbox",
     *     answers: [
     *       {
     *         text: "Answer text",
     *         correct: true,
     *         comment: "Optional explanation"
     *       }
     *     ]
     *   }
     * ]
     * ```
     */
    questions: [{ text: "", answers: [] }],

    // Whether immediate feedback should be shown
    feedback: true,

    // Static UI labels
    labels: {
      submit: "Submit",
      next: "Next",
      finish: "Finish",
    },

    // Extension points
    onaction: [
      // ["ccm.load", "././resources/actions.mjs#restore"],
      // ["ccm.load", "././resources/actions.mjs#skippable"],
      // ["ccm.load", "././resources/actions.mjs#startButton"],
      // ["ccm.load", "././resources/actions.mjs#escapeHTML"],
      // ["ccm.load", "././resources/actions.mjs#shuffleQuestions"],
      // ["ccm.load", "././resources/actions.mjs#randomAnswers"],
      // ["ccm.load", "././resources/actions.mjs#prevButton"],
      // ["ccm.load", "././resources/actions.mjs#anytimeFinish"],
      // ["ccm.load", "././resources/actions.mjs#noFinishButton"],
      // ["ccm.load", "././resources/actions.mjs#store"],
      ["ccm.load", "././resources/actions.mjs#analytics"],
      ["ccm.load", "././resources/actions.mjs#restart"],
    ],
  },
  Instance: function () {
    /**
     * Current quiz result data.
     * Filled during runtime.
     *
     * Structure:
     * {
     *   items: [
     *     {
     *       input: [0, 2],
     *       solution: [0]
     *     }
     *   ]
     * }
     *
     * input    = selected answer indices
     * solution = correct answer indices
     *
     * @type {{items:Array<{input?:number[], solution?:number[]}>}}
     */
    this.state = { items: [] };

    /**
     * Index of the currently displayed question. Zero-based.
     *
     * @type {number}
     */
    this.current = 0;

    /** Lifecycle hook */
    this.init = async () => {
      await this.emit("init");
    };

    /** Lifecycle hook */
    this.ready = async () => {
      await this.emit("ready");
    };

    /** Starts or restarts the quiz */
    this.start = async () => {
      await this.emit("before-start");
      this.state = { items: this.questions.map(() => ({})) };
      this.current = 0;
      this.renderQuestion(false);
      await this.emit("start");
    };

    /**
     * DOM event handlers.
     *
     * Bound automatically via `ccm-ui` and `data-on-*` attributes.
     */
    this.events = {
      /** Evaluates the current question and shows feedback. */
      submit: () => {
        if (!this.feedback) return;
        this.evaluate();
        this.renderQuestion(true);
        this.emit("submit");
      },

      /** Advances to the next question. */
      next: () => {
        if (this.current >= this.questions.length - 1) return;
        if (!this.feedback) this.evaluate();
        this.current++;
        this.renderQuestion(false);
        this.emit("next");
      },

      /** Finishes the quiz. */
      finish: () => {
        if (!this.feedback) this.evaluate();
        this.emit("finish");
      },
    };

    /**
     * Renders the current question.
     * @param {boolean} showFeedback
     */
    this.renderQuestion = (showFeedback) => {
      this.ui.render(
        this.html.question(this, showFeedback),
        this.element,
        this,
      );
    };

    /** Evaluates the current question and stores user input and solution data in the result state. */
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

    /**
     * Emits a component action.
     *
     * Supported action types:
     *
     * - init
     * - ready
     * - before-start
     * - start
     * - submit
     * - next
     * - finish
     *
     * Each configured action receives:
     *
     * { instance, type, data }
     *
     * Actions are executed sequentially.
     *
     * @param {string} type
     * @param {*} [data]
     */
    this.emit = async (type, data) => {
      const actions = Array.isArray(this.onaction)
        ? this.onaction
        : [this.onaction];

      for (const action of actions)
        action && (await action({ instance: this, type, data }));
    };
  },
};
