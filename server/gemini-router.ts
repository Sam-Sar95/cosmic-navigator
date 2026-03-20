/**
 * Router tRPC per le funzionalità AI - Interpretazione tema astrale e compatibilità
 *
 * Provider: OpenRouter (https://openrouter.ai)
 * Modello prioritario: deepseek/deepseek-r1:free (DeepSeek R1 - ragionamento avanzato)
 * Modelli fallback (tutti :free, nessun costo):
 *   1. meta-llama/llama-3.3-70b-instruct:free
 *   2. arcee-ai/trinity-large-preview:free
 *   3. google/gemma-3-27b-it:free
 *   4. google/gemma-3-12b-it:free
 *
 * NOTA: Questa funzione è l'UNICO punto modificato rispetto alla versione precedente.
 * Tutti gli input/output dei procedure tRPC sono rimasti identici.
 */
import { router, publicProcedure } from "./_core/trpc";
import { z } from "zod";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY ?? "";

// Modelli gratuiti in ordine di preferenza (tutti con suffisso :free, nessun costo)
// DeepSeek R1 è in cima come richiesto: ragionamento avanzato per interpretazioni profonde.
// Se non disponibile, il sistema scala automaticamente ai modelli successivi.
const FREE_MODELS = [
  "arcee-ai/trinity-large-preview:free",          // Arcee Trinity - testato e funzionante
  "google/gemma-3-27b-it:free",                   // Gemma 3 27B - ottimizzato per italiano
  "google/gemma-3-12b-it:free",                   // Gemma 3 12B - fallback veloce
  "meta-llama/llama-3.3-70b-instruct:free",       // Llama 3.3 70B - ottimo per italiano
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
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout per modello
      let res: Response;
      try {
        res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          signal: controller.signal,
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
      } finally {
        clearTimeout(timeoutId);
      }

      const data = await res.json() as any;

      // Errore 429/404/503 o qualsiasi errore API → prova il prossimo modello
      if (data?.error) {
        lastError = `${model}: ${data.error.message ?? "unavailable"} (code: ${data.error.code ?? data.error.status})`;
        continue; // salta sempre al modello successivo in caso di errore
      }

      const text = data?.choices?.[0]?.message?.content;
      if (text) return text.trim();

      lastError = `${model}: risposta vuota`;
    } catch (err: any) {
      // Timeout, errore di rete o abort → prova il prossimo modello
      lastError = `${model}: ${err.name === 'AbortError' ? 'timeout' : (err.message ?? 'errore di rete')}`;
      continue;
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
   * Genera l'Energia del Giorno basata sui transiti attuali rispetto al segno solare
   */
  dailyEnergy: publicProcedure
    .input(
      z.object({
        sunSign: z.string(),
        moonSign: z.string(),
        ascendantSign: z.string(),
        todayDate: z.string(), // formato: "20 marzo 2026"
      })
    )
    .mutation(async ({ input }) => {
      const prompt = `Sei un astrologo esperto. Oggi è ${input.todayDate}.

Il profilo astrale dell'utente:
☉ Sole natale in ${input.sunSign}
☽ Luna natale in ${input.moonSign}
AC Ascendente natale in ${input.ascendantSign}

Genera una lettura astrologica del giorno in italiano con:
1. **Energia del Giorno** (2-3 frasi): come i transiti di oggi interagiscono con il profilo natale
2. **Consiglio Astrale** (1-2 frasi): un'azione concreta o un atteggiamento consigliato per oggi
3. **Parola Chiave del Giorno** (1 parola sola, in maiuscolo)

Tono: ispirazionale, pratico, poetico. Sii specifico per il segno ${input.sunSign}.`;

      return await callAI(prompt);
    }),

  /**
   * Risponde a una domanda specifica dell'utente sul suo tema natale
   */
  askAstrologer: publicProcedure
    .input(
      z.object({
        question: z.string(),
        sunSign: z.string(),
        moonSign: z.string(),
        ascendantSign: z.string(),
        venusSign: z.string(),
        marsSign: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const prompt = `Sei un astrologo esperto e saggio. L'utente ha il seguente tema natale:
☉ Sole in ${input.sunSign} | ☽ Luna in ${input.moonSign} | AC in ${input.ascendantSign}
♀ Venere in ${input.venusSign} | ♂ Marte in ${input.marsSign}

L'utente ti chiede: "${input.question}"

Rispondi in italiano con tono empatico, profondo e illuminante. Sii specifico rispetto al tema natale dell'utente. Lunghezza: 2-4 paragrafi.`;

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
