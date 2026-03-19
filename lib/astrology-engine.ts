/**
 * Astrology Engine - Calcolo del tema astrale
 * Utilizza Swiss Ephemeris tramite API backend
 */

export interface AstrologicalData {
  sun: PlanetaryPosition;
  moon: PlanetaryPosition;
  mercury: PlanetaryPosition;
  venus: PlanetaryPosition;
  mars: PlanetaryPosition;
  jupiter: PlanetaryPosition;
  saturn: PlanetaryPosition;
  uranus: PlanetaryPosition;
  neptune: PlanetaryPosition;
  pluto: PlanetaryPosition;
  lilith: PlanetaryPosition;
  northNode: PlanetaryPosition;
  chiron: PlanetaryPosition;
  ascendant: PlanetaryPosition;
  midheaven: PlanetaryPosition;
  houses: House[];
}

export interface PlanetaryPosition {
  name: string;
  symbol: string;
  longitude: number; // gradi decimali
  latitude: number;
  sign: string; // segno zodiacale
  signDegrees: number; // gradi nel segno
  signMinutes: number; // minuti nel segno
  signSeconds: number; // secondi nel segno
  house: number; // numero della casa
  retrograde: boolean;
  speed: number; // velocità giornaliera
}

export interface House {
  number: number;
  sign: string;
  longitude: number;
  signDegrees: number;
  signMinutes: number;
  signSeconds: number;
}

export interface BirthData {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
  latitude: number; // latitudine del luogo
  longitude: number; // longitudine del luogo
  timezone: number; // offset UTC in ore
}

// Mapping dei segni zodiacali
const ZODIAC_SIGNS = [
  "Ariete",
  "Toro",
  "Gemelli",
  "Cancro",
  "Leone",
  "Vergine",
  "Bilancia",
  "Scorpione",
  "Sagittario",
  "Capricorno",
  "Acquario",
  "Pesci",
];

// Mapping dei simboli planetari
const PLANET_SYMBOLS: Record<string, string> = {
  sun: "☉",
  moon: "☽",
  mercury: "☿",
  venus: "♀",
  mars: "♂",
  jupiter: "♃",
  saturn: "♄",
  uranus: "♅",
  neptune: "♆",
  pluto: "♇",
  lilith: "⚸",
  northNode: "☊",
  chiron: "⚷",
  ascendant: "AC",
  midheaven: "MC",
};

/**
 * Converte gradi decimali in gradi, minuti, secondi
 */
export function degreesToDMS(
  degrees: number
): { degrees: number; minutes: number; seconds: number } {
  const d = Math.floor(degrees);
  const m = Math.floor((degrees - d) * 60);
  const s = Math.round(((degrees - d) * 60 - m) * 60 * 100) / 100;
  return { degrees: d, minutes: m, seconds: s };
}

/**
 * Ottiene il segno zodiacale da gradi eclittici
 */
export function getZodiacSign(longitude: number): {
  sign: string;
  degrees: number;
  minutes: number;
  seconds: number;
} {
  // Normalizza la longitudine tra 0 e 360
  let lon = longitude % 360;
  if (lon < 0) lon += 360;

  // Ogni segno occupa 30 gradi
  const signIndex = Math.floor(lon / 30);
  const degreesInSign = lon % 30;

  const dms = degreesToDMS(degreesInSign);

  return {
    sign: ZODIAC_SIGNS[signIndex],
    degrees: dms.degrees,
    minutes: dms.minutes,
    seconds: dms.seconds,
  };
}

/**
 * Calcola il numero della casa da una longitudine e lista di cusps
 */
export function getHouse(
  longitude: number,
  houseCusps: number[]
): number {
  // Normalizza la longitudine
  let lon = longitude % 360;
  if (lon < 0) lon += 360;

  // Trova la casa
  for (let i = 0; i < houseCusps.length; i++) {
    const current = houseCusps[i] % 360;
    const next = houseCusps[(i + 1) % houseCusps.length] % 360;

    if (next < current) {
      // Cusps attraversa lo 0
      if (lon >= current || lon < next) {
        return i + 1;
      }
    } else {
      if (lon >= current && lon < next) {
        return i + 1;
      }
    }
  }

  return 1; // Default
}

/**
 * Calcola il tema astrale per una data e luogo di nascita
 * Chiama il backend per i calcoli Swiss Ephemeris
 */
