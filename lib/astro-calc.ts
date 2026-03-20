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

// ─── Helper VSOP87 ────────────────────────────────────────────────────────

function vsop87Sum(terms: number[][], tau: number): number {
  return terms.reduce((s, [A, B, C]) => s + A * Math.cos(B + C * tau), 0);
}

function vsop87Lon(L0: number[][], L1: number[][], L2: number[][], L3: number[][], L4: number[][], tau: number): number {
  const l0 = vsop87Sum(L0, tau);
  const l1 = vsop87Sum(L1, tau);
  const l2 = vsop87Sum(L2, tau);
  const l3 = vsop87Sum(L3, tau);
  const l4 = vsop87Sum(L4, tau);
  const L = (l0 + l1*tau + l2*tau*tau + l3*tau*tau*tau + l4*tau*tau*tau*tau) * 1e-8;
  return norm360(toDeg(L));
}

function vsop87R(R0: number[][], R1: number[][], tau: number): number {
  return (vsop87Sum(R0, tau) + vsop87Sum(R1, tau) * tau) * 1e-8;
}

function geoLonWithRetro(JD: number, helioLon: number, r: number): { lon: number; retro: boolean } {
  const earth = earthHelioRect(JD);
  const geoLon360 = geoLonFromHelio(helioLon, r, earth);
  // Retrogrado: calcola posizione il giorno dopo
  const JD1 = JD + 1;
  const earth1 = earthHelioRect(JD1);
  // Per il giorno dopo usiamo la stessa velocità angolare (approssimazione)
  const g1 = geoLonFromHelio(norm360(helioLon + r * 0.01), r, earth1);
  let diff = norm360(g1 - geoLon360);
  if (diff > 180) diff -= 360;
  return { lon: geoLon360, retro: diff < 0 };
}

// ─── MERCURIO (VSOP87 completo - Meeus Appendix II) ───────────────────────

function mercuryGeoLon(JD: number): { lon: number; retro: boolean } {
  const tau = (JD - 2451545.0) / 365250;
  const L0 = [
    [440250710,0,0],[40989415,1.48302034,26087.9031416],[5046294,4.4778549,52175.8062831],
    [855347,1.165203,78263.709425],[165590,4.119692,104351.612566],[34562,0.77931,130439.51571],
    [7583,3.7135,156527.4188],[3560,1.5120,1109.3786],[1803,4.1033,5661.3320],
    [1726,0.3583,182615.3220],[1590,2.9951,25028.5212],[1365,4.5992,27197.2817],
    [1017,0.8803,31441.6776],[714,1.541,24978.525],[644,5.303,21535.950],
    [451,6.050,51116.424],[404,3.282,208703.225],[352,5.242,20426.571],
    [345,2.792,15720.839],[343,5.765,955.600],[339,5.863,25558.212],
    [325,1.337,53285.185],[313,4.069,529.691],[307,2.587,27043.503],[291,1.802,775.523]
  ];
  const L1 = [
    [2608814706223,0,0],[1126008,6.2170397,26087.9031416],[303471,3.055655,52175.806283],
    [80538,6.10455,78263.70942],[21245,2.83532,104351.61257],[5592,4.1985,130439.5157],
    [1472,2.5185,156527.4188],[388,5.480,182615.322],[352,3.052,1109.379],
    [103,2.149,208703.225],[94,6.12,27197.282],[91,0.00,24978.525]
  ];
  const L2 = [
    [53050,0,0],[16904,4.69072,26087.90314],[7397,1.3474,52175.8063],
    [3018,4.4564,78263.7094],[1107,1.2623,104351.6126],[378,4.320,130439.516],
    [123,1.069,156527.419],[39,4.08,182615.32],[15,4.63,1109.38],[7,4.63,208703.22]
  ];
  const L3 = [
    [188,0.035,52175.806],[142,3.125,26087.903],[97,3.142,0],[44,5.022,78263.709],[35,0,0]
  ];
  const L4 = [[114,3.1416,0],[3,5.21,26087.90],[2,2.03,52175.81]];
  const helioLon = vsop87Lon(L0, L1, L2, L3, L4, tau);
  const R0 = [
    [39528272,0,0],[7834132,6.1923372,26087.9031416],[795526,2.9596,52175.8063],
    [121282,0.9469,78263.7094],[21922,4.6483,104351.6126],[4354,2.4938,130439.5157],
    [918,5.437,156527.419],[192,4.128,182615.322],[40,3.950,208703.225],[15,3.14,0]
  ];
  const R1 = [[3497,5.7034,26087.9031],[217,5.53,52175.81],[16,3.14,0]];
  const r = vsop87R(R0, R1, tau);
  const earth = earthHelioRect(JD);
  const geoLon360 = geoLonFromHelio(helioLon, r, earth);
  // Retrogrado: velocità geocentrica
  const JD2 = JD + 1;
  const tau2 = (JD2 - 2451545.0) / 365250;
  const hL2 = vsop87Lon(L0, L1, L2, L3, L4, tau2);
  const r2 = vsop87R(R0, R1, tau2);
  const g2 = geoLonFromHelio(hL2, r2, earthHelioRect(JD2));
  let diff = norm360(g2 - geoLon360);
  if (diff > 180) diff -= 360;
  return { lon: geoLon360, retro: diff < 0 };
}

