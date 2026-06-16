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
    extensions: [
      // ["ccm.load", "././resources/actions.mjs#restore"],
      // ["ccm.load", "././resources/actions.mjs#skippable"],
      // ["ccm.load", "././resources/actions.mjs#startButton"],
      // ["ccm.load", "././resources/actions.mjs#escapeHTML"],
      // ["ccm.load", "././resources/actions.mjs#shuffleQuestions"],
      // ["ccm.load", "././resources/actions.mjs#randomAnswers"],
      // ["ccm.load", "././resources/actions.mjs#prevButton"],
      // ["ccm.load", "././resources/actions.mjs#anytimeFinish"],
      // ["ccm.load", "././resources/actions.mjs#noFinishButton"],
      // ["ccm.load", "././resources/actions.mjs#triState"],
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
      this.state = { items: this.questions.map(() => ({})) };
      this.current = 0;
      await this.renderQuestion(false);
      await this.emit("start");
    };

    /**
     * DOM event handlers.
     *
     * Bound automatically via `ccm-ui` and `data-on-*` attributes.
     */
    this.events = {
      /** Evaluates the current question and shows feedback. */
      submit: async () => {
        if (!this.feedback) return;
        await this.evaluate();
        await this.renderQuestion(true);
        await this.emit("submit");
      },

      /** Advances to the next question. */
      next: async () => {
        if (this.current >= this.questions.length - 1) return;
        if (!this.feedback) await this.evaluate();
        this.current++;
        await this.renderQuestion(false);
        await this.emit("next");
      },

      /** Finishes the quiz. */
      finish: async () => {
        if (!this.feedback) await this.evaluate();
        await this.emit("finish");
      },
    };

    /**
     * Renders the current question.
     * @param {boolean} showFeedback
     */
    this.renderQuestion = async (showFeedback) => {
      this.ui.render(
        this.html.question(this, showFeedback),
        this.element,
        this,
      );
      await this.emit("render");
    };

    /** Evaluates the current question and stores user input and solution data in the result state. */
    this.evaluate = async () => {
      const question = this.questions[this.current];
      const item = this.state.items[this.current];
      const inputs = this.element.querySelectorAll(".input");

      if (question.type === "radio") {
        inputs.forEach((input, i) => input.checked && (item.input = i + 1));
        question.answers.forEach(
          (answer, i) => answer.correct && (item.solution = i + 1),
        );
      } else {
        item.input = [];
        inputs.forEach((input) => item.input.push(+input.checked));
        item.solution = [];
        question.answers.forEach((answer) =>
          item.solution.push(+!!answer.correct),
        );
      }

      await this.emit("evaluate");
    };

    /**
     * Emits an extension event.
     *
     * Extensions can react to the following events:
     *
     * - init
     * - ready
     * - start
     * - render
     * - submit
     * - evaluate
     * - next
     * - finish
     *
     * Each configured extension receives an object:
     *
     * {
     *   instance, // component instance
     *   type      // emitted event type
     * }
     *
     * Extensions are executed sequentially.
     *
     * @param {string} type - emitted event type
     */
    this.emit = async (type) => {
      const extensions = [].concat(this.extensions || []);

      for (const extension of extensions)
        extension && (await extension({ instance: this, type }));
    };
  },
};
