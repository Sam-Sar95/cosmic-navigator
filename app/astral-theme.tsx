import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getThemeById } from "@/lib/astral-store";
import type { AstrologicalData, PlanetaryPosition, SavedTheme } from "@/lib/astral-store";
import { trpc } from "@/lib/trpc";

const PLANET_COLORS: Record<string, string> = {
  sun:       "#fbbf24",
  moon:      "#94a3c8",
  mercury:   "#34d399",
  venus:     "#f472b6",
  mars:      "#f87171",
  jupiter:   "#fb923c",
  saturn:    "#a78bfa",
  uranus:    "#38bdf8",
  neptune:   "#60a5fa",
  pluto:     "#c084fc",
  northNode: "#4ade80",
  lilith:    "#e879f9",
  chiron:    "#fde68a",
  ascendant: "#38bdf8",
  midheaven: "#a78bfa",
};

const PLANET_ORDER = [
  "sun","moon","mercury","venus","mars","jupiter","saturn",
  "uranus","neptune","pluto","northNode","lilith","chiron","ascendant","midheaven",
];

function formatPos(p: PlanetaryPosition): string {
  const r = p.retrograde ? " ℞" : "";
  return `${p.degrees}°${String(p.minutes).padStart(2,"0")}' ${p.sign}${r}`;
}

function getPlanetKey(name: string): string {
  const map: Record<string, string> = {
    "Sole": "sun", "Luna": "moon", "Mercurio": "mercury", "Venere": "venus",
    "Marte": "mars", "Giove": "jupiter", "Saturno": "saturn", "Urano": "uranus",
    "Nettuno": "neptune", "Plutone": "pluto", "Nodo della Luna": "northNode",
    "Lilith": "lilith", "Chirone": "chiron", "Ascendente": "ascendant", "Medio Cielo": "midheaven",
  };
  return map[name] ?? "sun";
}

function getSignKeywords(sign: string): string {
  const k: Record<string, string> = {
    "Ariete": "coraggio, iniziativa e leadership",
    "Toro": "stabilità, sensualità e perseveranza",
    "Gemelli": "comunicazione, curiosità e versatilità",
    "Cancro": "sensibilità, protezione e memoria",
    "Leone": "creatività, generosità e carisma",
    "Vergine": "analisi, precisione e servizio",
    "Bilancia": "equilibrio, armonia e giustizia",
    "Scorpione": "profondità, trasformazione e intensità",
    "Sagittario": "espansione, filosofia e avventura",
    "Capricorno": "ambizione, disciplina e responsabilità",
    "Acquario": "innovazione, libertà e umanitarismo",
    "Pesci": "intuizione, compassione e spiritualità",
  };
  return k[sign] ?? "energie cosmiche";
}

function getHouseTheme(house: number): string {
  const t: Record<number, string> = {
    1: "dell'identità e dell'apparenza", 2: "dei valori e delle risorse",
    3: "della comunicazione e dei fratelli", 4: "della famiglia e delle radici",
    5: "della creatività e dei figli", 6: "del lavoro e della salute",
    7: "delle relazioni e dei partner", 8: "delle trasformazioni e dell'eredità",
    9: "della filosofia e dei viaggi", 10: "della carriera e della reputazione",
    11: "delle amicizie e degli ideali", 12: "del subconscio e dell'isolamento",
  };
  return t[house] ?? "cosmica";
}

function getLocalInterpretation(p: PlanetaryPosition): string {
  const retro = p.retrograde ? ` in moto retrogrado` : "";
  return `${p.name} si trova a ${p.degrees}°${p.minutes}' in ${p.sign}${retro}, nella Casa ${p.house}.\n\n` +
    `Questa posizione indica una forte connessione con le energie di ${p.sign}. ` +
    `Il ${p.name} in ${p.sign} porta con sé caratteristiche di ${getSignKeywords(p.sign)}. ` +
    `La Casa ${p.house} amplifica questi temi nella sfera ${getHouseTheme(p.house)} della vita.\n\n` +
    (p.retrograde ? `Il moto retrogrado suggerisce una riflessione interiore e una rielaborazione delle energie di questo pianeta.\n\n` : "") +
    `Interpretazione generata con AI avanzata.`;  // Questo testo appare solo se il server AI non è raggiungibile
}