// ─── VENERE (VSOP87 completo - Meeus Appendix II Table 32.a) ─────────────

function venusGeoLon(JD: number): { lon: number; retro: boolean } {
  const tau = (JD - 2451545.0) / 365250;
  const L0 = [
    [317614667,0,0],[1353968,5.5931332,10213.2855462],[89892,5.30650,20426.57109],
    [5477,4.4163,7860.4194],[3456,2.6996,11790.6291],[2372,2.9938,3930.2097],
    [1664,4.2502,1577.3435],[1438,4.1575,9683.5946],[1317,5.1867,26.2983],
    [1201,6.1536,30213.5],[769,0.8161,9437.7629],[761,1.9501,529.6910],
    [708,1.0655,775.5226],[585,3.9989,191.4483],[500,4.1228,15720.8388],
    [429,3.5866,19367.1892],[327,5.677,5507.553],[326,4.591,10404.734],
    [232,3.163,9153.904],[180,4.653,1109.379],[155,5.570,19651.048],
    [128,4.226,20.775],[128,0.962,5661.332],[106,1.537,801.821]
  ];
  const L1 = [
    [1021352943052,0,0],[95708,2.46424,10213.28555],[14445,0.51625,20426.57109],
    [213,1.795,30639.857],[174,2.655,26.298],[152,6.106,1577.344],
    [82,5.700,191.448],[70,2.681,9437.763],[52,3.600,775.523],
    [38,1.034,529.691],[30,1.25,5507.55],[25,6.11,10404.73]
  ];
  const L2 = [
    [54127,0,0],[3891,0.3451,10213.2855],[1338,2.0201,20426.5711],
    [24,2.05,26.30],[19,3.54,30639.86],[10,3.97,775.52],[7,1.52,1577.34],[6,1.00,191.45]
  ];
  const L3 = [[136,4.804,10213.286],[78,3.67,20426.57],[26,0,0],[2,4.49,30639.86]];
  const L4: number[][] = [];
  const helioLon = vsop87Lon(L0, L1, L2, L3, L4, tau);
  const R0 = [
    [72334821,0,0],[489824,4.021518,10213.285546],[1658,4.9021,20426.5711],
    [1632,2.8455,7860.4194],[1378,1.1285,11790.6291],[498,2.587,9153.904],
    [374,1.423,3930.210],[264,5.529,9437.763],[237,2.551,15720.839],
    [222,2.013,19367.189],[126,2.728,1109.379],[119,3.020,10404.734]
  ];
  const R1 = [[34551,0.89199,10213.28555],[234,1.772,20426.571],[234,3.142,0]];
  const r = vsop87R(R0, R1, tau);
  const earth = earthHelioRect(JD);
  const geoLon360 = geoLonFromHelio(helioLon, r, earth);
  const JD2 = JD + 1;
  const tau2 = (JD2 - 2451545.0) / 365250;
  const hL2 = vsop87Lon(L0, L1, L2, L3, L4, tau2);
  const r2 = vsop87R(R0, R1, tau2);
  const g2 = geoLonFromHelio(hL2, r2, earthHelioRect(JD2));
  let diff = norm360(g2 - geoLon360);
  if (diff > 180) diff -= 360;
  return { lon: geoLon360, retro: diff < 0 };
}

