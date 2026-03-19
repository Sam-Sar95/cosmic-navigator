/**
 * Router tRPC per le funzionalità AI - Interpretazione tema astrale e compatibilità
 *
 * Provider: OpenRouter (https://openrouter.ai)
 * Modello principale: meta-llama/llama-3.3-70b-instruct:free
 * Modelli fallback (tutti :free, nessun costo):
 *   1. google/gemma-3-27b-it:free
 *   2. google/gemma-3-12b-it:free
 *
 * NOTA: Questa funzione è l'UNICO punto modificato rispetto alla versione precedente.
 * Tutti gli input/output dei procedure tRPC sono rimasti identici.
 */
import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";

// Modelli gratuiti in ordine di preferenza (tutti con suffisso :free)
const FREE_MODELS = [
  "meta-llama/llama-3.3-70b-instruct:free",
  "google/gemma-3-27b-it:free",
  "google/gemma-3-12b-it:free",
];

/**
 * Chiama OpenRouter con fallback automatico tra modelli gratuiti.
 * Mantiene lo stesso contratto della precedente callGemini(prompt): string.
 */
async function callAI(prompt: string): Promise<string> {
  if (!OPENROUTER_API_KEY) {
    throw new Error(
      "Chiave API OpenRouter non configurata. Aggiungila nelle impostazioni dell'app."
    );
  }

  let lastError: string = "";

  for (const model of FREE_MODELS) {
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "https://cosmic-navigator.app",
          "X-Title": "Cosmic Navigator",
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: "system",
              content:
                "Sei un astrologo esperto. Rispondi sempre in italiano con tono poetico, profondo e illuminante.",
            },
            { role: "user", content: prompt },
          ],
          max_tokens: 900,
          temperature: 0.8,
        }),
      });

      const data = await res.json() as any;

      // Errore 429 (rate limit) o 404 (modello non disponibile) → prova il prossimo
      if (data?.error) {
        const code = data.error.code ?? data.error.status;
        if (code === 429 || code === 404 || code === 503) {
          lastError = `${model}: ${data.error.message ?? "unavailable"}`;
          continue;
        }
        throw new Error(`Errore AI (${model}): ${data.error.message}`);
      }

      const text = data?.choices?.[0]?.message?.content;
      if (text) return text.trim();

      lastError = `${model}: risposta vuota`;
    } catch (err: any) {
      // Errore di rete → prova il prossimo modello
      if (err.message?.includes("fetch")) {
        lastError = `${model}: errore di rete`;
        continue;
      }
      throw err;
    }
  }

  throw new Error(
    `Tutti i modelli AI sono temporaneamente non disponibili. Riprova tra qualche minuto. (${lastError})`
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Router tRPC — Input/Output IDENTICI alla versione precedente con Gemini
// ─────────────────────────────────────────────────────────────────────────────

export const geminiRouter = router({
  /**
   * Interpreta un singolo elemento astrologico (pianeta, ascendente, ecc.)
   */
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

      return await callAI(prompt);
    }),

  /**
   * Interpreta il tema astrale completo
   */
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

      return await callAI(prompt);
    }),

  /**
   * Analizza la compatibilità tra due temi astrali (sinastria)
   */
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

      return await callAI(prompt);
    }),
});
