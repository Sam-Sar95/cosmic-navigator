import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { trpc } from "@/lib/trpc";
import { generateId, saveTheme } from "@/lib/astral-store";
import type { BirthData } from "@/lib/astral-store";

// Dati di geocoding per le città italiane più comuni
const CITY_DATA: Record<string, { lat: number; lon: number; tz: number }> = {
  "ceva":         { lat: 44.3833, lon: 8.0333,  tz: 2 },
  "roma":         { lat: 41.9028, lon: 12.4964, tz: 2 },
  "milano":       { lat: 45.4642, lon: 9.1900,  tz: 2 },
  "napoli":       { lat: 40.8518, lon: 14.2681, tz: 2 },
  "torino":       { lat: 45.0703, lon: 7.6869,  tz: 2 },
  "palermo":      { lat: 38.1157, lon: 13.3615, tz: 2 },
  "genova":       { lat: 44.4000, lon: 8.8833,  tz: 1 },  // 44°24'N 8°53'E (coordinate esatte)
  "bologna":      { lat: 44.4949, lon: 11.3426, tz: 2 },
  "firenze":      { lat: 43.7696, lon: 11.2558, tz: 2 },
  "venezia":      { lat: 45.4408, lon: 12.3155, tz: 2 },
  "verona":       { lat: 45.4384, lon: 10.9916, tz: 2 },
  "catania":      { lat: 37.5079, lon: 15.0830, tz: 2 },
  "bari":         { lat: 41.1171, lon: 16.8719, tz: 2 },
  "messina":      { lat: 38.1938, lon: 15.5540, tz: 2 },
  "padova":       { lat: 45.4064, lon: 11.8768, tz: 2 },
  "trieste":      { lat: 45.6495, lon: 13.7768, tz: 2 },
  "taranto":      { lat: 40.4643, lon: 17.2470, tz: 2 },
  "brescia":      { lat: 45.5416, lon: 10.2118, tz: 2 },
  "reggio calabria": { lat: 38.1113, lon: 15.6474, tz: 2 },
  "modena":       { lat: 44.6471, lon: 10.9252, tz: 2 },
  "parma":        { lat: 44.8015, lon: 10.3279, tz: 2 },
  "perugia":      { lat: 43.1107, lon: 12.3908, tz: 2 },
  "livorno":      { lat: 43.5485, lon: 10.3106, tz: 2 },
  "cagliari":     { lat: 39.2238, lon: 9.1217,  tz: 2 },
  "foggia":       { lat: 41.4621, lon: 15.5444, tz: 2 },
  "salerno":      { lat: 40.6824, lon: 14.7681, tz: 2 },
  "rimini":       { lat: 44.0678, lon: 12.5695, tz: 2 },
  "ferrara":      { lat: 44.8381, lon: 11.6197, tz: 2 },
  "sassari":      { lat: 40.7259, lon: 8.5556,  tz: 2 },
  "latina":       { lat: 41.4677, lon: 12.9035, tz: 2 },
  "giugliano in campania": { lat: 40.9283, lon: 14.1947, tz: 2 },
  "monza":        { lat: 45.5845, lon: 9.2744,  tz: 2 },
  "siracusa":     { lat: 37.0755, lon: 15.2866, tz: 2 },
  "pescara":      { lat: 42.4617, lon: 14.2158, tz: 2 },
  "bergamo":      { lat: 45.6983, lon: 9.6773,  tz: 2 },
  "vicenza":      { lat: 45.5455, lon: 11.5354, tz: 2 },
  "trento":       { lat: 46.0748, lon: 11.1217, tz: 2 },
  "cuneo":        { lat: 44.3841, lon: 7.5426,  tz: 2 },
  "new york":     { lat: 40.7128, lon: -74.0060, tz: -4 },
  "london":       { lat: 51.5074, lon: -0.1278,  tz: 1 },
  "paris":        { lat: 48.8566, lon: 2.3522,   tz: 2 },
  "berlin":       { lat: 52.5200, lon: 13.4050,  tz: 2 },
  "madrid":       { lat: 40.4168, lon: -3.7038,  tz: 2 },
  "barcelona":    { lat: 41.3851, lon: 2.1734,   tz: 2 },
};

