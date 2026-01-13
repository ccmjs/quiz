export const component = {
  name: 'quiz',
  ccm: 'https://ccmjs.github.io/framework/ccm.js',
  config: {
    feedback: false,
    questions: []
  },
  Instance: function () {

    this.start = async () => {
      this.element.innerHTML = '';

      this.questions.forEach((q, qi) => {
        const fieldset = document.createElement('fieldset');

        const legend = document.createElement('legend');
        legend.textContent = q.text;
        fieldset.appendChild(legend);

        q.answers.forEach((a, ai) => {
          const label = document.createElement('label');
          label.style.display = 'block';

          const input = document.createElement('input');
          input.type = q.input || 'radio';
          input.name = `q${qi}`;
          input.value = ai;

          label.appendChild(input);
          label.append(` ${a.text}`);
          fieldset.appendChild(label);
        });

        this.element.appendChild(fieldset);
      });

      const button = document.createElement('button');
      button.textContent = 'Submit';
      button.onclick = evaluate;
      this.element.appendChild(button);
    };

    const evaluate = () => {
      let correct = 0;
      let total = this.questions.length;

      this.questions.forEach((q, qi) => {
        const selected = this.element.querySelector(
            `input[name="q${qi}"]:checked`
        );
        if (!selected) return;

        const answer = q.answers[selected.value];
        if (answer.correct) correct++;
      });

      if (this.feedback) {
        alert(`Result: ${correct} / ${total}`);
      }
    };
  }
};