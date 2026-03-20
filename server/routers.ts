import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { geminiRouter } from "./gemini-router";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  gemini: geminiRouter,

  astrology: router({
    calculate: publicProcedure
      .input(z.object({
        year: z.number(),
        month: z.number(),
        day: z.number(),
        hour: z.number(),
        minute: z.number(),
        latitude: z.number(),
        longitude: z.number(),
        timezone: z.number().optional(),
        placeName: z.string().optional(),
      }))
      .mutation(async ({ input }) => {
        // Chiama il servizio Python (pyswisseph) per i calcoli astrologici
        // Usa percorso assoluto per evitare problemi con interpreti multipli (uv Python 3.13 vs system Python 3.11)
        const { spawn } = await import('child_process');
        const path = await import('path');
        const fs = await import('fs');
        const scriptPath = path.join(process.cwd(), 'server', 'astrology_service.py');
        
        // Cerca il miglior interprete Python disponibile con le librerie necessarie
        const pythonCandidates = [
          '/usr/bin/python3',
          '/usr/bin/python3.11',
          '/usr/local/bin/python3',
          'python3',
        ];
        
        let pythonExe = 'python3';
        for (const candidate of pythonCandidates) {
          try {
            if (candidate.startsWith('/') && fs.existsSync(candidate)) {
              pythonExe = candidate;
              break;
            } else if (!candidate.startsWith('/')) {
              pythonExe = candidate;
            }
          } catch { /* continua */ }
        }
        
        console.log('[astrology] Using Python:', pythonExe, '| Script:', scriptPath);
        
        // Crea un ambiente pulito per Python: rimuove PYTHONPATH e NUITKA_PYTHONPATH
        // che causano 'SRE module mismatch' quando Python 3.11 carica moduli di Python 3.13
        const cleanEnv: NodeJS.ProcessEnv = { ...process.env };
        // Rimuove PYTHONPATH e NUITKA_PYTHONPATH che causano 'SRE module mismatch'
        // quando Python 3.11 carica accidentalmente moduli compilati per Python 3.13
        delete cleanEnv['NUITKA_PYTHONPATH'];
        cleanEnv['PYTHONPATH'] = '';
        cleanEnv['PYTHONNOUSERSITE'] = '1';
        
        // Usa spawnSync per evitare problemi di tipo TypeScript con stdin
        const { spawnSync } = await import('child_process');
        const result = spawnSync(pythonExe, [scriptPath], {
          input: JSON.stringify(input),
          env: cleanEnv,
          encoding: 'utf8',
          timeout: 30000,
          maxBuffer: 10 * 1024 * 1024,
        });
        
        if (result.stderr) console.log('[astrology] Python stderr:', result.stderr.slice(0, 500));
        
        if (result.status !== 0 || result.error) {
          const errMsg = result.stderr || (result.error?.message ?? 'Errore sconosciuto');
          console.error('[astrology] Python failed:', errMsg);
          throw new Error('Errore nel calcolo del tema astrale: ' + errMsg.slice(0, 300));
        }
        
        try {
          const parsed = JSON.parse(result.stdout);
          console.log('[astrology] Success - Sun:', parsed.sun?.degrees, parsed.sun?.sign);
          return parsed;
        } catch (e) {
          throw new Error('Risposta Python non valida: ' + result.stdout.slice(0, 200));
        }
      }),
    
    saveTheme: protectedProcedure
      .input(z.object({
        name: z.string(),
        description: z.string().optional(),
        birthDate: z.string(),
        birthTime: z.string(),
        birthPlace: z.string(),
        latitude: z.number(),
        longitude: z.number(),
        timezone: z.number(),
        planetaryData: z.record(z.string(), z.any()),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createAstralTheme({
          userId: ctx.user.id,
          name: input.name,
          description: input.description,
          birthDate: input.birthDate,
          birthTime: input.birthTime,
          birthPlace: input.birthPlace,
          latitude: input.latitude as any,
          longitude: input.longitude as any,
          timezone: input.timezone as any,
          planetaryData: JSON.stringify(input.planetaryData),
        });
      }),
    
    getTheme: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => {
        return db.getAstralThemeById(input.id);
      }),
    
    getUserThemes: protectedProcedure
      .query(({ ctx }) => {
        return db.getUserAstralThemes(ctx.user.id);
      }),
    
    deleteTheme: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => {
        return db.deleteAstralTheme(input.id);
      }),
  }),
});

export type AppRouter = typeof appRouter;