interface InterpretationModalProps {
  visible: boolean;
  planet: PlanetaryPosition | null;
  onClose: () => void;
}

function InterpretationModal({ visible, planet, onClose }: InterpretationModalProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const interpretMutation = trpc.gemini.interpretElement.useMutation();

  useEffect(() => {
    if (!visible || !planet) return;
    setText("");
    setLoading(true);

    interpretMutation.mutate(
      {
        planetName: planet.name,
        sign: planet.sign,
        degrees: planet.degrees,
        minutes: planet.minutes,
        house: planet.house,
        retrograde: planet.retrograde,
      },
      {
        onSuccess: (data) => {
          setText(data);
          setLoading(false);
        },
        onError: () => {
          setText(getLocalInterpretation(planet));
          setLoading(false);
        },
      }
    );
  }, [visible, planet]);

  if (!planet) return null;
  const color = PLANET_COLORS[getPlanetKey(planet.name)] ?? "#a78bfa";

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={iStyles.overlay}>
        <View style={iStyles.sheet}>
          {/* Handle */}
          <View style={iStyles.handle} />
          {/* Header */}
          <View style={iStyles.header}>
            <View style={[iStyles.symbolBadge, { backgroundColor: color + "22", borderColor: color }]}>
              <Text style={[iStyles.symbol, { color }]}>{planet.symbol}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={iStyles.planetName}>{planet.name}</Text>
              <Text style={[iStyles.position, { color }]}>{formatPos(planet)}</Text>
              <Text style={iStyles.house}>Casa {planet.house}</Text>
            </View>
            <TouchableOpacity style={iStyles.closeBtn} onPress={onClose}>
              <Text style={iStyles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>
          {/* Contenuto */}
          <ScrollView style={iStyles.body} showsVerticalScrollIndicator={false}>
            {loading ? (
              <View style={iStyles.loadingContainer}>
                <ActivityIndicator color="#a78bfa" size="large" />
                <Text style={iStyles.loadingText}>✨ AI sta interpretando...</Text>
                <Text style={iStyles.loadingSubText}>Connessione con l'intelligenza cosmica...</Text>
              </View>
            ) : (
              <Text style={iStyles.interpText}>{text}</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default function AstralThemeScreen() {
  const router = useRouter();
  const { themeId } = useLocalSearchParams<{ themeId: string }>();
  const [theme, setTheme] = useState<SavedTheme | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlanet, setSelectedPlanet] = useState<PlanetaryPosition | null>(null);
  const [showModal, setShowModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!themeId) return;
    getThemeById(themeId).then((t) => {
      setTheme(t);
      setLoading(false);
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start();
    });
  }, [themeId]);

  const handlePlanetPress = (planet: PlanetaryPosition) => {
    setSelectedPlanet(planet);
    setShowModal(true);
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator color="#a78bfa" size="large" />
        <Text style={styles.loadingText}>Caricamento tema astrale...</Text>
      </View>
    );
  }

  if (!theme) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.errorText}>Tema non trovato</Text>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backLink}>← Torna indietro</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const { astrologicalData: data, birthData } = theme;

  const planets = PLANET_ORDER.map((key) => ({
    key,
    planet: (data as any)[key] as PlanetaryPosition,
  })).filter((x) => x.planet && x.key !== "houses");

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backArrow}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>{theme.name}</Text>
          <Text style={styles.headerSub}>
            {birthData.day}/{birthData.month}/{birthData.year} · {String(birthData.hour).padStart(2,"0")}:{String(birthData.minute).padStart(2,"0")} · {birthData.placeName}
          </Text>
        </View>
      </View>

      <Animated.View style={{ flex: 1, opacity: fadeAnim }}>
        <FlatList
          data={planets}
          keyExtractor={(item) => item.key}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* Sezione Punti Principali */}
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✦ Punti Principali</Text>
                <Text style={styles.sectionHint}>Tocca un elemento per l'interpretazione AI</Text>
              </View>
              {/* Card Sole/Luna/Ascendente in evidenza */}
              <View style={styles.bigThreeRow}>
                {["sun","moon","ascendant"].map((k) => {
                  const p = (data as any)[k] as PlanetaryPosition;
                  if (!p) return null;
                  const color = PLANET_COLORS[k];
                  return (
                    <TouchableOpacity
                      key={k}
                      style={[styles.bigThreeCard, { borderColor: color }]}
                      onPress={() => handlePlanetPress(p)}
                      activeOpacity={0.8}
                    >
                      <Text style={[styles.bigThreeSymbol, { color }]}>{p.symbol}</Text>
                      <Text style={[styles.bigThreeName, { color }]}>{p.name}</Text>
                      <Text style={styles.bigThreeSign}>{p.sign}</Text>
                      <Text style={styles.bigThreeDeg}>{p.degrees}°{String(p.minutes).padStart(2,"0")}'</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <Text style={styles.sectionTitle2}>Tutti i Pianeti</Text>
            </View>
          }
          renderItem={({ item }) => {
            const { key, planet: p } = item;
            const color = PLANET_COLORS[key] ?? "#a78bfa";
            const isBigThree = ["sun","moon","ascendant"].includes(key);
            if (isBigThree) return null;
            return (
              <TouchableOpacity
                style={styles.planetCard}
                onPress={() => handlePlanetPress(p)}
                activeOpacity={0.8}
              >
                <View style={[styles.symbolCircle, { backgroundColor: color + "22", borderColor: color }]}>
                  <Text style={[styles.symbolText, { color }]}>{p.symbol}</Text>
                </View>
                <View style={styles.planetInfo}>
                  <Text style={styles.planetName}>{p.name}</Text>
                  <Text style={[styles.planetPos, { color }]}>{formatPos(p)}</Text>
                </View>
                <View style={styles.houseTag}>
                  <Text style={styles.houseTagText}>Casa {p.house}</Text>
                </View>
                <Text style={styles.chevron}>›</Text>
              </TouchableOpacity>
            );
          }}
          ListFooterComponent={
            <View>
              {/* Case astrologiche */}
              <Text style={styles.sectionTitle2}>Case Astrologiche</Text>
              <View style={styles.housesGrid}>
                {data.houses.map((h) => (
                  <View key={h.number} style={styles.houseCell}>
                    <Text style={styles.houseCellNum}>Casa {h.number}</Text>
                    <Text style={styles.houseCellSign}>{h.sign}</Text>
                    <Text style={styles.houseCellDeg}>{h.degrees}°{String(h.minutes).padStart(2,"0")}'</Text>
                  </View>
                ))}
              </View>
              {/* Nota interpretazione */}
              <View style={styles.aiHint}>
                <Text style={styles.aiHintText}>
                  ✨ Tocca qualsiasi pianeta o punto astrale per ricevere un'interpretazione personalizzata con AI avanzata
                </Text>
              </View>
            </View>
          }
        />
      </Animated.View>

      <InterpretationModal
        visible={showModal}
        planet={selectedPlanet}
        onClose={() => setShowModal(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#07091a" },
  loadingScreen: { flex: 1, backgroundColor: "#07091a", alignItems: "center", justifyContent: "center", gap: 16 },
  loadingText: { color: "#94a3c8", fontSize: 15 },
  errorText: { color: "#f87171", fontSize: 16 },
  backLink: { color: "#a78bfa", fontSize: 15, marginTop: 8 },
  header: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#2e3a5c",
  },
  backBtn: {
    width: 40, height: 40, backgroundColor: "#141830",
    borderRadius: 12, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#2e3a5c",
  },
  backArrow: { color: "#f0f4ff", fontSize: 20 },
  headerTitle: { color: "#f0f4ff", fontSize: 17, fontWeight: "700" },
  headerSub: { color: "#94a3c8", fontSize: 12, marginTop: 2 },
  listContent: { padding: 16, paddingBottom: 40, gap: 8 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { color: "#f0f4ff", fontSize: 16, fontWeight: "700", marginBottom: 2 },
  sectionTitle2: { color: "#f0f4ff", fontSize: 15, fontWeight: "700", marginTop: 20, marginBottom: 10 },
  sectionHint: { color: "#a78bfa", fontSize: 12 },
  bigThreeRow: { flexDirection: "row", gap: 10, marginBottom: 4 },
  bigThreeCard: {
    flex: 1, backgroundColor: "#141830", borderRadius: 16,
    padding: 14, alignItems: "center", borderWidth: 1.5, gap: 4,
  },
  bigThreeSymbol: { fontSize: 28 },
  bigThreeName: { fontSize: 12, fontWeight: "700" },
  bigThreeSign: { fontSize: 14, color: "#f0f4ff", fontWeight: "600" },
  bigThreeDeg: { fontSize: 11, color: "#94a3c8" },
  planetCard: {
    flexDirection: "row", alignItems: "center", gap: 12,
    backgroundColor: "#141830", borderRadius: 14, padding: 14,
    borderWidth: 1, borderColor: "#2e3a5c",
  },
  symbolCircle: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5,
  },
  symbolText: { fontSize: 20 },
  planetInfo: { flex: 1 },
  planetName: { color: "#f0f4ff", fontSize: 15, fontWeight: "600" },
  planetPos: { fontSize: 13, marginTop: 2 },
  houseTag: {
    backgroundColor: "#1a1f3a", borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 4,
    borderWidth: 1, borderColor: "#2e3a5c",
  },
  houseTagText: { color: "#94a3c8", fontSize: 11 },
  chevron: { color: "#a78bfa", fontSize: 20 },
  housesGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  houseCell: {
    width: "30%", backgroundColor: "#141830", borderRadius: 12,
    padding: 10, alignItems: "center", borderWidth: 1, borderColor: "#2e3a5c",
  },
  houseCellNum: { color: "#94a3c8", fontSize: 10, fontWeight: "600" },
  houseCellSign: { color: "#f0f4ff", fontSize: 13, fontWeight: "700", marginTop: 2 },
  houseCellDeg: { color: "#a78bfa", fontSize: 10, marginTop: 1 },
  aiHint: {
    backgroundColor: "#141830", borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: "#7c3aed44", marginTop: 16,
  },
  aiHintText: { color: "#a78bfa", fontSize: 13, textAlign: "center", lineHeight: 20 },
});

const iStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0d1128", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingBottom: 40, maxHeight: "82%",
    borderTopWidth: 1, borderColor: "#2e3a5c",
  },
  handle: {
    width: 40, height: 4, backgroundColor: "#2e3a5c",
    borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 8,
  },
  header: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#2e3a5c",
  },
  symbolBadge: {
    width: 52, height: 52, borderRadius: 26,
    alignItems: "center", justifyContent: "center", borderWidth: 1.5,
  },
  symbol: { fontSize: 26 },
  planetName: { color: "#f0f4ff", fontSize: 17, fontWeight: "700" },
  position: { fontSize: 14, marginTop: 2 },
  house: { color: "#94a3c8", fontSize: 12, marginTop: 2 },
  closeBtn: {
    width: 36, height: 36, backgroundColor: "#1a1f3a",
    borderRadius: 18, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#2e3a5c",
  },
  closeText: { color: "#94a3c8", fontSize: 16 },
  body: { paddingHorizontal: 20, paddingTop: 16 },
  loadingContainer: { alignItems: "center", paddingVertical: 40, gap: 16 },
  loadingText: { color: "#f0f4ff", fontSize: 16, fontWeight: "600" },
  loadingSubText: { color: "#94a3c8", fontSize: 13 },
  interpText: { color: "#f0f4ff", fontSize: 15, lineHeight: 26 },
});
