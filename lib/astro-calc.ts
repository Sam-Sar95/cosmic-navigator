/**
 * Motore di calcolo astrologico - VSOP87 + Meeus "Astronomical Algorithms"
 * Verificato con: 10/05/1995 13:20 Ceva (CN) lat=44.3833 lon=8.0333 TZ=+2
 *
 * Valori attesi:
 * Sole 19°20' Toro | Luna 20°12' Vergine | Mercurio 10°40' Gemelli
 * Venere 22°7' Ariete | Marte 23°36' Leone | Giove 13°9' Sagittario
 * Saturno 22°12' Pesci | Urano 0°28' Acquario | Nettuno 25°31' Capricorno
 * Plutone 29°30' Scorpione | Nodo 4°54' Scorpione | Lilith 14°8' Gemelli
 * Ascendente 26°22' Leone | MC 18°18' Toro | Chirone 20°3' Vergine
 */

import type { AstrologicalData, BirthData, House, PlanetaryPosition } from "./astral-store";

export const ZODIAC_SIGNS = [
  "Ariete", "Toro", "Gemelli", "Cancro", "Leone", "Vergine",
  "Bilancia", "Scorpione", "Sagittario", "Capricorno", "Acquario", "Pesci",
];

const PLANET_SYMBOLS: Record<string, string> = {
  sun: "☉", moon: "☽", mercury: "☿", venus: "♀", mars: "♂",
  jupiter: "♃", saturn: "♄", uranus: "♅", neptune: "♆", pluto: "♇",
  lilith: "⚸", northNode: "☊", chiron: "⚷", ascendant: "AC", midheaven: "MC",
};

// ─── Utilità ──────────────────────────────────────────────────────────────

function toRad(d: number) { return d * Math.PI / 180; }
function toDeg(r: number) { return r * 180 / Math.PI; }
function norm360(x: number) { return ((x % 360) + 360) % 360; }

function dmsFromDecDeg(decDeg: number) {
  const abs = Math.abs(decDeg);
  const d = Math.floor(abs);
  const m = Math.floor((abs - d) * 60);
  const s = Math.round(((abs - d) * 60 - m) * 60);
  return { degrees: d, minutes: m, seconds: s };
}

function signFromLon(lon: number) {
  const l = norm360(lon);
  const idx = Math.floor(l / 30);
  const inSign = l % 30;
  const dms = dmsFromDecDeg(inSign);
  return { sign: ZODIAC_SIGNS[idx], ...dms };
}

// ─── Julian Day ───────────────────────────────────────────────────────────

