/**
 * Store locale per i temi astrali usando AsyncStorage
 * Gestisce il salvataggio e recupero dei temi senza necessità di login
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface PlanetaryPosition {
  name: string;
  symbol: string;
  longitude: number;
  latitude?: number;
  sign: string;
  degrees: number;
  minutes: number;
  seconds: number;
  house: number;
  retrograde: boolean;
  speed?: number;
}

export interface House {
  number: number;
  sign: string;
  longitude: number;
  degrees: number;
  minutes: number;
  seconds: number;
}

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

export interface BirthData {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  latitude: number;
  longitude: number;
  timezone?: number;  // opzionale: se omesso, il backend calcola automaticamente DST
  placeName: string;
}

export interface SavedTheme {
  id: string;
  name: string;
  birthData: BirthData;
  astrologicalData: AstrologicalData;
  createdAt: string;
}

const THEMES_KEY = "cosmic_navigator_themes";

export async function getSavedThemes(): Promise<SavedTheme[]> {
  try {
    const raw = await AsyncStorage.getItem(THEMES_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedTheme[];
  } catch {
    return [];
  }
}

export async function saveTheme(theme: SavedTheme): Promise<void> {
  const themes = await getSavedThemes();
  const idx = themes.findIndex((t) => t.id === theme.id);
  if (idx >= 0) {
    themes[idx] = theme;
  } else {
    themes.unshift(theme);
  }
  await AsyncStorage.setItem(THEMES_KEY, JSON.stringify(themes));
}

export async function deleteTheme(id: string): Promise<void> {
  const themes = await getSavedThemes();
  const filtered = themes.filter((t) => t.id !== id);
  await AsyncStorage.setItem(THEMES_KEY, JSON.stringify(filtered));
}

export async function getThemeById(id: string): Promise<SavedTheme | null> {
  const themes = await getSavedThemes();
  return themes.find((t) => t.id === id) ?? null;
}

export function generateId(): string {
  return `theme_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
