import { describe, it, expect } from "vitest";

describe("Gemini API Key", () => {
  it("should have GEMINI_API_KEY set", () => {
    const key = process.env.GEMINI_API_KEY;
    expect(key).toBeTruthy();
    expect(key?.length).toBeGreaterThan(10);
  });

  it("should call Gemini API (200 = success, 429 = quota exceeded = key is valid)", async () => {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY not set, skipping API test");
      return;
    }

    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Rispondi con una sola parola: stelle" }] }],
          generationConfig: { maxOutputTokens: 10 },
        }),
      }
    );

    // 200 = successo, 429 = quota esaurita (chiave valida), entrambi sono accettabili
    const isValidStatus = res.status === 200 || res.status === 429;
    expect(isValidStatus).toBe(true);

    if (res.status === 200) {
      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      expect(text).toBeTruthy();
      console.log("✅ Gemini risposta:", text);
    } else {
      console.log("⚠️ Gemini quota esaurita (chiave valida, limite free tier raggiunto)");
    }
  }, 15000);
});
