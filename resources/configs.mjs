export const demo = {
  key: "demo",
  questions: [
    {
      text: "Was ist HTML?",
      type: "radio",
      description:
        "Wählen Sie unter den folgenden Antworten die richtige Antwort aus.",
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
      text: "Wer hat HTML erfunden?",
      type: "radio",
      answers: [
        {
          text: "Bill Gates",
          comment: "Bill Gates ist der Gründer von Microsoft.",
        },
        {
          text: "Fred Feuerstein",
          comment:
            "Fred Feuerstein ist der Vater in der Familie Feuerstein aus der gleichnamigen Zeichentrickserie.",
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
          comment:
            "Robert Cailliau ist der erste Web-Surfer und Freund von Tim-Berners-Lee.",
        },
        {
          text: "Steve Jobs",
          comment: "Steve Jobs ist der Gründer von Apple.",
        },
        {
          text: "Tim Berners-Lee",
          comment:
            "Tim Berners-Lee ist der Erfinder von HTML und der Begründer des World Wide Web (WWW).",
        },
      ],
    },
    {
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
      text: "Wer arbeitet alles an der Weiterentwicklung von HTML?",
      type: "checkbox",
      description: "<b style='color: orangered;'>Mehrfachauswahl möglich</b>",
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
      text: "Welche der HTML-Tags dienen zur Darstellung von Listen?",
      description: "<b style='color: orangered;'>Mehrfachauswahl möglich</b>",
      type: "checkbox",
      answers: [
        {
          text: "&lt;audio&gt;",
        },
        {
          text: "&lt;img&gt;",
        },
        {
          text: "&lt;li&gt;",
          correct: true,
        },
        {
          text: "&lt;ol&gt;",
          correct: true,
        },
        {
          text: "&lt;table&gt;",
        },
        {
          text: "&lt;td&gt;",
        },
        {
          text: "&lt;tr&gt;",
        },
        {
          text: "&lt;ul&gt;",
          correct: true,
        },
        {
          text: "&lt;video&gt;",
        },
      ],
    },
  ],
  onaction: [
    // ["ccm.load", "././resources/actions.mjs#startButton"],
    // ["ccm.load", "././resources/actions.mjs#escapeHTML"],
    // ["ccm.load", "././resources/actions.mjs#shuffleQuestions"],
    // ["ccm.load", "././resources/actions.mjs#randomAnswers"],
    ["ccm.load", "././resources/actions.mjs#anytimeFinish"],
    // ["ccm.load", "././resources/actions.mjs#store"],
    ["ccm.load", "././resources/actions.mjs#restore"],
    ["ccm.load", "././resources/actions.mjs#resultMode"],
    ["ccm.load", "././resources/actions.mjs#analytics"],
    ["ccm.load", "././resources/actions.mjs#restart"],
  ],
  store: ["ccm.store", { name: "quiz" }],
};
