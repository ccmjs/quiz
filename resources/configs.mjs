export const demo = {
  // Stable question keys survive shuffling and allow comparisons across submissions.
  questions: [
    {
      key: "html_definition",
      text: "Was ist HTML?",
      type: "radio",
      description: "Wählen Sie unter den folgenden Antworten die richtige Antwort aus.",
      answers: [
        {
          text: "ein internetfähiges Gerät",
        },
        {
          text: "ein Programm",
        },
        {
          text: "ein Web-Service",
        },
        {
          text: "eine Auszeichnungssprache",
          correct: true,
        },
        {
          text: "eine Forschungseinrichtung",
        },
        {
          text: "eine Programmiersprache",
        },
        {
          text: "eine Skriptspache",
        },
        {
          text: "eine Stylesheet-Sprache",
        },
        {
          text: "etwas essbares",
        },
      ],
    },
    {
      key: "html_abbreviation",
      text: "Wofür steht HTML?",
      type: "radio",
      answers: [
        {
          text: "High-level Technology Media Language",
        },
        {
          text: "Home Technology Media Language",
        },
        {
          text: "Home Tool Markup Language",
        },
        {
          text: "How To Miss Without Laugh",
        },
        {
          text: "Hyperlink Media Language",
        },
        {
          text: "Hyperlinks and Text Markup Language",
        },
        {
          text: "Hypertext Markup Language",
          correct: true,
        },
        {
          text: "Hypertext Markup Level",
        },
        {
          text: "Hypertext Media Language",
        },
      ],
    },
    {
      key: "hyperlink",
      text: "Was ist ein Hyperlink und wofür setzt man ihn ein?",
      type: "radio",
      description: "Ein Hyperlink ist...",
      answers: [
        {
          text: "der Künstername des Erfinders des Web.",
        },
        {
          text: "ein Dateiformat für digitale Dokumente.",
        },
        {
          text: "ein Gremium zur Ausarbeitung von Web-Standards.",
        },
        {
          text: "ein Querverweis zum Springen an andere Textstellen in Hypertexten.",
          correct: true,
        },
        {
          text: "ein Modewort zur Vermarktung des Web.",
        },
        {
          text: "ein Portal in das digitale Zeitalter.",
        },
        {
          text: "ein Web-Standard zur einheitlichen Verbreitung von Informationen.",
        },
        {
          text: "eine Arbeitsgruppe zur Weiterentwicklung von HTML.",
        },
        {
          text: "eine Markierung zum Hervorheben interessanter Textstellen.",
        },
      ],
    },
    {
      key: "html_usage",
      text: "Wofür wird HTML eingesetzt?",
      type: "radio",
      answers: [
        {
          text: "für den Aufruf von Webseiten",
          comment:
            'Zum Aufrufen von Webseiten nutzt man einen <a target="_blank" href="https://de.wikipedia.org/wiki/Webbrowser">Webbrowser</a>.',
        },
        {
          text: "für die Beschreibung zusätzlicher Element-Eigenschaften",
          comment:
            'Zur Beschreibung zusätzlicher Eigenschaften von Elementen werden in Auszeichnungssprachen <a target="_blank" href="https://de.wikipedia.org/wiki/Attribut_(Auszeichnungssprache)">Attribute</a> genutzt.',
        },
        {
          text: "für die dynamische Manipulation von Webseiten",
          comment:
            'Zur dynamischen Manipulation von Webseiten nutzt man <a target="_blank" href="https://de.wikipedia.org/wiki/JavaScript">JavaScript</a>.',
        },
        {
          text: "für die elektronische Datenverwaltung",
          comment:
            'Zur elektronischen Datenverwaltung nutzt man <a target="_blank" href="https://de.wikipedia.org/wiki/Datenbank">Datenbanken</a>.',
        },
        {
          text: "für die Gestaltung von Layout und Design von Webseiten",
          comment:
            'Zur Gestaltung von Layout und Design einer Webseite nutzt man <a target="_blank" href="https://de.wikipedia.org/wiki/Cascading_Style_Sheets">Cascading Style Sheets (CSS)</a>.',
        },
        {
          text: "für die Programmierung von Webseiten",
          comment:
            'HTML ist keine Programmiersprache, sondern eine reine <a target="_blank" href="https://de.wikipedia.org/wiki/Auszeichnungssprache">Auszeichnungssprache</a>.',
        },
        {
          text: "für die Strukturierung digitaler Dokumente",
          correct: true,
        },
        {
          text: "für die Übertragung von Daten im Internet",
          comment:
            'Im Internet nutzt man zur Übertragung von Daten üblicherweise das <a target="_blank" href="https://de.wikipedia.org/wiki/Hypertext_Transfer_Protocol">Hypertext Transfer Protocol (HTTP)</a>.',
        },
        {
          text: "um morgens aus dem Bett zu kommen",
        },
      ],
    },
    {
      key: "html_inventor",
      text: "Wer hat HTML erfunden?",
      type: "radio",
      answers: [
        {
          text: "Bill Gates",
          comment: "Bill Gates ist der Gründer von Microsoft.",
        },
        {
          text: "Fred Feuerstein",
          comment: "Fred Feuerstein ist der Vater in der Familie Feuerstein aus der gleichnamigen Zeichentrickserie.",
        },
        {
          text: "Jeff Bezos",
          comment: "Jeff Bezos ist der Gründer von Amazon.",
        },
        {
          text: "Larry Page",
          comment: "Larry Page ist einer der Google-Gründer.",
        },
        {
          text: "Mark Zuckerberg",
          comment: "Mark Zuckerberg ist der Gründer von Facebook.",
        },
        {
          text: "Mike Sandel",
          comment: "Mike Sandel war der Chef von Tim Berners-Lee.",
        },
        {
          text: "Robert Cailliau",
          comment: "Robert Cailliau ist der erste Web-Surfer und Freund von Tim-Berners-Lee.",
        },
        {
          text: "Steve Jobs",
          comment: "Steve Jobs ist der Gründer von Apple.",
        },
        {
          text: "Tim Berners-Lee",
          correct: true,
          comment: "Tim Berners-Lee ist der Erfinder von HTML und der Begründer des World Wide Web (WWW).",
        },
      ],
    },
    {
      key: "html_origin",
      text: "Zu welchem ursprünglichen Zweck wurde HTML erfunden?",
      type: "radio",
      answers: [
        {
          text: "für das Sammeln von Daten",
        },
        {
          text: "für das Streamen von Filmen",
        },
        {
          text: "für den Aufbau sozialer Netze",
        },
        {
          text: "für den Aufbau von Tauschbörsen im Internet",
        },
        {
          text: "für den Austausch wissenschaftlicher Publikationen",
          correct: true,
        },
        {
          text: "für die digitalen Lehre",
        },
        {
          text: "für die Stärkung von Demokratie",
        },
        {
          text: "für die Verbreitung von Unterhaltungselektronik",
        },
        {
          text: "für militärische Zwecke",
        },
      ],
    },
    {
      key: "html_development",
      text: "Wer arbeitet alles an der Weiterentwicklung von HTML?",
      type: "checkbox",
      answers: [
        {
          text: "das World Wide Web Consortium (W3C)",
          correct: true,
        },
        {
          text: "die Europäische Union (EU)",
        },
        {
          text: "die offene Gesellschaft",
        },
        {
          text: "die Organisation des Nordatlantikvertrags (NATO)",
        },
        {
          text: "die Nationale Sicherheitsbehörde (NSA)",
        },
        {
          text: "die Vereinten Nationen (UN)",
        },
        {
          text: "die Web Hypertext Application Technology Working Group (WHATWG)",
          correct: true,
        },
        {
          text: "Facebook",
        },
        {
          text: "Youtube",
        },
      ],
    },
    {
      key: "html_lists",
      text: "Welche der HTML-Tags dienen zur Darstellung von Listen?",
      type: "checkbox",
      answers: [
        {
          text: "<audio>",
        },
        {
          text: "<img>",
        },
        {
          text: "<li>",
          correct: true,
        },
        {
          text: "<ol>",
          correct: true,
        },
        {
          text: "<table>",
        },
        {
          text: "<td>",
        },
        {
          text: "<tr>",
        },
        {
          text: "<ul>",
          correct: true,
        },
        {
          text: "<video>",
        },
      ],
    },
  ],
  feedback: true,
  extensions: [
    ["ccm.load", "././resources/extensions.mjs#escapeHTML"],
    ["ccm.load", "././resources/extensions.mjs#restore"],
    ["ccm.load", "././resources/extensions.mjs#shuffleQuestions"],
    ["ccm.load", "././resources/extensions.mjs#randomAnswers"],
    ["ccm.load", "././resources/extensions.mjs#timestamps"],
    ["ccm.load", "././resources/extensions.mjs#summary"],
    ["ccm.load", "././resources/extensions.mjs#progressBar"],
    ["ccm.load", "././resources/extensions.mjs#paging"],
    // ["ccm.load", "././resources/extensions.mjs#noFinishButton"],
    ["ccm.load", "././resources/extensions.mjs#skippable"],
    ["ccm.load", "././resources/extensions.mjs#anytimeFinish"],
    ["ccm.load", "././resources/extensions.mjs#prevButton"],
    ["ccm.load", "././resources/extensions.mjs#triState"],
    ["ccm.load", "././resources/extensions.mjs#decisionScore"],
    ["ccm.load", "././resources/extensions.mjs#store"],
    ["ccm.load", "././resources/extensions.mjs#analytics"],
    ["ccm.load", "././resources/extensions.mjs#restart"],
  ],
  /** Authentication component shared by this quiz and its results datastore. */
  user: [
    "ccm.instance",
    "https://ccmjs.github.io/user/ccm.user.mjs",
    {
      realm: "we_test",
      registration: true,
      autoLogin: true,
      // Load the user's resources from its repository, not relative to the embedding quiz page.
      ui: ["ccm.load", "https://ccmjs.github.io/user/libs/ccm-ui/ccm-ui.mjs"],
      views: ["ccm.load", "https://ccmjs.github.io/user/resources/views.mjs"],
      css: ["ccm.load", "https://ccmjs.github.io/user/resources/styles.css"],
      providers: [
        [
          "ccm.instance",
          "https://ccmjs.github.io/google_login/ccm.google_login.mjs",
          {
            // Resolve provider resources independently of the page embedding this demo.
            url: "https://ccmjs.github.io/google_login/auth.html",
            ui: ["ccm.load", "https://ccmjs.github.io/google_login/libs/ccm-ui/ccm-ui.mjs"],
            views: ["ccm.load", "https://ccmjs.github.io/google_login/resources/views.mjs"],
            css: ["ccm.load", "https://ccmjs.github.io/google_login/resources/styles.css"],
          },
        ],
      ],
    },
  ],
  /** Storage and initial permissions for completed quiz attempts. */
  results: {
    /** App identifier; falls back to `app.key`, then a generated key when omitted. */
    key: "what_is_html",
    /** The server stores results in its configured MongoDB database. */
    store: ["ccm.store", { name: "quiz-results", url: "http://localhost:8080" }],
    /** Require login and include realm and user key in each result. */
    userSpecific: true,
    /** replace: one result per app/user; append: a new result for each attempt. */
    mode: "replace",
    /** Optional state-to-result mapping: a function or source-path → target-path object. */
    mapper: ["ccm.load", "././resources/mappers.mjs#result"],
    /** Creation defaults only; the server assigns the authenticated owner. */
    _: {
      access: { get: "owner", set: "owner", del: "owner" },
      schedule: [
        {
          from: "2026-09-22T12:00:00+02:00",
          access: { get: "all", set: "owner", del: "owner" },
        },
      ],
    },
  },
};
