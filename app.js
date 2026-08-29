/*
  Study AI - corrected app.js

  IMPORTANT:
  - Gemini API key इस file में कभी न डालें।
  - Gemini API key केवल Supabase Edge Function के Secret में रहेगी.
*/

const SUPABASE_URL = "https://aoflthtjjmatlsybczuq.supabase.co";

const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_2IPYcope6j2tNxTIEX6_Nw_8HnNVIh_";

const FUNCTION_NAME = "ask-ai";


/* =========================
   ELEMENTS
========================= */

const els = {
  language: document.getElementById("language"),
  question: document.getElementById("question"),
  ask: document.getElementById("askBtn"),
  mic: document.getElementById("micBtn"),
  answer: document.getElementById("answer"),
  status: document.getElementById("voiceStatus"),
  speak: document.getElementById("speakBtn"),
  title: document.getElementById("title"),
  label: document.getElementById("questionLabel")
};


/* =========================
   TRANSLATIONS
========================= */

const text = {

  ur: {
    title: "اپنے AI استاد سے پوچھیں",

    label: "اپنا سوال لکھیں",

    placeholder:
      "مثلاً: Photosynthesis کو آسان اردو میں سمجھائیں۔",

    ask:
      "AI سے پوچھیں",

    mic:
      "بول کر پوچھیں",

    listening:
      "سن رہا ہوں… اردو میں بولیں۔",

    ready:
      "تیار ہے۔",

    speaking:
      "جواب سنایا جا رہا ہے…",

    thinking:
      "AI جواب تیار کر رہا ہے…",

    error:
      "معذرت، اس وقت جواب حاصل نہیں ہو سکا۔",

    noSpeech:
      "آپ کی آواز سنائی نہیں دی۔ دوبارہ کوشش کریں۔"
  },


  en: {
    title:
      "Ask your AI Study Mentor",

    label:
      "Write your question",

    placeholder:
      "Example: Explain photosynthesis in simple English.",

    ask:
      "Ask AI",

    mic:
      "Ask by voice",

    listening:
      "Listening… speak clearly.",

    ready:
      "Ready.",

    speaking:
      "Reading the answer…",

    thinking:
      "Preparing your AI answer…",

    error:
      "Sorry, the answer could not be retrieved.",

    noSpeech:
      "No speech was detected. Please try again."
  }

};


/* =========================
   LANGUAGE
========================= */

function setLanguage(lang) {

  const t = text[lang] || text.ur;

  document.documentElement.lang =
    lang === "ur" ? "ur" : "en";

  document.documentElement.dir =
    lang === "ur" ? "rtl" : "ltr";


  if (els.title) {
    els.title.textContent = t.title;
  }


  if (els.label) {
    els.label.textContent = t.label;
  }


  if (els.question) {
    els.question.placeholder = t.placeholder;
  }


  if (els.ask) {

    const askSpan =
      els.ask.querySelector("span");

    if (askSpan) {
      askSpan.textContent = t.ask;
    }

  }


  if (els.mic) {

    const micSpan =
      els.mic.querySelector("span");

    if (micSpan) {
      micSpan.textContent = t.mic;
    }

  }


  if (els.status) {
    els.status.textContent = t.ready;
  }

}


/* =========================
   ERROR DISPLAY
========================= */

function showError(message, language) {

  if (!els.answer) {
    return;
  }


  const safeMessage =
    String(message || "").trim();


  els.answer.textContent =
    `${text[language].error}

${safeMessage || "Unknown error."}`;


  if (els.speak) {
    els.speak.hidden = true;
  }

}


/* =========================
   LANGUAGE SELECTOR
========================= */

if (els.language) {

  els.language.addEventListener(
    "change",
    function (event) {

      setLanguage(event.target.value);

    }
  );

}


/* Initial language */

setLanguage(
  els.language
    ? els.language.value
    : "ur"
);


/* =========================
   ASK AI
========================= */

