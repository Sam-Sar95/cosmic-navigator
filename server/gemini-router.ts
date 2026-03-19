/**
 * Router tRPC per le funzionalità Gemini AI
 * Interpretazione del tema astrale e analisi compatibilità
 */
import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";

const GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? "";

async function callGemini(prompt: string): Promise<string> {
  if (!GEMINI_API_KEY) {
    throw new Error("Chiave API Gemini non configurata. Aggiungila nelle impostazioni dell'app.");
  }

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.8,
          maxOutputTokens: 800,
        },
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Errore Gemini API: ${err}`);
  }

  const data = await res.json();
  return data?.candidates?.[0]?.content?.parts?.[0]?.text ?? "Nessuna risposta disponibile.";
}

export const geminiRouter = router({
  interpretElement: publicProcedure
    .input(
      z.object({
        planetName: z.string(),
        sign: z.string(),
        degrees: z.number(),
        minutes: z.number(),
        house: z.number(),
        retrograde: z.boolean(),
      })
    )
    .mutation(async ({ input }) => {
      const retroStr = input.retrograde ? " in moto retrogrado" : "";
      const prompt = `Sei un astrologo esperto. Fornisci un'interpretazione astrologica dettagliata, personale e poetica in italiano per:

${input.planetName} a ${input.degrees}°${input.minutes}' in ${input.sign}${retroStr}, nella Casa ${input.house}.

Descrivi:
1. Il significato di questo pianeta in questo segno
2. L'influenza della Casa ${input.house} su questa posizione
3. Come questa energia si manifesta nella vita quotidiana
4. ${input.retrograde ? "Il significato del moto retrogrado per questo pianeta" : "I punti di forza di questa posizione"}

Tono: poetico, profondo, illuminante. Lunghezza: 3-4 paragrafi.`;

      const text = await callGemini(prompt);
      return text;
    }),

  interpretFullTheme: publicProcedure
    .input(
      z.object({
        sun: z.string(),
        moon: z.string(),
        ascendant: z.string(),
        mercury: z.string(),
        venus: z.string(),
        mars: z.string(),
        jupiter: z.string(),
        saturn: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const prompt = `Sei un astrologo esperto. Fornisci un'interpretazione completa del tema astrale in italiano:

☉ Sole in ${input.sun}
☽ Luna in ${input.moon}
AC Ascendente in ${input.ascendant}
☿ Mercurio in ${input.mercury}
♀ Venere in ${input.venus}
♂ Marte in ${input.mars}
♃ Giove in ${input.jupiter}
♄ Saturno in ${input.saturn}

Fornisci:
1. Il carattere generale della persona
2. I punti di forza principali
3. Le sfide da affrontare
4. Il percorso evolutivo suggerito dalle stelle

Tono: profondo, empatico, costruttivo. Lunghezza: 4-5 paragrafi.`;

      const text = await callGemini(prompt);
      return text;
    }),

  analyzeCompatibility: publicProcedure
    .input(
      z.object({
        themeA: z.object({
          name: z.string(),
          sun: z.string(),
          moon: z.string(),
          ascendant: z.string(),
          venus: z.string(),
          mars: z.string(),
        }),
        themeB: z.object({
          name: z.string(),
          sun: z.string(),
          moon: z.string(),
          ascendant: z.string(),
          venus: z.string(),
          mars: z.string(),
        }),
      })
    )
    .mutation(async ({ input }) => {
      const { themeA, themeB } = input;
      const prompt = `Sei un astrologo esperto in sinastria (compatibilità astrologica). Analizza la compatibilità tra questi due temi astrali in italiano:

**${themeA.name}:**
☉ Sole in ${themeA.sun} · ☽ Luna in ${themeA.moon} · AC in ${themeA.ascendant}
♀ Venere in ${themeA.venus} · ♂ Marte in ${themeA.mars}

**${themeB.name}:**
☉ Sole in ${themeB.sun} · ☽ Luna in ${themeB.moon} · AC in ${themeB.ascendant}
♀ Venere in ${themeB.venus} · ♂ Marte in ${themeB.mars}

Analizza:
1. La compatibilità emotiva (Sole e Luna)
2. La compatibilità romantica (Venere e Marte)
3. La compatibilità caratteriale (Ascendenti)
4. I punti di forza della relazione
5. Le sfide da superare insieme

Tono: equilibrato, onesto, costruttivo. Lunghezza: 4-5 paragrafi.`;

      const text = await callGemini(prompt);
      return text;
    }),
});
