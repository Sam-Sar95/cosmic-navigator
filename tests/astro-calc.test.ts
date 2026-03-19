/**
 * Test di verifica del motore astrologico
 * Dati di riferimento: 10/05/1995 13:20 Ceva (CN)
 * Lat: 44.3833, Lon: 8.0333, TZ: +2 (ora legale CEST)
 *
 * Valori attesi (da AstroSeek/Aquarius2go):
 * Sole: 19°20' Toro
 * Luna: 20°12' Vergine
 * Mercurio: 10°40' Gemelli
 * Venere: 22°7' Ariete
 * Marte: 23°36' Leone
 * Giove: 13°9' Sagittario (retrogrado)
 * Saturno: 22°12' Pesci
 * Urano: 0°28' Acquario (retrogrado)
 * Nettuno: 25°31' Capricorno (retrogrado)
 * Plutone: 29°30' Scorpione (retrogrado)
 * Nodo Luna: 4°54' Scorpione (retrogrado)
 * Chirone: 20°3' Vergine (retrogrado)
 * Lilith: 14°8' Gemelli
 * Ascendente: 26°22' Leone
 * Medio Cielo: 18°18' Toro
 */

import { describe, it, expect } from "vitest";
import { calculateAstralTheme } from "../lib/astro-calc";

const BIRTH_DATA = {
  year: 1995, month: 5, day: 10,
  hour: 13, minute: 20,
  latitude: 44.3833, longitude: 8.0333,
  timezone: 2,  // CEST (ora legale)
  placeName: "Ceva",
};

describe("Calcolo Tema Astrale - Dati di riferimento Ceva 10/05/1995 13:20", () => {
  const result = calculateAstralTheme(BIRTH_DATA);

  it("Sole in Toro ~19°", () => {
    expect(result.sun.sign).toBe("Toro");
    expect(result.sun.degrees).toBeGreaterThanOrEqual(18);
    expect(result.sun.degrees).toBeLessThanOrEqual(20);
  });

  it("Luna in Vergine ~20°", () => {
    expect(result.moon.sign).toBe("Vergine");
    expect(result.moon.degrees).toBeGreaterThanOrEqual(18);
    expect(result.moon.degrees).toBeLessThanOrEqual(22);
  });

  it("Mercurio in Gemelli ~10°", () => {
    expect(result.mercury.sign).toBe("Gemelli");
    expect(result.mercury.degrees).toBeGreaterThanOrEqual(8);
    expect(result.mercury.degrees).toBeLessThanOrEqual(13);
  });

  it("Venere in Ariete ~22°", () => {
    expect(result.venus.sign).toBe("Ariete");
    expect(result.venus.degrees).toBeGreaterThanOrEqual(20);
    expect(result.venus.degrees).toBeLessThanOrEqual(24);
  });

  it("Marte in Leone ~23°", () => {
    expect(result.mars.sign).toBe("Leone");
    expect(result.mars.degrees).toBeGreaterThanOrEqual(21);
    expect(result.mars.degrees).toBeLessThanOrEqual(25);
  });

  it("Giove in Sagittario ~13° (retrogrado)", () => {
    expect(result.jupiter.sign).toBe("Sagittario");
    expect(result.jupiter.degrees).toBeGreaterThanOrEqual(11);
    expect(result.jupiter.degrees).toBeLessThanOrEqual(15);
  });

  it("Saturno in Pesci ~22°", () => {
    expect(result.saturn.sign).toBe("Pesci");
    expect(result.saturn.degrees).toBeGreaterThanOrEqual(20);
    expect(result.saturn.degrees).toBeLessThanOrEqual(24);
  });

  it("Urano in Acquario ~0°", () => {
    expect(result.uranus.sign).toBe("Acquario");
    expect(result.uranus.degrees).toBeGreaterThanOrEqual(0);
    expect(result.uranus.degrees).toBeLessThanOrEqual(2);
  });

  it("Nettuno in Capricorno ~25°", () => {
    expect(result.neptune.sign).toBe("Capricorno");
    expect(result.neptune.degrees).toBeGreaterThanOrEqual(23);
    expect(result.neptune.degrees).toBeLessThanOrEqual(27);
  });

  it("Plutone in Scorpione ~29°", () => {
    expect(result.pluto.sign).toBe("Scorpione");
    expect(result.pluto.degrees).toBeGreaterThanOrEqual(27);
    expect(result.pluto.degrees).toBeLessThanOrEqual(30);
  });

  it("Nodo Luna in Scorpione ~4°", () => {
    expect(result.northNode.sign).toBe("Scorpione");
    expect(result.northNode.degrees).toBeGreaterThanOrEqual(2);
    expect(result.northNode.degrees).toBeLessThanOrEqual(7);
  });

  it("Lilith in Gemelli ~14°", () => {
    expect(result.lilith.sign).toBe("Gemelli");
    expect(result.lilith.degrees).toBeGreaterThanOrEqual(12);
    expect(result.lilith.degrees).toBeLessThanOrEqual(16);
  });

  it("Ascendente in Leone ~26°", () => {
    expect(result.ascendant.sign).toBe("Leone");
    expect(result.ascendant.degrees).toBeGreaterThanOrEqual(24);
    expect(result.ascendant.degrees).toBeLessThanOrEqual(28);
  });

  it("Medio Cielo in Toro ~18°", () => {
    expect(result.midheaven.sign).toBe("Toro");
    expect(result.midheaven.degrees).toBeGreaterThanOrEqual(16);
    expect(result.midheaven.degrees).toBeLessThanOrEqual(20);
  });

  it("Chirone in Vergine ~20°", () => {
    expect(result.chiron.sign).toBe("Vergine");
    expect(result.chiron.degrees).toBeGreaterThanOrEqual(18);
    expect(result.chiron.degrees).toBeLessThanOrEqual(22);
  });

  it("Deve avere 12 case astrologiche", () => {
    expect(result.houses).toHaveLength(12);
  });

  it("Casa 1 in Leone", () => {
    expect(result.houses[0].sign).toBe("Leone");
  });

  it("Casa 10 in Toro", () => {
    expect(result.houses[9].sign).toBe("Toro");
  });
});
