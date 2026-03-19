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
        timezone: z.number(),
      }))
      .mutation(async ({ input }) => {
        // Chiama il servizio Python per i calcoli
        const { execSync } = require('child_process');
        try {
          const result = execSync(
            `python3 ${process.cwd()}/server/astrology_service.py`,
            { input: JSON.stringify(input), encoding: 'utf-8' }
          );
          return JSON.parse(result);
        } catch (error: any) {
          console.error('Astrology calculation error:', error.message);
          throw new Error('Errore nel calcolo del tema astrale');
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
