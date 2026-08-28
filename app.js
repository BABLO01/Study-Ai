/*
  AI Study Mentor starter.
  IMPORTANT: No AI API key belongs in this browser file.
  The browser calls the Supabase Edge Function "ask-ai".
*/

const SUPABASE_URL = "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE";
const SUPABASE_PUBLISHABLE_KEY = "PASTE_YOUR_SUPABASE_PUBLISHABLE_KEY_HERE";
const FUNCTION_NAME = "ask-ai";

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

const text = {
  ur: {
    title: "اپنے AI استاد سے پوچھیں",
    label: "اپنا سوال لکھیں",
    placeholder: "مثلاً: Photosynthesis کو آسان اردو میں سمجھائیں۔",
    ask: "AI سے پوچھیں",
    mic: "بول کر پوچھیں",
    listening: "سن رہا ہوں… اردو میں بولیں۔",
    ready: "تیار ہے۔",
    speaking: "جواب سنایا جا رہا ہے…",
    error: "معذرت، اس وقت جواب حاصل نہیں ہو سکا۔",
    noSpeech: "آپ کی آواز سنائی نہیں دی۔ دوبارہ کوشش کریں۔"
  },
  en: {
    title: "Ask your AI Study Mentor",
    label: "Write your question",
    placeholder: "Example: Explain photosynthesis in simple English.",
    ask: "Ask AI",
    mic: "Ask by voice",
    listening: "Listening… speak clearly.",
    ready: "Ready.",
    speaking: "Reading the answer…",
    error: "Sorry, the answer could not be retrieved.",
    noSpeech: "No speech was detected. Please try again."
  }
};

function setLanguage(lang) {
  const t = text[lang];
  document.documentElement.lang = lang === "ur" ? "ur" : "en";
  document.documentElement.dir = lang === "ur" ? "rtl" : "ltr";
  els.title.textContent = t.title;
  els.label.textContent = t.label;
  els.question.placeholder = t.placeholder;
  els.ask.querySelector("span").textContent = t.ask;
  els.mic.querySelector("span").textContent = t.mic;
  els.status.textContent = "";
}
els.language.addEventListener("change", e => setLanguage(e.target.value));
setLanguage("ur");

els.ask.addEventListener("click", async () => {
  const question = els.question.value.trim();
  const language = els.language.value;
  if (!question) return;

  els.ask.disabled = true;
  els.answer.textContent = language === "ur" ? "AI جواب تیار کر رہا ہے…" : "Preparing your AI answer…";
  els.speak.hidden = true;

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/${FUNCTION_NAME}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_PUBLISHABLE_KEY
      },
      body: JSON.stringify({ question, language })
    });

    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Request failed");
    els.answer.textContent = data.answer || "";
    els.speak.hidden = !data.answer;
  } catch (err) {
    console.error(err);
    els.answer.textContent = text[language].error;
  } finally {
    els.ask.disabled = false;
  }
});

/* Voice input: uses the device/browser speech recognition where supported.
   No private API key is exposed here. */
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.continuous = false;
  recognition.interimResults = false;

  els.mic.addEventListener("click", () => {
    const lang = els.language.value;
    recognition.lang = lang === "ur" ? "ur-PK" : "en-US";
    els.status.textContent = text[lang].listening;
    recognition.start();
  });

  recognition.onresult = event => {
    els.question.value = event.results[0][0].transcript;
    els.status.textContent = text[els.language.value].ready;
  };

  recognition.onerror = () => {
    els.status.textContent = text[els.language.value].noSpeech;
  };
} else {
  els.mic.disabled = true;
  els.status.textContent = "Voice input is not supported by this browser.";
}

/* Voice output: device/browser speech synthesis. */
els.speak.addEventListener("click", () => {
  const lang = els.language.value;
  const utterance = new SpeechSynthesisUtterance(els.answer.textContent);
  utterance.lang = lang === "ur" ? "ur-PK" : "en-US";
  els.status.textContent = text[lang].speaking;
  speechSynthesis.cancel();
  speechSynthesis.speak(utterance);
});