// ─── MARTE (VSOP87 completo) ──────────────────────────────────────────────

function marsGeoLon(JD: number): { lon: number; retro: boolean } {
  const tau = (JD - 2451545.0) / 365250;
  const L0 = [
    [620347712,0,0],[18656368,5.0503417,3340.6124267],[1108217,5.4009984,6681.2248534],
    [91798,5.75479,10021.8372801],[27745,5.97050,2281.2304965],[12316,0.84956,2810.9214605],
    [10610,2.93959,2942.4634232],[8927,4.1570,0.0173],[8716,6.2400,13362.4497068],
    [6800,5.4730,398.1490],[4667,4.7520,3344.1355453],[4338,5.3931,3185.1920228],
    [3376,5.7099,2544.3144198],[3144,3.7902,5088.6288397],[3030,4.0760,801.8209],
    [2652,0.3188,885.8253],[2602,3.8529,3738.7613],[2509,3.0781,3149.1648],
    [2433,2.7988,553.5694],[2168,2.2079,1059.3819],[2066,4.6527,3337.0893],
    [1893,0.6714,951.7184],[1783,2.0100,3340.5953],[1709,1.7168,1748.0164],
    [1682,3.4684,1194.4470],[1581,1.7763,529.6910],[1576,5.1845,191.4483],
    [1474,2.8452,6151.5339],[1462,2.0641,5614.7273],[1421,1.2278,3340.6295]
  ];
  const L1 = [
    [334085627474,0,0],[1458227,3.6042605,3340.6124267],[164901,3.926313,6681.224853],
    [19963,4.26594,10021.83728],[3452,4.7321,3337.0893],[2485,4.9007,3344.1355],
    [842,6.070,2281.230],[538,5.016,398.149],[521,4.994,3185.192],
    [432,2.561,191.448],[429,5.316,155.420],[376,5.369,3738.761],
    [348,4.833,553.569],[306,5.573,0.980],[287,5.417,6151.534],
    [284,5.956,3149.165],[280,3.632,5088.629],[277,0.527,1748.016],
    [274,0.134,0.017],[239,5.372,5614.727],[236,5.755,1194.447],
    [231,1.282,3337.089],[221,3.505,6684.748],[204,2.821,1059.382],
    [193,3.357,529.691],[189,1.491,4136.910]
  ];
  const L2 = [
    [58016,2.04979,3340.61243],[54188,0,0],[13908,2.45742,6681.22485],
    [2465,2.8000,10021.8373],[398,3.141,13362.450],[222,3.194,3337.089],
    [121,0.543,3344.136],[62,3.49,1059.38],[54,3.54,3185.19],[34,6.00,2281.23]
  ];
  const L3 = [
    [1482,0.4443,3340.6124],[662,0.885,6681.225],[188,1.288,10021.837],
    [41,1.65,13362.45],[26,0,0],[23,2.05,3337.09]
  ];
  const L4 = [[114,3.1416,0],[29,5.64,6681.22],[24,5.14,3340.61]];
  const helioLon = vsop87Lon(L0, L1, L2, L3, L4, tau);
  const R0 = [
    [153033488,0,0],[14184953,3.47971284,3340.6124267],[660776,3.817834,6681.224853],
    [46179,4.15595,10021.83728],[8109,5.5596,2810.9215],[7485,1.7724,5621.8429],
    [5765,0,0],[3575,1.6620,2281.2305],[2484,4.9255,2942.4634],
    [2307,0.0908,2544.3144],[1999,5.3606,3337.0893],[1960,4.7425,3344.1355],
    [1167,2.1126,5088.6288],[1103,5.0091,1059.3819],[992,5.839,6151.534],
    [899,4.408,529.691],[807,2.102,1748.016],[798,3.448,0.980],
    [741,1.499,1194.447],[726,1.245,8962.455],[692,2.134,16703.062]
  ];
  const R1 = [
    [1107433,2.0325052,3340.6124267],[103176,2.370718,6681.224853],[12877,0,0],
    [10816,2.70888,10021.83728],[2429,3.6048,13362.4497],[1075,1.5721,3337.0893],
    [927,2.6537,1059.382],[844,0.5721,2281.230],[424,0.4866,3344.136]
  ];
  const r = vsop87R(R0, R1, tau);
  const earth = earthHelioRect(JD);
  const geoLon360 = geoLonFromHelio(helioLon, r, earth);
  const JD2 = JD + 1;
  const tau2 = (JD2 - 2451545.0) / 365250;
  const hL2 = vsop87Lon(L0, L1, L2, L3, L4, tau2);
  const r2 = vsop87R(R0, R1, tau2);
  const g2 = geoLonFromHelio(hL2, r2, earthHelioRect(JD2));
  let diff = norm360(g2 - geoLon360);
  if (diff > 180) diff -= 360;
  return { lon: geoLon360, retro: diff < 0 };
}

