/**
 * Configurable quiz with feedback and extensions.
 *
 * @author André Kless <andre.kless@web.de>
 * @copyright 2026 André Kless
 * @license MIT
 */
export const component = {
  name: "quiz",
  ccm: "././libs/framework/ccm.js",
  config: {
    // TODO: lang
    // TODO: routing
    // TODO: sounds

    // UI utilities (templating + event binding)
    ui: ["ccm.load", "././libs/ccm-ui/ccm-ui.mjs"],

    // Component views (HTML templates)
    views: ["ccm.load", "././resources/views.mjs"],

    // Component styles (CSS)
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

    /**
     * Optional authentication UI, rendered at the top right; omitted when no user is configured.
     * Required by the store extension for user-specific or protected results.
     * Set autoLogin on the user instance to require authentication before the quiz starts.
     */
    // user: ["ccm.instance", "https://ccmjs.github.io/user/ccm.user.mjs"],

    // Extension points
    extensions: [
      // ["ccm.load", "././resources/extensions.mjs#escapeHTML"],
      // ["ccm.load", "././resources/extensions.mjs#restore"],
      // ["ccm.load", "././resources/extensions.mjs#shuffleQuestions"],
      // ["ccm.load", "././resources/extensions.mjs#randomAnswers"],
      // ["ccm.load", "././resources/extensions.mjs#summary"],
      // ["ccm.load", "././resources/extensions.mjs#progressBar"],
      // ["ccm.load", "././resources/extensions.mjs#paging"],
      // ["ccm.load", "././resources/extensions.mjs#noFinishButton"],
      // ["ccm.load", "././resources/extensions.mjs#skippable"],
      // ["ccm.load", "././resources/extensions.mjs#anytimeFinish"],
      // ["ccm.load", "././resources/extensions.mjs#prevButton"],
      // ["ccm.load", "././resources/extensions.mjs#triState"],
      // ["ccm.load", "././resources/extensions.mjs#decisionScore"],
      // ["ccm.load", "././resources/extensions.mjs#store"],
      ["ccm.load", "././resources/extensions.mjs#analytics"],
      ["ccm.load", "././resources/extensions.mjs#restart"],
    ],
  },
  Instance: function () {
    /** Transient interaction state, separate from the saved quiz answers. */
    this.gui = {
      /** Prevents overlapping user actions while rendering, loading or saving. */
      busy: false,
    };

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
      // A restart extension may call start() while the finishing action still owns the busy flag.
      const busy = this.gui.busy;
      setBusy(true);
      try {
        // Keep authentication connected while the question or summary content changes.
        if (!this.content) {
          this.ui.render(this.views.main(this), this.element, this);
          this.content = this.element.querySelector(".quiz-content");
          setBusy(true);
        }
        if (this.user) await this.user.start();
        this.current = 0;
        // Restore only when no attempt is running; login dialogs can now use the attached user host.
        if (!this.state) await this.emit("restore");
        if (!this.state) {
          this.state = { questions: structuredClone(this.questions) };
          await this.emit("create");
        }
        await this.renderQuestion();
        await this.emit("start");
      } finally {
        setBusy(busy);
      }
    };

    /**
     * Runs one user action, ignoring further actions until it completes.
     * Extensions use this for their own navigation or view changes too.
     * Errors propagate, but always release the UI so the action can be retried.
     * @param {Function} action - Async operation, including its awaited extension events.
     * @returns {Promise<*>} The action's result, or undefined when another action is busy.
     */
    this.run = async (action) => {
      if (this.gui.busy) return;
      setBusy(true);
      try {
        return await action();
      } finally {
        setBusy(false);
      }
    };

    /**
     * DOM event handlers.
     *
     * Bound automatically via `ccm-ui` and `data-on-*` attributes.
     */
    this.events = {
      /** Evaluates the current question and shows feedback. */
      submit: () =>
        this.run(async () => {
          if (!this.feedback) return;
          await this.evaluate();
          await this.renderQuestion();
          await this.emit("submit");
        }),

      /** Advances to the next question. */
      next: () =>
        this.run(async () => {
          if (this.current >= this.state.questions.length - 1) return;
          if (!this.feedback) await this.evaluate();
          this.current++;
          await this.renderQuestion(false);
          await this.emit("next");
        }),

      /** Finishes the quiz. */
      finish: () =>
        this.run(async () => {
          if (!this.feedback) await this.evaluate();
          await this.emit("finish");
        }),
    };

    /**
     * Renders the current question.
     */
    this.renderQuestion = async () => {
      this.ui.render(this.views.question(this), this.content, this);
      await this.emit("render");
    };

    /** Evaluates the current question and stores user input and solution data in the result state. */
    this.evaluate = async () => {
      const question = this.state.questions[this.current];
      const inputs = this.element.querySelectorAll(".input");
      inputs.forEach((input, i) => {
        if (input.checked) question.answers[i].selected = true;
        else delete question.answers[i].selected;
      });
      question.evaluated = true;
      await this.emit("evaluate");
    };

    /**
     * Emits an extension event.
     *
     * Extensions can react to the following events:
     *
     * - init
     * - ready
     * - before-start
     * - restore (load existing state after authentication UI is attached)
     * - create (initialize a new state, never a restored one)
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
     *   app,      // component instance
     *   type      // emitted event type
     * }
     *
     * Extensions are executed sequentially.
     *
     * @param {string} type - emitted event type
     */
    this.emit = async (type) => {
      const extensions = [].concat(this.extensions || []);

      for (const extension of extensions) if (extension) await extension({ app: this, type });
    };

    /** Disables interaction with quiz content without changing each control's own disabled state. */
    const setBusy = (busy) => {
      this.gui.busy = busy;
      if (!this.content) return;
      this.content.inert = busy;
      this.content.setAttribute("aria-busy", String(busy));
    };
  },
};
