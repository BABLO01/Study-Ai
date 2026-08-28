import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Content-Type": "application/json; charset=utf-8",
};

function systemPrompt(language: string) {
  if (language === "ur") {
    return `آپ ایک مہذب اور مددگار AI Study Mentor ہیں۔
جواب صرف اردو رسم الخط میں دیں۔
ہندی دیوناگری استعمال نہ کریں۔
غیر ضروری ہندی الفاظ سے گریز کریں اور جہاں ممکن ہو معیاری پاکستانی اردو استعمال کریں۔
تعلیمی سوال کا جواب آسان، واضح اور مرحلہ وار انداز میں دیں۔
اگر کوئی English اصطلاح ضروری ہو تو اسے قوسین میں مختصر طور پر لکھ سکتے ہیں۔`;
  }
  return `You are a helpful AI Study Mentor. Answer clearly, accurately, and at an appropriate level for a student. Use English unless the user explicitly asks for another language.`;
}

async function callOpenAI(question: string, language: string) {
  const key = Deno.env.get("OPENAI_API_KEY");
  if (!key) throw new Error("OPENAI_API_KEY is not configured in Supabase Secrets.");

  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: Deno.env.get("OPENAI_MODEL") || "gpt-5.6-mini",
      instructions: systemPrompt(language),
      input: question,
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "OpenAI request failed.");
  const answer = data.output_text ?? "";
  return answer;
}

async function callGemini(question: string, language: string) {
  const key = Deno.env.get("GEMINI_API_KEY");
  if (!key) throw new Error("GEMINI_API_KEY is not configured in Supabase Secrets.");

  const model = Deno.env.get("GEMINI_MODEL") || "gemini-2.5-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: systemPrompt(language) }] },
      contents: [{ role: "user", parts: [{ text: question }] }],
    }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data?.error?.message || "Gemini request failed.");
  return data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text || "").join("") || "";
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { question, language = "ur" } = await req.json();
    if (!question || typeof question !== "string") {
      return new Response(JSON.stringify({ error: "Question is required." }), { status: 400, headers: corsHeaders });
    }

    const provider = (Deno.env.get("AI_PROVIDER") || "openai").toLowerCase();
    const answer = provider === "gemini"
      ? await callGemini(question, language)
      : await callOpenAI(question, language);

    return new Response(JSON.stringify({ answer }), { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error(error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "AI request failed." }), { status: 500, headers: corsHeaders });
  }
});