async function geocodeCity(name: string): Promise<{ lat: number; lon: number; tz: number } | null> {
  const key = name.toLowerCase().trim();
  if (CITY_DATA[key]) return CITY_DATA[key];

  // Cerca per corrispondenza parziale
  for (const [city, data] of Object.entries(CITY_DATA)) {
    if (city.includes(key) || key.includes(city)) return data;
  }

  // Fallback: tenta geocoding via API nominatim
  try {
    const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1`;
    const res = await fetch(url, { headers: { "User-Agent": "CosmicNavigator/1.0" } });
    const json = await res.json();
    if (json.length > 0) {
      const lat = parseFloat(json[0].lat);
      const lon = parseFloat(json[0].lon);
      // Stima del fuso orario in base alla longitudine
      const tz = Math.round(lon / 15);
      return { lat, lon, tz };
    }
  } catch {}
  return null;
}

export default function BirthInputScreen() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [day, setDay] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [hour, setHour] = useState("");
  const [minute, setMinute] = useState("");
  const [place, setPlace] = useState("");
  const [loading, setLoading] = useState(false);

  const calculateMutation = trpc.astrology.calculate.useMutation();

  const handleCalculate = async () => {
    if (!name.trim()) { Alert.alert("Errore", "Inserisci un nome per il tema."); return; }
    const d = parseInt(day), m = parseInt(month), y = parseInt(year);
    const h = parseInt(hour), min = parseInt(minute);
    if (!d || !m || !y || isNaN(h) || isNaN(min)) {
      Alert.alert("Errore", "Compila tutti i campi data e ora.");
      return;
    }
    if (!place.trim()) { Alert.alert("Errore", "Inserisci il luogo di nascita."); return; }

    setLoading(true);
    try {
      const geo = await geocodeCity(place);
      if (!geo) {
        Alert.alert("Luogo non trovato", "Non riesco a trovare le coordinate per questo luogo. Prova con una città principale vicina.");
        setLoading(false);
        return;
      }

      const birthData: BirthData = {
        year: y, month: m, day: d,
        hour: h, minute: min,
        latitude: geo.lat, longitude: geo.lon,
        timezone: geo.tz,
        placeName: place.trim(),
      };

      // Usa il servizio Python (pyswisseph) via tRPC per calcoli di precisione professionale
      const astroData = await calculateMutation.mutateAsync({
        year: y, month: m, day: d,
        hour: h, minute: min,
        latitude: geo.lat,
        longitude: geo.lon,
        timezone: geo.tz,
        placeName: place.trim(),
      });

      // Normalizza i dati del backend (pyswisseph) per allinearli ai tipi del frontend
      const PLANET_NAMES: Record<string, { name: string; symbol: string }> = {
        sun:       { name: "Sole",            symbol: "☉" },
        moon:      { name: "Luna",            symbol: "☽" },
        mercury:   { name: "Mercurio",        symbol: "☿" },
        venus:     { name: "Venere",          symbol: "♀" },
        mars:      { name: "Marte",           symbol: "♂" },
        jupiter:   { name: "Giove",           symbol: "♃" },
        saturn:    { name: "Saturno",         symbol: "♄" },
        uranus:    { name: "Urano",           symbol: "♅" },
        neptune:   { name: "Nettuno",         symbol: "♆" },
        pluto:     { name: "Plutone",         symbol: "♇" },
        northNode: { name: "Nodo della Luna", symbol: "☊" },
        lilith:    { name: "Lilith",          symbol: "⚸" },
        chiron:    { name: "Chirone",         symbol: "⚷" },
        ascendant: { name: "Ascendente",      symbol: "AC" },
        midheaven: { name: "Medio Cielo",     symbol: "MC" },
      };

      const rawData = astroData as any;
      const normalizedData: any = {};

      // Normalizza ogni pianeta aggiungendo name, symbol, seconds mancanti
      for (const key of Object.keys(PLANET_NAMES)) {
        if (rawData[key]) {
          normalizedData[key] = {
            ...rawData[key],
            name: PLANET_NAMES[key].name,
            symbol: PLANET_NAMES[key].symbol,
            seconds: rawData[key].seconds ?? 0,
            latitude: rawData[key].latitude ?? 0,
          };
        }
      }

      // Normalizza le case: backend usa 'house' come numero, frontend si aspetta 'number'
      normalizedData.houses = Array.isArray(rawData.houses)
        ? rawData.houses.map((h: any) => ({
            number: h.house ?? h.number ?? 0,  // backend usa 'house', frontend usa 'number'
            house: h.house ?? h.number ?? 0,   // mantieni entrambi per compatibilità
            sign: h.sign ?? "",
            longitude: h.longitude ?? 0,
            degrees: h.degrees ?? 0,
            minutes: h.minutes ?? 0,
            seconds: h.seconds ?? 0,
          }))
        : [];

      // Mantieni i metadati
      if (rawData.meta) normalizedData.meta = rawData.meta;

      const theme = {
        id: generateId(),
        name: name.trim(),
        birthData,
        astrologicalData: normalizedData,
        createdAt: new Date().toISOString(),
      };

      await saveTheme(theme);
      await AsyncStorage.setItem("current_theme_id", theme.id);

      router.push({ pathname: "/astral-theme" as any, params: { themeId: theme.id } });
    } catch (e: any) {
      Alert.alert("Errore", e.message ?? "Errore nel calcolo del tema astrale.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nuovo Tema Astrale</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Intro */}
          <View style={styles.introCard}>
            <Text style={styles.introIcon}>🪐</Text>
            <Text style={styles.introText}>
              Inserisci i dati di nascita per calcolare il tuo tema astrale con precisione astronomica.
            </Text>
          </View>

          {/* Nome */}
          <Text style={styles.label}>Nome del tema</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="es. Il mio tema"
            placeholderTextColor="#4a5568"
            returnKeyType="next"
          />

          {/* Data */}
          <Text style={styles.label}>Data di nascita</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.sublabel}>Giorno</Text>
              <TextInput
                style={styles.input}
                value={day}
                onChangeText={setDay}
                placeholder="10"
                placeholderTextColor="#4a5568"
                keyboardType="numeric"
                maxLength={2}
                returnKeyType="next"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.sublabel}>Mese</Text>
              <TextInput
                style={styles.input}
                value={month}
                onChangeText={setMonth}
                placeholder="05"
                placeholderTextColor="#4a5568"
                keyboardType="numeric"
                maxLength={2}
                returnKeyType="next"
              />
            </View>
            <View style={[styles.col, { flex: 1.5 }]}>
              <Text style={styles.sublabel}>Anno</Text>
              <TextInput
                style={styles.input}
                value={year}
                onChangeText={setYear}
                placeholder="1995"
                placeholderTextColor="#4a5568"
                keyboardType="numeric"
                maxLength={4}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Ora */}
          <Text style={styles.label}>Ora di nascita</Text>
          <View style={styles.row}>
            <View style={styles.col}>
              <Text style={styles.sublabel}>Ora</Text>
              <TextInput
                style={styles.input}
                value={hour}
                onChangeText={setHour}
                placeholder="13"
                placeholderTextColor="#4a5568"
                keyboardType="numeric"
                maxLength={2}
                returnKeyType="next"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.sublabel}>Minuti</Text>
              <TextInput
                style={styles.input}
                value={minute}
                onChangeText={setMinute}
                placeholder="20"
                placeholderTextColor="#4a5568"
                keyboardType="numeric"
                maxLength={2}
                returnKeyType="next"
              />
            </View>
            <View style={[styles.col, { flex: 1.5 }]}>
              <Text style={[styles.sublabel, { color: "#4a5568" }]}>Formato 24h</Text>
              <View style={[styles.input, styles.infoBox]}>
                <Text style={styles.infoText}>es. 13:20</Text>
              </View>
            </View>
          </View>

          {/* Luogo */}
          <Text style={styles.label}>Luogo di nascita</Text>
          <TextInput
            style={styles.input}
            value={place}
            onChangeText={setPlace}
            placeholder="es. Ceva, Cuneo"
            placeholderTextColor="#4a5568"
            returnKeyType="done"
            onSubmitEditing={handleCalculate}
          />
          <Text style={styles.hint}>
            Inserisci il nome della città. Per risultati migliori usa il nome in italiano o inglese.
          </Text>

          {/* Esempio */}
          <TouchableOpacity
            style={styles.exampleBtn}
            onPress={() => {
              setName("Tema di esempio");
              setDay("10"); setMonth("05"); setYear("1995");
              setHour("13"); setMinute("20");
              setPlace("Ceva");
            }}
          >
            <Text style={styles.exampleBtnText}>✦ Usa dati di esempio (10/05/1995 13:20 Ceva)</Text>
          </TouchableOpacity>

          {/* Calcola */}
          <TouchableOpacity
            style={[styles.calcBtn, loading && styles.calcBtnDisabled]}
            onPress={handleCalculate}
            disabled={loading}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.calcBtnText}>🪐 Calcola Tema Astrale</Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#07091a" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#2e3a5c",
  },
  backBtn: {
    width: 40, height: 40,
    backgroundColor: "#141830",
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#2e3a5c",
  },
  backArrow: { color: "#f0f4ff", fontSize: 20 },
  headerTitle: { color: "#f0f4ff", fontSize: 18, fontWeight: "700" },
  scroll: { padding: 20, paddingBottom: 40, gap: 6 },
  introCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141830",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#2e3a5c",
    marginBottom: 16,
    gap: 12,
  },
  introIcon: { fontSize: 28 },
  introText: { flex: 1, color: "#94a3c8", fontSize: 14, lineHeight: 20 },
  label: { color: "#f0f4ff", fontSize: 15, fontWeight: "600", marginTop: 14, marginBottom: 6 },
  sublabel: { color: "#94a3c8", fontSize: 12, marginBottom: 4 },
  input: {
    backgroundColor: "#141830",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#2e3a5c",
    color: "#f0f4ff",
    fontSize: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  infoBox: { justifyContent: "center" },
  infoText: { color: "#4a5568", fontSize: 14 },
  row: { flexDirection: "row", gap: 10 },
  col: { flex: 1 },
  hint: { color: "#4a5568", fontSize: 12, marginTop: 4, marginBottom: 8 },
  exampleBtn: {
    backgroundColor: "#1a1f3a",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#7c3aed",
    marginTop: 8,
    marginBottom: 4,
  },
  exampleBtnText: { color: "#a78bfa", fontSize: 13, fontWeight: "600" },
  calcBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 20,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  calcBtnDisabled: { opacity: 0.6 },
  calcBtnText: { color: "#ffffff", fontSize: 17, fontWeight: "700" },
});