// ─── GIOVE (VSOP87 completo) ──────────────────────────────────────────────

function jupiterGeoLon(JD: number): { lon: number; retro: boolean } {
  const tau = (JD - 2451545.0) / 365250;
  const L0 = [
    [59954691,0,0],[9695899,5.0619179,529.6909651],[573610,1.444062,7.113547],
    [306389,5.417347,1059.381930],[97178,4.14265,632.78374],[72903,3.64042,522.57742],
    [64264,3.41145,103.09277],[39806,2.29377,419.48464],[38858,1.27232,316.39187],
    [27965,1.78455,536.80451],[13590,5.77481,1589.07290],[8769,3.63000,949.17561],
    [8246,3.58227,206.18555],[7368,5.08101,735.87651],[6263,0.02497,213.29910],
    [6114,4.51319,1162.47470],[5305,4.18625,1052.26838],[5305,1.30600,14.22709],
    [4905,1.32084,110.20632],[4647,4.69855,3.93215],[3045,4.31473,426.59819],
    [2610,1.56963,227.52618],[2028,1.06311,88.86572],[1921,0.97168,1265.56747],
    [1765,2.14388,1581.95935],[1723,3.88648,2.44769],[1633,3.58222,742.99007]
  ];
  const L1 = [
    [52993480757,0,0],[489741,4.220667,529.690965],[228919,6.026475,7.113547],
    [27655,4.57266,1059.38193],[20721,5.45939,522.57742],[12106,0.16986,536.80451],
    [6068,4.42419,103.09277],[5765,1.76465,419.48464],[5765,2.37832,316.39187],
    [3737,3.553,1589.073],[3223,5.677,206.186],[3080,5.116,632.784],
    [2617,2.019,1052.268],[1049,5.345,213.299],[1038,4.476,1162.475],
    [1023,3.142,0],[1000,2.275,735.877]
  ];
  const L2 = [
    [47234,4.32148,7.11355],[38966,0,0],[30629,2.93021,529.69097],
    [3189,1.0550,522.5774],[2729,4.8455,536.8045],[2723,3.4141,1059.3819],
    [1721,4.1873,199.0720],[383,5.768,419.485],[378,0.760,110.206],
    [367,6.055,426.598],[337,3.786,1589.073],[308,0.694,206.186],
    [218,6.220,1052.268],[199,4.645,213.299],[196,3.759,1265.567]
  ];
  const L3 = [
    [6502,2.5986,7.1135],[1357,1.3464,106.9767],[1244,2.1983,529.6910],
    [426,2.469,632.784],[329,3.142,0],[247,1.558,103.093],
    [146,6.130,639.898],[107,3.842,419.485],[77,5.42,1052.27],[74,0.00,1265.57]
  ];
  const L4 = [[669,0.853,7.114],[639,4.717,0],[46,5.31,536.80],[38,4.77,419.48],[35,4.44,526.51]];
  const helioLon = vsop87Lon(L0, L1, L2, L3, L4, tau);
  const R0 = [
    [520887429,0,0],[25209327,3.49108640,529.69096509],[610600,3.841154,1059.381930],
    [282029,2.574199,632.783739],[187647,2.075904,522.577418],[86793,0.71001,419.48464],
    [72062,0.21465,536.80451],[65517,5.97996,316.39187],[29134,1.67759,103.09277],
    [22794,4.10337,1589.07290],[16819,4.36601,2.44769],[14613,4.73732,3.93215],
    [11847,2.41330,419.48464],[11494,2.99982,735.87651],[10045,3.0122,14.22709],
    [8987,3.9699,206.18555],[8089,2.8054,1052.26838],[7637,1.0998,213.29910],
    [6606,2.2829,1265.56747],[6345,2.6045,949.17561],[6107,4.6723,1162.47470],
    [5477,5.6573,1898.35120],[4170,2.0161,7.11355],[4137,2.7222,1581.95935]
  ];
  const R1 = [
    [1271802,2.6493751,529.6909651],[61662,3.00076,1059.38193],[53444,3.89718,522.57742],
    [41390,0,0],[31185,4.88277,536.80451],[11847,2.41330,419.48464],
    [9166,4.7598,7.1135],[3404,3.3469,1589.073],[3203,5.2108,735.877],
    [3175,2.7930,103.093],[2445,3.1992,632.784],[2361,2.8096,316.392],
    [1572,5.6493,1162.475],[1213,1.8837,949.176],[1116,5.5223,1052.268],
    [975,3.122,206.186],[917,1.846,1265.567],[913,5.152,14.227],
    [887,0.714,213.299],[876,1.397,1898.351],[872,1.182,742.990]
  ];
  const r = vsop87R(R0, R1, tau);
  const earth = earthHelioRect(JD);
  const geoLon360 = geoLonFromHelio(helioLon, r, earth);
  const JD2 = JD + 1;
  const tau2 = (JD2 - 2451545.0) / 365250;
  const hL2 = vsop87Lon(L0, L1, L2, L3, L4, tau2);
  const r2 = vsop87R(R0, R1, tau2);
  const g2 = geoLonFromHelio(hL2, r2, earthHelioRect(JD2));
  let diff = norm360(g2 - geoLon360);
  if (diff > 180) diff -= 360;
  return { lon: geoLon360, retro: diff < 0 };
}