export async function calculateAstralTheme(
  birthData: BirthData
): Promise<AstrologicalData> {
  try {
    const response = await fetch("/api/astrology/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(birthData),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data as AstrologicalData;
  } catch (error) {
    console.error("Errore nel calcolo del tema astrale:", error);
    throw error;
  }
}

/**
 * Formatta una posizione planetaria per la visualizzazione
 */
export function formatPlanetaryPosition(position: PlanetaryPosition): string {
  const retrograde = position.retrograde ? " (retrogrado)" : "";
  return `${position.name} ${position.signDegrees}°${position.signMinutes}' ${position.sign}${retrograde}`;
}

/**
 * Ottiene la descrizione di un segno zodiacale
 */
export function getSignDescription(sign: string): string {
  const descriptions: Record<string, string> = {
    Ariete:
      "Segno di fuoco, impulsivo, coraggioso, intraprendente, leader naturale",
    Toro: "Segno di terra, stabile, affidabile, sensuale, pratico",
    Gemelli:
      "Segno di aria, comunicativo, curioso, versatile, intellettuale",
    Cancro: "Segno di acqua, emotivo, protettivo, sensibile, familiare",
    Leone:
      "Segno di fuoco, generoso, creativo, carismatico, amante del palcoscenico",
    Vergine:
      "Segno di terra, analitico, preciso, metodico, servizievole",
    Bilancia:
      "Segno di aria, equilibrato, diplomatico, socievole, amante della bellezza",
    Scorpione:
      "Segno di acqua, intenso, misterioso, appassionato, trasformativo",
    Sagittario:
      "Segno di fuoco, ottimista, avventuriero, filosofico, espansivo",
    Capricorno:
      "Segno di terra, ambizioso, responsabile, disciplinato, tradizionalista",
    Acquario:
      "Segno di aria, innovativo, indipendente, idealistico, umanitario",
    Pesci:
      "Segno di acqua, sognatore, compassionevole, artistico, spirituale",
  };

  return descriptions[sign] || "Segno sconosciuto";
}

/**
 * Calcola la compatibilità tra due temi astrali
 */
export function calculateCompatibility(
  theme1: AstrologicalData,
  theme2: AstrologicalData
): {
  score: number;
  description: string;
  details: string[];
} {
  let score = 0;
  const details: string[] = [];

  // Compatibilità Sole-Sole
  const sunCompatibility = calculateSignCompatibility(
    theme1.sun.sign,
    theme2.sun.sign
  );
  score += sunCompatibility.score;
  details.push(`Sole-Sole: ${sunCompatibility.description}`);

  // Compatibilità Luna-Luna
  const moonCompatibility = calculateSignCompatibility(
    theme1.moon.sign,
    theme2.moon.sign
  );
  score += moonCompatibility.score;
  details.push(`Luna-Luna: ${moonCompatibility.description}`);

  // Compatibilità Venere-Venere
  const venusCompatibility = calculateSignCompatibility(
    theme1.venus.sign,
    theme2.venus.sign
  );
  score += venusCompatibility.score;
  details.push(`Venere-Venere: ${venusCompatibility.description}`);

  // Compatibilità Marte-Marte
  const marsCompatibility = calculateSignCompatibility(
    theme1.mars.sign,
    theme2.mars.sign
  );
  score += marsCompatibility.score;
  details.push(`Marte-Marte: ${marsCompatibility.description}`);

  // Media
  const averageScore = Math.round(score / 4);

  return {
    score: averageScore,
    description: getCompatibilityDescription(averageScore),
    details,
  };
}

/**
 * Calcola la compatibilità tra due segni zodiacali
 */
export function calculateSignCompatibility(
  sign1: string,
  sign2: string
): { score: number; description: string } {
  // Elementi
  const elements: Record<string, string> = {
    Ariete: "fuoco",
    Toro: "terra",
    Gemelli: "aria",
    Cancro: "acqua",
    Leone: "fuoco",
    Vergine: "terra",
    Bilancia: "aria",
    Scorpione: "acqua",
    Sagittario: "fuoco",
    Capricorno: "terra",
    Acquario: "aria",
    Pesci: "acqua",
  };

  const element1 = elements[sign1];
  const element2 = elements[sign2];

  if (element1 === element2) {
    return { score: 90, description: "Molto compatibili - stesso elemento" };
  }

  // Elementi compatibili
  if (
    (element1 === "fuoco" && element2 === "aria") ||
    (element1 === "aria" && element2 === "fuoco")
  ) {
    return { score: 80, description: "Compatibili - fuoco e aria" };
  }

  if (
    (element1 === "terra" && element2 === "acqua") ||
    (element1 === "acqua" && element2 === "terra")
  ) {
    return { score: 80, description: "Compatibili - terra e acqua" };
  }

  // Elementi opposti
  if (
    (element1 === "fuoco" && element2 === "acqua") ||
    (element1 === "acqua" && element2 === "fuoco")
  ) {
    return { score: 40, description: "Sfidanti - fuoco e acqua" };
  }

  if (
    (element1 === "terra" && element2 === "aria") ||
    (element1 === "aria" && element2 === "terra")
  ) {
    return { score: 40, description: "Sfidanti - terra e aria" };
  }

  return { score: 60, description: "Moderatamente compatibili" };
}

/**
 * Ottiene la descrizione della compatibilità da un punteggio
 */
export function getCompatibilityDescription(score: number): string {
  if (score >= 90) return "Compatibilità eccezionale";
  if (score >= 80) return "Molto compatibili";
  if (score >= 70) return "Buona compatibilità";
  if (score >= 60) return "Compatibilità moderata";
  if (score >= 50) return "Compatibilità media";
  if (score >= 40) return "Compatibilità bassa";
  return "Scarsa compatibilità";
}