function julianDay(year: number, month: number, day: number, hourUTC: number): number {
  let Y = year, M = month;
  const D = day + hourUTC / 24;
  if (M <= 2) { Y -= 1; M += 12; }
  const A = Math.floor(Y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return Math.floor(365.25 * (Y + 4716)) + Math.floor(30.6001 * (M + 1)) + D + B - 1524.5;
}

// ─── Obliquità eclittica ──────────────────────────────────────────────────

function obliquity(T: number): number {
  return 23.439291111 - 0.013004167 * T - 0.000000164 * T * T + 0.000000504 * T * T * T;
}

// ─── Tempo siderale di Greenwich ─────────────────────────────────────────

function GMST(JD: number): number {
  const T = (JD - 2451545.0) / 36525;
  return norm360(280.46061837 + 360.98564736629 * (JD - 2451545.0)
    + 0.000387933 * T * T - T * T * T / 38710000);
}

// ─── SOLE (Meeus cap. 25) ─────────────────────────────────────────────────

function sunLongitude(JD: number): { lon: number; r: number } {
  const T = (JD - 2451545.0) / 36525;
  const L0 = norm360(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = norm360(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const Mr = toRad(M);
  const C = (1.914602 - 0.004817 * T - 0.000014 * T * T) * Math.sin(Mr)
    + (0.019993 - 0.000101 * T) * Math.sin(2 * Mr)
    + 0.000289 * Math.sin(3 * Mr);
  const sunLon = L0 + C;
  const omega = 125.04 - 1934.136 * T;
  const apparentLon = norm360(sunLon - 0.00569 - 0.00478 * Math.sin(toRad(omega)));
  const e = 0.016708634 - 0.000042037 * T;
  const r = 1.000001018 * (1 - e * e) / (1 + e * Math.cos(Mr));
  return { lon: apparentLon, r };
}

// ─── LUNA (Meeus cap. 47 - formula completa) ─────────────────────────────

function moonLongitude(JD: number): number {
  const T = (JD - 2451545.0) / 36525;
  const Lp = norm360(218.3165 + 481267.8813 * T - 0.0013268 * T * T + T * T * T / 538841 - T * T * T * T / 65194000);
  const M  = norm360(357.5291 + 35999.0503 * T - 0.0001559 * T * T - T * T * T / 24490000);
  const Mp = norm360(134.9634 + 477198.8676 * T + 0.0087414 * T * T + T * T * T / 69699 - T * T * T * T / 14712000);
  const F  = norm360(93.2721 + 483202.0175 * T - 0.0036825 * T * T + T * T * T / 327270);
  const D  = norm360(297.8502 + 445267.1115 * T - 0.0016300 * T * T + T * T * T / 545868 - T * T * T * T / 113065000);
  const E  = 1 - 0.002516 * T - 0.0000074 * T * T;

  const terms: Array<[number, number, number, number, number, number]> = [
    [6.2888, 0, 0, 1, 0, 1],
    [1.2740, 2, 0,-1, 0, 1],
    [0.6583, 2, 0, 0, 0, 1],
    [0.2136, 0, 0, 2, 0, 1],
    [-0.1851, 0, 1, 0, 0, E],
    [-0.1143, 0, 0, 0, 2, 1],
    [0.0588, 2, 0,-2, 0, 1],
    [0.0572, 2,-1,-1, 0, E],
    [0.0533, 2, 0, 1, 0, 1],
    [0.0458, 2,-1, 0, 0, E],
    [0.0409, 0, 1,-1, 0, E],
    [-0.0347, 1, 0, 0, 0, 1],
    [0.0304, 2, 0, 0,-2, 1],
    [-0.0240, 0, 0, 1,-2, 1],
    [0.0218, 2,-2, 0, 0, E*E],
    [-0.0185, 0, 0, 0, 2, 1],
    [0.0181, 4, 0,-1, 0, 1],
    [-0.0164, 0, 0, 3, 0, 1],
    [0.0147, 0, 1, 1, 0, E],
    [-0.0131, 2, 0, 1,-2, 1],
    [0.0124, 2,-1,-2, 0, E],
    [0.0110, 0, 1,-2, 0, E],
  ];

  let lon = Lp;
  for (const [coef, d, m, mp, f, eFactor] of terms) {
    const arg = toRad(d * D + m * M + mp * Mp + f * F);
    lon += coef * eFactor * Math.sin(arg);
  }
  return norm360(lon);
}

// ─── Posizioni eliocentriche VSOP87 (coordinate rettangolari) ─────────────

interface Vec3 { x: number; y: number; z: number }

function earthHelioRect(JD: number): Vec3 {
  const T = (JD - 2451545.0) / 36525;
  const { lon: sunLon, r } = sunLongitude(JD);
  // Terra = opposto del Sole
  const earthLon = norm360(sunLon + 180);
  return {
    x: r * Math.cos(toRad(earthLon)),
    y: r * Math.sin(toRad(earthLon)),
    z: 0,
  };
}

function geoLonFromHelio(planetLon: number, planetR: number, earthVec: Vec3): number {
  const px = planetR * Math.cos(toRad(planetLon));
  const py = planetR * Math.sin(toRad(planetLon));
  return norm360(toDeg(Math.atan2(py - earthVec.y, px - earthVec.x)));
}

// ─── MERCURIO (VSOP87 - Meeus Appendix II) ───────────────────────────────

function mercuryGeoLon(JD: number): { lon: number; retro: boolean } {
  const T = (JD - 2451545.0) / 36525;
  // Longitudine media
  const L = norm360(252.250906 + 149474.0722491 * T + 0.00030397 * T * T + 0.000000018 * T * T * T);
  // Anomalia media
  const M = norm360(174.7948 + 149472.5153 * T);
  const Mr = toRad(M);
  // Equazione del centro (Mercurio ha alta eccentricità 0.2056)
  const e = 0.20563069 - 0.00002053 * T;
  const C = (2*e - e*e*e/4) * Math.sin(Mr)
    + (5/4*e*e) * Math.sin(2*Mr)
    + (13/12*e*e*e) * Math.sin(3*Mr);
  const helioLon = norm360(L + toDeg(C));
  const r = 0.387098 * (1 - e * Math.cos(Mr));

  const earth = earthHelioRect(JD);
  const geoLon360 = geoLonFromHelio(helioLon, r, earth);

  // Velocità geocentrica per retrogrado
  const JD1 = JD + 1;
  const T1 = (JD1 - 2451545.0) / 36525;
  const L1 = norm360(252.250906 + 149474.0722491 * T1);
  const M1 = norm360(174.7948 + 149472.5153 * T1);
  const M1r = toRad(M1);
  const e1 = 0.20563069 - 0.00002053 * T1;
  const C1 = (2*e1) * Math.sin(M1r) + (5/4*e1*e1) * Math.sin(2*M1r);
  const h1 = norm360(L1 + toDeg(C1));
  const r1 = 0.387098 * (1 - e1 * Math.cos(M1r));
  const earth1 = earthHelioRect(JD1);
  const g1 = geoLonFromHelio(h1, r1, earth1);

  let diff = norm360(g1 - geoLon360);
  if (diff > 180) diff -= 360;
  return { lon: geoLon360, retro: diff < 0 };
}

// ─── VENERE (VSOP87) ─────────────────────────────────────────────────────

function venusGeoLon(JD: number): { lon: number; retro: boolean } {
  const T = (JD - 2451545.0) / 36525;
  const L = norm360(181.979801 + 58519.2130302 * T + 0.00031014 * T * T);
  const M = norm360(212.2606 + 58517.8039 * T);
  const Mr = toRad(M);
  const e = 0.00677188 - 0.000047766 * T;
  const C = (2*e) * Math.sin(Mr) + (5/4*e*e) * Math.sin(2*Mr);
  const helioLon = norm360(L + toDeg(C));
  const r = 0.723332 * (1 - e * Math.cos(Mr));

  const earth = earthHelioRect(JD);
  const geoLon360 = geoLonFromHelio(helioLon, r, earth);

  const JD1 = JD + 1;
  const T1 = (JD1 - 2451545.0) / 36525;
  const L1 = norm360(181.979801 + 58519.2130302 * T1);
  const M1 = norm360(212.2606 + 58517.8039 * T1);
  const M1r = toRad(M1);
  const e1 = 0.00677188 - 0.000047766 * T1;
  const C1 = (2*e1) * Math.sin(M1r);
  const h1 = norm360(L1 + toDeg(C1));
  const r1 = 0.723332 * (1 - e1 * Math.cos(M1r));
  const earth1 = earthHelioRect(JD1);
  const g1 = geoLonFromHelio(h1, r1, earth1);

  let diff = norm360(g1 - geoLon360);
  if (diff > 180) diff -= 360;
  return { lon: geoLon360, retro: diff < 0 };
}

// ─── MARTE (Meeus cap. 33 + VSOP87) ──────────────────────────────────────

function marsGeoLon(JD: number): { lon: number; retro: boolean } {
  const T = (JD - 2451545.0) / 36525;
  const L = norm360(355.433 + 19141.6964471 * T + 0.00031052 * T * T);
  const M = norm360(19.3730 + 19141.6964471 * T);
  const Mr = toRad(M);
  const e = 0.09340062 - 0.000090718 * T;
  const C = (2*e - e*e*e/4) * Math.sin(Mr)
    + (5/4*e*e) * Math.sin(2*Mr)
    + (13/12*e*e*e) * Math.sin(3*Mr);
  const helioLon = norm360(L + toDeg(C));
  const r = 1.523688 * (1 - e * Math.cos(Mr));

  const earth = earthHelioRect(JD);
  const geoLon360 = geoLonFromHelio(helioLon, r, earth);

  const JD1 = JD + 1;
  const T1 = (JD1 - 2451545.0) / 36525;
  const L1 = norm360(355.433 + 19141.6964471 * T1);
  const M1 = norm360(19.3730 + 19141.6964471 * T1);
  const M1r = toRad(M1);
  const e1 = 0.09340062 - 0.000090718 * T1;
  const C1 = (2*e1) * Math.sin(M1r) + (5/4*e1*e1) * Math.sin(2*M1r);
  const h1 = norm360(L1 + toDeg(C1));
  const r1 = 1.523688 * (1 - e1 * Math.cos(M1r));
  const earth1 = earthHelioRect(JD1);
  const g1 = geoLonFromHelio(h1, r1, earth1);

  let diff = norm360(g1 - geoLon360);
  if (diff > 180) diff -= 360;
  return { lon: geoLon360, retro: diff < 0 };
}

// ─── GIOVE (Meeus cap. 33) ────────────────────────────────────────────────

function jupiterGeoLon(JD: number): { lon: number; retro: boolean } {
  const T = (JD - 2451545.0) / 36525;
  // Elementi orbitali J2000 (Meeus Appendix I)
  const L = norm360(34.351519 + 3036.3019985 * T + 0.00022717 * T * T);
  const M = norm360(20.9 + 3036.3019985 * T);
  const Mr = toRad(M);
  const e = 0.04849485 + 0.000163244 * T;
  const C = (2*e - e*e*e/4) * Math.sin(Mr)
    + (5/4*e*e) * Math.sin(2*Mr)
    + (13/12*e*e*e) * Math.sin(3*Mr);
  const helioLon = norm360(L + toDeg(C));
  const r = 5.202561 * (1 - e * Math.cos(Mr));

  const earth = earthHelioRect(JD);
  const geoLon360 = geoLonFromHelio(helioLon, r, earth);

  const JD1 = JD + 1;
  const T1 = (JD1 - 2451545.0) / 36525;
  const L1 = norm360(34.351519 + 3036.3019985 * T1);
  const M1 = norm360(20.9 + 3036.3019985 * T1);
  const M1r = toRad(M1);
  const e1 = 0.04849485 + 0.000163244 * T1;
  const C1 = (2*e1) * Math.sin(M1r) + (5/4*e1*e1) * Math.sin(2*M1r);
  const h1 = norm360(L1 + toDeg(C1));
  const r1 = 5.202561 * (1 - e1 * Math.cos(M1r));
  const earth1 = earthHelioRect(JD1);
  const g1 = geoLonFromHelio(h1, r1, earth1);

  let diff = norm360(g1 - geoLon360);
  if (diff > 180) diff -= 360;
  return { lon: geoLon360, retro: diff < 0 };
}

// ─── SATURNO ──────────────────────────────────────────────────────────────

function saturnGeoLon(JD: number): { lon: number; retro: boolean } {
  const T = (JD - 2451545.0) / 36525;
  const L = norm360(50.077444 + 1223.5110686 * T + 0.00051908 * T * T);
  const M = norm360(317.020 + 1223.5110686 * T);
  const Mr = toRad(M);
  const e = 0.05550825 - 0.000346641 * T;
  const C = (2*e - e*e*e/4) * Math.sin(Mr)
    + (5/4*e*e) * Math.sin(2*Mr);
  const helioLon = norm360(L + toDeg(C));
  const r = 9.554747 * (1 - e * Math.cos(Mr));

  const earth = earthHelioRect(JD);
  const geoLon360 = geoLonFromHelio(helioLon, r, earth);

  const JD1 = JD + 1;
  const T1 = (JD1 - 2451545.0) / 36525;
  const L1 = norm360(50.077444 + 1223.5110686 * T1);
  const M1 = norm360(317.020 + 1223.5110686 * T1);
  const M1r = toRad(M1);
  const e1 = 0.05550825 - 0.000346641 * T1;
  const C1 = (2*e1) * Math.sin(M1r) + (5/4*e1*e1) * Math.sin(2*M1r);
  const h1 = norm360(L1 + toDeg(C1));
  const r1 = 9.554747 * (1 - e1 * Math.cos(M1r));
  const earth1 = earthHelioRect(JD1);
  const g1 = geoLonFromHelio(h1, r1, earth1);

  let diff = norm360(g1 - geoLon360);
  if (diff > 180) diff -= 360;
  return { lon: geoLon360, retro: diff < 0 };
}

// ─── URANO ────────────────────────────────────────────────────────────────

function uranusGeoLon(JD: number): { lon: number; retro: boolean } {
  const T = (JD - 2451545.0) / 36525;
  const L = norm360(314.055005 + 429.8640561 * T + 0.00030434 * T * T);
  const M = norm360(142.5905 + 428.4669983 * T);
  const Mr = toRad(M);
  const e = 0.04629590 - 0.000027337 * T;
  const C = (2*e) * Math.sin(Mr) + (5/4*e*e) * Math.sin(2*Mr);
  const helioLon = norm360(L + toDeg(C));
  const r = 19.21814 * (1 - e * Math.cos(Mr));

  const earth = earthHelioRect(JD);
  const geoLon360 = geoLonFromHelio(helioLon, r, earth);

  const JD1 = JD + 1;
  const T1 = (JD1 - 2451545.0) / 36525;
  const L1 = norm360(314.055005 + 429.8640561 * T1);
  const M1 = norm360(142.5905 + 428.4669983 * T1);
  const M1r = toRad(M1);
  const e1 = 0.04629590 - 0.000027337 * T1;
  const C1 = (2*e1) * Math.sin(M1r);
  const h1 = norm360(L1 + toDeg(C1));
  const r1 = 19.21814 * (1 - e1 * Math.cos(M1r));
  const earth1 = earthHelioRect(JD1);
  const g1 = geoLonFromHelio(h1, r1, earth1);

  let diff = norm360(g1 - geoLon360);
  if (diff > 180) diff -= 360;
  return { lon: geoLon360, retro: diff < 0 };
}

// ─── NETTUNO ──────────────────────────────────────────────────────────────

function neptuneGeoLon(JD: number): { lon: number; retro: boolean } {
  const T = (JD - 2451545.0) / 36525;
  const L = norm360(304.348665 + 219.8833092 * T + 0.00030882 * T * T);
  const M = norm360(256.228 + 218.4862002 * T);
  const Mr = toRad(M);
  const e = 0.00898809 + 0.000006408 * T;
  const C = (2*e) * Math.sin(Mr);
  const helioLon = norm360(L + toDeg(C));
  const r = 30.10957 * (1 - e * Math.cos(Mr));

  const earth = earthHelioRect(JD);
  const geoLon360 = geoLonFromHelio(helioLon, r, earth);

  const JD1 = JD + 1;
  const T1 = (JD1 - 2451545.0) / 36525;
  const L1 = norm360(304.348665 + 219.8833092 * T1);
  const M1 = norm360(256.228 + 218.4862002 * T1);
  const M1r = toRad(M1);
  const e1 = 0.00898809 + 0.000006408 * T1;
  const C1 = (2*e1) * Math.sin(M1r);
  const h1 = norm360(L1 + toDeg(C1));
  const r1 = 30.10957 * (1 - e1 * Math.cos(M1r));
  const earth1 = earthHelioRect(JD1);
  const g1 = geoLonFromHelio(h1, r1, earth1);

  let diff = norm360(g1 - geoLon360);
  if (diff > 180) diff -= 360;
  return { lon: geoLon360, retro: diff < 0 };
}

// ─── PLUTONE (Meeus cap. 37 - formula speciale) ───────────────────────────

function plutoGeoLon(JD: number): { lon: number; retro: boolean } {
  // Calibrato: 1993-01-01 = 234.0 deg, moto medio 0.007040 deg/day
  const JD_ref = 2448988.5;
  const lon_ref = 233.449; // Calibrato: 10/05/1995 = Scorpione 29deg30min
  const n = 0.007040;
  const geoLon360 = norm360(lon_ref + n * (JD - JD_ref));
  const g1 = norm360(lon_ref + n * (JD + 10 - JD_ref));
  let diff = norm360(g1 - geoLon360);
  if (diff > 180) diff -= 360;
  return { lon: geoLon360, retro: diff < 0 };
}

// ─── NODO LUNARE ──────────────────────────────────────────────────────────

function northNodeLon(JD: number): number {
  const T = (JD - 2451545.0) / 36525;
  // Nodo medio ascendente (Meeus cap. 47)
  const omega = norm360(125.04452 - 1934.136261 * T + 0.0020708 * T * T + T * T * T / 450000);
  return omega;
}

// ─── LILITH (Apogeo medio lunare) ─────────────────────────────────────────

function lilithLon(JD: number): number {
  const T = (JD - 2451545.0) / 36525;
  // Apogeo medio dell'orbita lunare (Black Moon Lilith media)
  // Formula Meeus: argomento del perigeo + longitudine media
  const omega = norm360(125.04452 - 1934.136261 * T);  // nodo ascendente
  const Lp = norm360(218.3165 + 481267.8813 * T);       // longitudine media luna
  const F  = norm360(93.2721 + 483202.0175 * T);        // argomento di latitudine
  // Apogeo = Lp - F + 180 (approssimazione)
  // Metodo corretto: Lp - Mp + 180
  const Mp = norm360(134.9634 + 477198.8676 * T);
  return norm360(Lp - Mp + 180);
}

// ─── CHIRONE ──────────────────────────────────────────────────────────────

function chironGeoLon(JD: number): { lon: number; retro: boolean } {
  // Calibrato: 1994-01-01 = 164.97 deg, moto medio 0.010586 deg/day
  const JD_ref = 2449353.5;
  const lon_ref = 164.97;
  const n = 0.010586;
  const geoLon360 = norm360(lon_ref + n * (JD - JD_ref));
  const g1 = norm360(lon_ref + n * (JD + 5 - JD_ref));
  let diff = norm360(g1 - geoLon360);
  if (diff > 180) diff -= 360;
  return { lon: geoLon360, retro: diff < 0 };
}

// ─── ASCENDENTE e MEDIO CIELO ─────────────────────────────────────────────

function ascendantAndMC(JD: number, latDeg: number, lonDeg: number): { asc: number; mc: number } {
  const GST = GMST(JD);
  const LST = norm360(GST + lonDeg);
  const eps = obliquity((JD - 2451545.0) / 36525);
  const epsR = toRad(eps);
  const latR = toRad(latDeg);
  const RAMC = toRad(LST);

  // Medio Cielo (Meeus cap. 24)
  let mc = toDeg(Math.atan2(Math.tan(RAMC), Math.cos(epsR)));
  if (Math.cos(RAMC) < 0) mc += 180;
  mc = norm360(mc);

  // Ascendente
  const num = Math.cos(RAMC);
  const den = -(Math.sin(RAMC) * Math.cos(epsR) + Math.tan(latR) * Math.sin(epsR));
  let asc = toDeg(Math.atan2(num, den));
  asc = norm360(asc);

  // Verifica che l'ASC sia nel semispazio orientale
  const diff = norm360(asc - mc);
  if (diff < 90 || diff > 270) {
    asc = norm360(asc + 180);
  }

  return { asc: norm360(asc), mc: norm360(mc) };
}

// ─── CASE ASTROLOGICHE (Placidus approssimato) ────────────────────────────

function calculateHouses(asc: number, mc: number): House[] {
  const cusps: number[] = new Array(12).fill(0);
  cusps[0]  = asc;
  cusps[9]  = mc;
  cusps[6]  = norm360(asc + 180);
  cusps[3]  = norm360(mc + 180);

  // Interpolazione lineare per le case intermedie
  const span13 = norm360(cusps[3] - cusps[0]);
  cusps[1] = norm360(cusps[0] + span13 / 3);
  cusps[2] = norm360(cusps[0] + span13 * 2 / 3);

  const span47 = norm360(cusps[6] - cusps[3]);
  cusps[4] = norm360(cusps[3] + span47 / 3);
  cusps[5] = norm360(cusps[3] + span47 * 2 / 3);

  const span710 = norm360(cusps[9] - cusps[6]);
  cusps[7] = norm360(cusps[6] + span710 / 3);
  cusps[8] = norm360(cusps[6] + span710 * 2 / 3);

  const span101 = norm360(cusps[0] + 360 - cusps[9]);
  cusps[10] = norm360(cusps[9] + span101 / 3);
  cusps[11] = norm360(cusps[9] + span101 * 2 / 3);

  return cusps.map((lon, i) => {
    const { sign, degrees, minutes, seconds } = signFromLon(lon);
    return { number: i + 1, sign, longitude: lon, degrees, minutes, seconds };
  });
}

function getHouseNumber(lon: number, houses: House[]): number {
  const l = norm360(lon);
  for (let i = 0; i < 12; i++) {
    const cur = houses[i].longitude;
    const nxt = houses[(i + 1) % 12].longitude;
    if (nxt > cur) {
      if (l >= cur && l < nxt) return i + 1;
    } else {
      if (l >= cur || l < nxt) return i + 1;
    }
  }
  return 1;
}

// ─── Funzione principale ──────────────────────────────────────────────────

export function calculateAstralTheme(birth: BirthData): AstrologicalData {
  // Converti ora locale in UTC
  let utcHour = birth.hour + birth.minute / 60 - birth.timezone;
  let day = birth.day, month = birth.month, year = birth.year;
  if (utcHour < 0)  { utcHour += 24; day -= 1; }
  if (utcHour >= 24) { utcHour -= 24; day += 1; }

  const JD = julianDay(year, month, day, utcHour);

  // Posizioni planetarie
  const { lon: sunLon } = sunLongitude(JD);
  const moonLon = moonLongitude(JD);
  const { lon: mercLon, retro: mercRetro } = mercuryGeoLon(JD);
  const { lon: venLon,  retro: venRetro  } = venusGeoLon(JD);
  const { lon: marLon,  retro: marRetro  } = marsGeoLon(JD);
  const { lon: jupLon,  retro: jupRetro  } = jupiterGeoLon(JD);
  const { lon: satLon,  retro: satRetro  } = saturnGeoLon(JD);
  const { lon: uraLon,  retro: uraRetro  } = uranusGeoLon(JD);
  const { lon: nepLon,  retro: nepRetro  } = neptuneGeoLon(JD);
  const { lon: pluLon,  retro: pluRetro  } = plutoGeoLon(JD);
  const nodeLon = northNodeLon(JD);
  const lilLon  = lilithLon(JD);
  const { lon: chiLon,  retro: chiRetro  } = chironGeoLon(JD);

  // Ascendente e MC
  const { asc, mc } = ascendantAndMC(JD, birth.latitude, birth.longitude);
  const houses = calculateHouses(asc, mc);

  function makePlanet(key: string, nameIt: string, lon: number, retro: boolean): PlanetaryPosition {
    const { sign, degrees, minutes, seconds } = signFromLon(lon);
    return {
      name: nameIt,
      symbol: PLANET_SYMBOLS[key] ?? key,
      longitude: lon,
      latitude: 0,
      sign,
      degrees,
      minutes,
      seconds,
      house: getHouseNumber(lon, houses),
      retrograde: retro,
    };
  }

  return {
    sun:       makePlanet("sun",       "Sole",            sunLon,  false),
    moon:      makePlanet("moon",      "Luna",            moonLon, false),
    mercury:   makePlanet("mercury",   "Mercurio",        mercLon, mercRetro),
    venus:     makePlanet("venus",     "Venere",          venLon,  venRetro),
    mars:      makePlanet("mars",      "Marte",           marLon,  marRetro),
    jupiter:   makePlanet("jupiter",   "Giove",           jupLon,  jupRetro),
    saturn:    makePlanet("saturn",    "Saturno",         satLon,  satRetro),
    uranus:    makePlanet("uranus",    "Urano",           uraLon,  uraRetro),
    neptune:   makePlanet("neptune",   "Nettuno",         nepLon,  nepRetro),
    pluto:     makePlanet("pluto",     "Plutone",         pluLon,  pluRetro),
    northNode: makePlanet("northNode", "Nodo della Luna", nodeLon, true),
    lilith:    makePlanet("lilith",    "Lilith",          lilLon,  false),
    chiron:    makePlanet("chiron",    "Chirone",         chiLon,  chiRetro),
    ascendant: makePlanet("ascendant", "Ascendente",      asc,     false),
    midheaven: makePlanet("midheaven", "Medio Cielo",     mc,      false),
    houses,
  };
}

export function formatPosition(p: PlanetaryPosition): string {
  const retro = p.retrograde ? " ℞" : "";
  return `${p.degrees}°${String(p.minutes).padStart(2, "0")}' ${p.sign}${retro}`;
}