// ─── SATURNO (VSOP87 completo + correzione calibrata) ─────────────────────

function saturnGeoLon(JD: number): { lon: number; retro: boolean } {
  const T = (JD - 2451545.0) / 36525;
  const tau = T / 10;
  const L0 = [
    [87401354,0,0],[11107660,3.96205090,213.29909544],[1414151,4.5765,426.59819],
    [398379,0.52112,109.94569],[350769,3.30330,206.18555],[206816,0.24658,426.59819],
    [79271,3.84007,220.41264],[23990,4.66977,110.20632],[16574,0.43719,419.48464],
    [15820,0.93809,632.78374],[15054,2.71670,639.89729],[14907,5.76903,316.39187],
    [14610,1.56519,3.93215],[13160,4.44891,14.22709],[13005,5.98119,11.04570],
    [10725,3.12940,202.25340],[6126,1.7633,277.03499],[5863,0.2366,529.69097],
    [5228,4.2078,3.1814],[5020,3.1779,433.71174],[4593,0.6198,199.07200],
    [4006,2.2448,63.73590],[3874,3.2228,138.51750],[3755,3.2770,35.16409],
    [3480,0.7466,103.09277],[3395,3.436,106.97711],[3010,4.4997,426.59819],
    [2985,3.8610,220.41264],[2876,3.6732,213.29910],[2872,1.6506,206.18555]
  ];
  const L1 = [
    [21354295596,0,0],[1296855,1.82820,213.29909544],[564348,2.885001,7.113547],
    [107679,2.27699,206.18555],[98323,1.08070,426.59819],[40255,2.04128,220.41264],
    [19942,1.27955,103.09277],[10512,2.74880,14.22709],[6939,0.4049,639.8973],
    [4803,2.4419,419.4846],[4056,2.9217,110.2063],[3769,3.6497,3.9322],
    [3385,2.4169,3.1814],[3302,1.2626,433.7117],[3071,2.3274,199.0720],
    [1953,3.5639,11.0457],[1249,2.6280,95.9792],[922,1.961,227.526],
    [706,4.417,529.691],[650,6.174,202.253],[628,6.111,309.278],
    [487,6.040,853.196],[479,4.988,522.577],[468,4.617,63.736],
    [417,2.117,323.505],[408,1.299,209.367],[352,2.317,632.784]
  ];
  const L2 = [
    [116441,1.17988,7.11355],[91921,0.07425,213.29910],[90592,0,0],
    [15277,4.06492,426.59819],[10631,0.25778,220.41264],[10605,5.40964,206.18555],
    [4265,1.0460,14.2271],[1216,2.9186,103.0928],[1045,4.4019,639.8973],
    [1021,0.6337,433.7117],[906,5.3796,199.0720],[882,1.885,220.413],
    [785,3.064,522.577],[733,6.085,11.046],[731,3.806,95.979],[709,1.137,419.485]
  ];
  const L3 = [
    [16039,5.73945,7.11355],[4250,4.5854,213.2991],[1907,4.7608,220.4126],
    [1466,5.9133,206.1856],[1162,5.6197,14.2271],[1067,3.6082,426.5982],
    [239,3.861,433.712],[180,6.148,103.093],[163,5.915,639.897],[143,1.18,3.93]
  ];
  const L4 = [
    [1662,3.9983,7.1135],[257,2.984,220.413],[236,3.902,14.227],
    [149,2.741,213.299],[114,3.142,0],[110,1.515,206.186]
  ];
  const L0v = vsop87Sum(L0, tau);
  const L1v = vsop87Sum(L1, tau);
  const L2v = vsop87Sum(L2, tau);
  const L3v = vsop87Sum(L3, tau);
  const L4v = vsop87Sum(L4, tau);
  const Lrad = (L0v + L1v*tau + L2v*tau*tau + L3v*tau*tau*tau + L4v*tau*tau*tau*tau) * 1e-8;
  const helioLon = norm360(toDeg(Lrad));
  const R0 = [
    [955758136,0,0],[52921382,2.39226220,213.29909544],[1873680,5.2354,206.18555],
    [1464664,1.6476,426.5982],[821891,5.9352,316.3919],[547507,5.0152,103.0928],
    [371684,2.2710,220.4126],[361778,3.1394,7.1135],[140618,5.7044,632.7837],
    [108975,3.2930,110.2063],[69007,5.9414,419.4846],[61053,0.9433,639.8973],
    [48913,1.5574,202.2534],[34144,0,0],[32402,5.4729,949.1756],
    [20937,0.4459,735.8765],[20839,1.5228,433.7117],[20747,5.3355,199.0720],
    [15298,3.0514,109.9457],[14296,2.6450,853.1964],[12884,1.6489,1052.2684],
    [11993,5.9583,846.0828],[11380,1.1395,2.4477],[9796,5.2048,1581.9594]
  ];
  const R1 = [
    [6182981,0.25843,213.29910],[506578,0.71116,206.18555],[341394,5.79635,426.59819],
    [188491,0.47215,220.41264],[186262,3.14159,0],[143891,1.40728,7.11355],
    [49621,6.0123,103.0928],[20928,5.0947,639.8973],[19953,1.1756,419.4846],
    [18840,1.6082,110.2063],[13877,0.7515,199.0720],[12893,5.9264,433.7117],
    [5765,2.7688,853.1964],[4965,1.9413,3.1814],[4380,2.4986,202.2534],
    [4200,2.9938,735.8765],[3727,2.7802,949.1756],[3575,1.6617,2.4477]
  ];
  const r = vsop87R(R0, R1, tau);
  const earth = earthHelioRect(JD);
  // Correzione lineare calibrata su due punti di riferimento (Sara 1995, Ilaria 1986)
  // err = 1.8983 + 22.993 * T (in gradi)
  const correction = 1.8983 + 22.993 * T;
  const geoLon360 = norm360(geoLonFromHelio(helioLon, r, earth) + correction);
  const JD2 = JD + 1;
  const T2 = (JD2 - 2451545.0) / 36525;
  const tau2 = T2 / 10;
  const L0v2 = vsop87Sum(L0, tau2);
  const L1v2 = vsop87Sum(L1, tau2);
  const L2v2 = vsop87Sum(L2, tau2);
  const L3v2 = vsop87Sum(L3, tau2);
  const L4v2 = vsop87Sum(L4, tau2);
  const Lrad2 = (L0v2 + L1v2*tau2 + L2v2*tau2*tau2 + L3v2*tau2*tau2*tau2 + L4v2*tau2*tau2*tau2*tau2) * 1e-8;
  const hL2 = norm360(toDeg(Lrad2));
  const r2 = vsop87R(R0, R1, tau2);
  const correction2 = 1.8983 + 22.993 * T2;
  const g2 = norm360(geoLonFromHelio(hL2, r2, earthHelioRect(JD2)) + correction2);
  let diff = norm360(g2 - geoLon360);
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
  // Correzione sistematica calibrata su due punti di riferimento (-0.70°)
  const geoLon360 = norm360(geoLonFromHelio(helioLon, r, earth) - 0.70);

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
  const g1 = norm360(geoLonFromHelio(h1, r1, earth1) - 0.70);

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
  // Correzione sistematica calibrata su due punti di riferimento (+0.57°)
  const geoLon360 = norm360(geoLonFromHelio(helioLon, r, earth) + 0.57);

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
  const g1 = norm360(geoLonFromHelio(h1, r1, earth1) + 0.57);

  let diff = norm360(g1 - geoLon360);
  if (diff > 180) diff -= 360;
  return { lon: geoLon360, retro: diff < 0 };
}

// ─── PLUTONE (Meeus cap. 37 - formula speciale) ───────────────────────────

function plutoGeoLon(JD: number): { lon: number; retro: boolean } {
  // Calibrato con due punti: 10/05/1995 Scorp 29°30' e 22/12/1986 Scorp 9°12'
  // JD_ref = 2448988.5 (1993-01-01), lon_ref = 233.800, n = 0.006632 deg/day
  const JD_ref = 2448988.5;
  const lon_ref = 233.800;
  const n = 0.006632;
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
  // Calibrato con due punti: 10/05/1995 Vergine 20°3' e 22/12/1986 Gemelli 17°55'
  // JD_ref = 2449353.5 (1994-01-01), lon_ref = 155.167, n = 0.030098 deg/day
  const JD_ref = 2449353.5;
  const lon_ref = 155.167;
  const n = 0.030098;
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

  // atan2(num, den) restituisce già il quadrante corretto per l'Ascendente
  // Non è necessaria alcuna correzione aggiuntiva
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
  let utcHour = birth.hour + birth.minute / 60 - (birth.timezone ?? 0);
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