if (els.ask) {

  els.ask.addEventListener(
    "click",
    async function () {

      const question =
        els.question
          ? els.question.value.trim()
          : "";

      const language =
        els.language
          ? els.language.value
          : "ur";


      /* Empty question */

      if (!question) {

        if (els.status) {

          els.status.textContent =
            language === "ur"
              ? "براہِ کرم پہلے اپنا سوال لکھیں۔"
              : "Please enter a question first.";

        }

        return;
      }


      /* Disable button while requesting */

      els.ask.disabled = true;


      /* Loading message */

      if (els.answer) {

        els.answer.textContent =
          text[language].thinking;

      }


      if (els.speak) {
        els.speak.hidden = true;
      }


      try {

        /* Remove trailing slash */

        const baseUrl =
          SUPABASE_URL.replace(/\/+$/, "");


        /* Supabase Edge Function URL */

        const endpoint =
          `${baseUrl}/functions/v1/${FUNCTION_NAME}`;


        /* Send request */

        const response =
          await fetch(
            endpoint,
            {
              method: "POST",

              headers: {

                "Content-Type":
                  "application/json",

                "apikey":
                  SUPABASE_PUBLISHABLE_KEY,

                "Authorization":
                  `Bearer ${SUPABASE_PUBLISHABLE_KEY}`

              },

              body:
                JSON.stringify({

                  question:
                    question,

                  language:
                    language

                })

            }
          );


        /*
          Read response as TEXT first.

          This is important because if Supabase
          sends an error that is not JSON,
          we can still see the real error.
        */

        const raw =
          await response.text();


        let data = null;


        /*
          Try to convert response to JSON
        */

        try {

          data =
            raw
              ? JSON.parse(raw)
              : null;

        }

        catch (jsonError) {

          throw new Error(
            `HTTP ${response.status}: ${
              raw ||
              "Empty response from server."
            }`
          );

        }


        /*
          HTTP error
        */

        if (!response.ok) {

          throw new Error(

            data?.error ||

            data?.message ||

            `HTTP ${response.status}`

          );

        }


        /*
          Backend itself returned an error
        */

        if (data?.success === false) {

          throw new Error(

            data.error ||

            data.message ||

            "The AI function returned an error."

          );

        }


        /*
          No answer
        */

        if (!data?.answer) {

          throw new Error(

            `HTTP ${response.status}: ` +
            `The AI function returned no answer.`

          );

        }


        /*
          SUCCESS
        */

        els.answer.textContent =
          data.answer;


        /*
          Show speak button
        */

        if (els.speak) {
          els.speak.hidden = false;
        }


        if (els.status) {
          els.status.textContent =
            text[language].ready;
        }


      }

      catch (err) {

        /*
          Console debugging
        */

        console.error(
          "Study AI error:",
          err
        );


        /*
          IMPORTANT:
          Show the REAL error instead of
          hiding it behind a generic message.
        */

        showError(

          err && err.message
            ? err.message
            : "Unknown connection error.",

          language

        );

      }


      finally {

        /*
          Enable button again
        */

        els.ask.disabled = false;

      }

    }
  );

}


/* =========================
   VOICE INPUT
========================= */

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition;


let recognition = null;


if (
  SpeechRecognition &&
  els.mic
) {

  recognition =
    new SpeechRecognition();


  recognition.continuous =
    false;


  recognition.interimResults =
    false;


  /*
    Microphone button
  */

  els.mic.addEventListener(
    "click",
    function () {

      const lang =
        els.language
          ? els.language.value
          : "ur";


      /*
        Urdu Pakistan
        English United States
      */

      recognition.lang =
        lang === "ur"
          ? "ur-PK"
          : "en-US";


      if (els.status) {

        els.status.textContent =
          text[lang].listening;

      }


      try {

        recognition.start();

      }

      catch (err) {

        /*
          Prevent browser error if
          recognition is already running.
        */

        console.warn(
          "Speech recognition:",
          err
        );

      }

    }
  );


  /*
    Speech result
  */

  recognition.onresult =
    function (event) {

      const transcript =

        event.results &&
        event.results[0] &&
        event.results[0][0]

          ? event.results[0][0]
              .transcript

          : "";


      if (els.question) {

        els.question.value =
          transcript;

      }


      const lang =
        els.language
          ? els.language.value
          : "ur";


      if (els.status) {

        els.status.textContent =
          text[lang].ready;

      }

    };


  /*
    Speech error
  */

  recognition.onerror =
    function (event) {

      const lang =
        els.language
          ? els.language.value
          : "ur";


      if (els.status) {

        els.status.textContent =

          `${text[lang].noSpeech} ` +
          `(${event.error || "speech-error"})`;

      }

    };


  /*
    Speech ended
  */

  recognition.onend =
    function () {

      const lang =
        els.language
          ? els.language.value
          : "ur";


      if (
        els.status &&
        !els.status.textContent
          .includes("error")
      ) {

        els.status.textContent =
          text[lang].ready;

      }

    };

}


/*
  Browser doesn't support voice
*/

else if (els.mic) {

  els.mic.disabled = true;


  const lang =
    els.language
      ? els.language.value
      : "ur";


  if (els.status) {

    els.status.textContent =

      lang === "ur"

        ? "اس براؤزر میں وائس ان پٹ دستیاب نہیں ہے۔"

        : "Voice input is not supported by this browser.";

  }

}


/* =========================
   TEXT TO SPEECH
========================= */

if (els.speak) {

  els.speak.addEventListener(
    "click",
    function () {

      /*
        Browser doesn't support speech
      */

      if (
        !("speechSynthesis" in window)
      ) {

        return;

      }


      if (!els.answer) {
        return;
      }


      const lang =
        els.language
          ? els.language.value
          : "ur";


      const answer =
        els.answer.textContent.trim();


      if (!answer) {
        return;
      }


      /*
        Create speech
      */

      const utterance =
        new SpeechSynthesisUtterance(
          answer
        );


      utterance.lang =
        lang === "ur"
          ? "ur-PK"
          : "en-US";


      utterance.rate =
        0.95;


      if (els.status) {

        els.status.textContent =
          text[lang].speaking;

      }


      /*
        Stop previous speech
      */

      speechSynthesis.cancel();


      /*
        Speak
      */

      speechSynthesis.speak(
        utterance
      );


      /*
        Speech finished
      */

      utterance.onend =
        function () {

          if (els.status) {

            els.status.textContent =
              text[lang].ready;

          }

        };

    }
  );

}
