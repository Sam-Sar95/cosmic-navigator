import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { getSavedThemes } from "@/lib/astral-store";
import type { SavedTheme } from "@/lib/astral-store";
import { trpc } from "@/lib/trpc";

function getCompatibilityScore(a: SavedTheme, b: SavedTheme): number {
  const elements: Record<string, string> = {
    "Ariete": "fuoco", "Leone": "fuoco", "Sagittario": "fuoco",
    "Toro": "terra", "Vergine": "terra", "Capricorno": "terra",
    "Gemelli": "aria", "Bilancia": "aria", "Acquario": "aria",
    "Cancro": "acqua", "Scorpione": "acqua", "Pesci": "acqua",
  };
  const compatible: Record<string, string[]> = {
    fuoco: ["fuoco", "aria"],
    terra: ["terra", "acqua"],
    aria: ["aria", "fuoco"],
    acqua: ["acqua", "terra"],
  };
  let score = 50;
  const sunA = elements[a.astrologicalData.sun.sign] ?? "";
  const sunB = elements[b.astrologicalData.sun.sign] ?? "";
  const moonA = elements[a.astrologicalData.moon.sign] ?? "";
  const moonB = elements[b.astrologicalData.moon.sign] ?? "";
  const ascA = elements[a.astrologicalData.ascendant.sign] ?? "";
  const ascB = elements[b.astrologicalData.ascendant.sign] ?? "";

  if (compatible[sunA]?.includes(sunB)) score += 20;
  if (compatible[moonA]?.includes(moonB)) score += 20;
  if (compatible[ascA]?.includes(ascB)) score += 10;
  return Math.min(score, 100);
}

function getScoreColor(score: number): string {
  if (score >= 80) return "#4ade80";
  if (score >= 60) return "#fbbf24";
  return "#f87171";
}

function getScoreLabel(score: number): string {
  if (score >= 80) return "Alta compatibilità ✨";
  if (score >= 60) return "Buona compatibilità 💫";
  if (score >= 40) return "Compatibilità media ⚡";
  return "Bassa compatibilità 🌑";
}

export default function CompatibilityScreen() {
  const router = useRouter();
  const [themes, setThemes] = useState<SavedTheme[]>([]);
  const [themeA, setThemeA] = useState<SavedTheme | null>(null);
  const [themeB, setThemeB] = useState<SavedTheme | null>(null);
  const [showPickerA, setShowPickerA] = useState(false);
  const [showPickerB, setShowPickerB] = useState(false);
  const [analysis, setAnalysis] = useState("");
  const [loadingAnalysis, setLoadingAnalysis] = useState(false);

  const compatibilityMutation = trpc.gemini.analyzeCompatibility.useMutation();

  useEffect(() => { getSavedThemes().then(setThemes); }, []);

  const score = themeA && themeB ? getCompatibilityScore(themeA, themeB) : null;

  const handleAnalyze = async () => {
    if (!themeA || !themeB) return;
    setLoadingAnalysis(true);
    setAnalysis("");

    compatibilityMutation.mutate(
      {
        themeA: {
          name: themeA.name,
          sun: themeA.astrologicalData.sun.sign,
          moon: themeA.astrologicalData.moon.sign,
          ascendant: themeA.astrologicalData.ascendant.sign,
          venus: themeA.astrologicalData.venus.sign,
          mars: themeA.astrologicalData.mars.sign,
        },
        themeB: {
          name: themeB.name,
          sun: themeB.astrologicalData.sun.sign,
          moon: themeB.astrologicalData.moon.sign,
          ascendant: themeB.astrologicalData.ascendant.sign,
          venus: themeB.astrologicalData.venus.sign,
          mars: themeB.astrologicalData.mars.sign,
        },
      },
      {
        onSuccess: (data) => {
          setAnalysis(data);
          setLoadingAnalysis(false);
        },
        onError: () => {
          if (themeA && themeB) {
            setAnalysis(getLocalCompatibility(themeA, themeB, score ?? 0));
          }
          setLoadingAnalysis(false);
        },
      }
    );
  };

  function getLocalCompatibility(a: SavedTheme, b: SavedTheme, s: number): string {
    return `Analisi di compatibilità tra ${a.name} e ${b.name}\n\n` +
      `Punteggio: ${s}/100 — ${getScoreLabel(s)}\n\n` +
      `☉ Sole: ${a.astrologicalData.sun.sign} × ${b.astrologicalData.sun.sign}\n` +
      `☽ Luna: ${a.astrologicalData.moon.sign} × ${b.astrologicalData.moon.sign}\n` +
      `AC Ascendente: ${a.astrologicalData.ascendant.sign} × ${b.astrologicalData.ascendant.sign}\n\n` +
      `Per un'analisi approfondita, assicurati che la chiave API Gemini sia configurata nell'app.`;
  }

  function ThemePicker({ visible, onClose, onSelect }: { visible: boolean; onClose: () => void; onSelect: (t: SavedTheme) => void }) {
    return (
      <Modal visible={visible} animationType="slide" transparent>
        <View style={pickerStyles.overlay}>
          <View style={pickerStyles.sheet}>
            <View style={pickerStyles.handle} />
            <Text style={pickerStyles.title}>Seleziona tema</Text>
            <FlatList
              data={themes}
              keyExtractor={(t) => t.id}
              contentContainerStyle={{ padding: 16, gap: 10 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={pickerStyles.item}
                  onPress={() => { onSelect(item); onClose(); }}
                  activeOpacity={0.8}
                >
                  <Text style={pickerStyles.itemName}>{item.name}</Text>
                  <Text style={pickerStyles.itemSub}>
                    ☉ {item.astrologicalData.sun.sign} · ☽ {item.astrologicalData.moon.sign}
                  </Text>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={{ alignItems: "center", padding: 40 }}>
                  <Text style={{ color: "#94a3c8", fontSize: 14 }}>Nessun tema disponibile</Text>
                  <TouchableOpacity onPress={() => { onClose(); router.push("/birth-input"); }}>
                    <Text style={{ color: "#a78bfa", marginTop: 8 }}>Crea un tema</Text>
                  </TouchableOpacity>
                </View>
              }
            />
            <TouchableOpacity style={pickerStyles.closeBtn} onPress={onClose}>
              <Text style={pickerStyles.closeBtnText}>Annulla</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>💫 Compatibilità</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Confronta due temi astrali e scopri la compatibilità tra le loro energie.
        </Text>

        {/* Selezione temi */}
        <View style={styles.selectRow}>
          {/* Tema A */}
          <TouchableOpacity
            style={[styles.selectCard, themeA && styles.selectCardActive]}
            onPress={() => setShowPickerA(true)}
            activeOpacity={0.8}
          >
            {themeA ? (
              <>
                <Text style={styles.selectIcon}>🌟</Text>
                <Text style={styles.selectName}>{themeA.name}</Text>
                <Text style={styles.selectSub}>☉ {themeA.astrologicalData.sun.sign}</Text>
              </>
            ) : (
              <>
                <Text style={styles.selectPlus}>+</Text>
                <Text style={styles.selectLabel}>Tema A</Text>
              </>
            )}
          </TouchableOpacity>

          {/* Vs */}
          <View style={styles.vsCircle}>
            <Text style={styles.vsText}>VS</Text>
          </View>

          {/* Tema B */}
          <TouchableOpacity
            style={[styles.selectCard, themeB && styles.selectCardActive]}
            onPress={() => setShowPickerB(true)}
            activeOpacity={0.8}
          >
            {themeB ? (
              <>
                <Text style={styles.selectIcon}>🌟</Text>
                <Text style={styles.selectName}>{themeB.name}</Text>
                <Text style={styles.selectSub}>☉ {themeB.astrologicalData.sun.sign}</Text>
              </>
            ) : (
              <>
                <Text style={styles.selectPlus}>+</Text>
                <Text style={styles.selectLabel}>Tema B</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Score */}
        {score !== null && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Punteggio di compatibilità</Text>
            <Text style={[styles.scoreValue, { color: getScoreColor(score) }]}>{score}%</Text>
            <Text style={[styles.scoreDesc, { color: getScoreColor(score) }]}>{getScoreLabel(score)}</Text>
            {/* Barra */}
            <View style={styles.scoreBar}>
              <View style={[styles.scoreBarFill, { width: `${score}%` as any, backgroundColor: getScoreColor(score) }]} />
            </View>
          </View>
        )}

        {/* Pulsante analisi */}
        {themeA && themeB && (
          <TouchableOpacity
            style={[styles.analyzeBtn, loadingAnalysis && styles.analyzeBtnDisabled]}
            onPress={handleAnalyze}
            disabled={loadingAnalysis}
            activeOpacity={0.85}
          >
            {loadingAnalysis ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <Text style={styles.analyzeBtnText}>✨ Analisi AI con Gemini</Text>
            )}
          </TouchableOpacity>
        )}

        {/* Risultato analisi */}
        {analysis !== "" && (
          <View style={styles.analysisCard}>
            <Text style={styles.analysisTitle}>🔮 Analisi Astrologica</Text>
            <Text style={styles.analysisText}>{analysis}</Text>
          </View>
        )}

        {/* Confronto pianeti */}
        {themeA && themeB && (
          <View style={styles.compareSection}>
            <Text style={styles.compareTitle}>Confronto Planetario</Text>
            {[
              { label: "☉ Sole", a: themeA.astrologicalData.sun.sign, b: themeB.astrologicalData.sun.sign },
              { label: "☽ Luna", a: themeA.astrologicalData.moon.sign, b: themeB.astrologicalData.moon.sign },
              { label: "AC Ascendente", a: themeA.astrologicalData.ascendant.sign, b: themeB.astrologicalData.ascendant.sign },
              { label: "♀ Venere", a: themeA.astrologicalData.venus.sign, b: themeB.astrologicalData.venus.sign },
              { label: "♂ Marte", a: themeA.astrologicalData.mars.sign, b: themeB.astrologicalData.mars.sign },
              { label: "♃ Giove", a: themeA.astrologicalData.jupiter.sign, b: themeB.astrologicalData.jupiter.sign },
              { label: "♄ Saturno", a: themeA.astrologicalData.saturn.sign, b: themeB.astrologicalData.saturn.sign },
            ].map((row) => (
              <View key={row.label} style={styles.compareRow}>
                <Text style={styles.compareLabel}>{row.label}</Text>
                <Text style={styles.compareVal}>{row.a}</Text>
                <Text style={styles.compareSep}>×</Text>
                <Text style={styles.compareVal}>{row.b}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <ThemePicker visible={showPickerA} onClose={() => setShowPickerA(false)} onSelect={setThemeA} />
      <ThemePicker visible={showPickerB} onClose={() => setShowPickerB(false)} onSelect={setThemeB} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#07091a" },
  header: {
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#2e3a5c",
  },
  headerTitle: { color: "#f0f4ff", fontSize: 20, fontWeight: "800" },
  content: { padding: 16, paddingBottom: 60, gap: 16 },
  subtitle: { color: "#94a3c8", fontSize: 14, lineHeight: 20 },
  selectRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  selectCard: {
    flex: 1, backgroundColor: "#141830", borderRadius: 16,
    padding: 16, alignItems: "center", gap: 8,
    borderWidth: 1.5, borderColor: "#2e3a5c", minHeight: 100, justifyContent: "center",
  },
  selectCardActive: { borderColor: "#7c3aed" },
  selectPlus: { color: "#4a5568", fontSize: 28, fontWeight: "300" },
  selectLabel: { color: "#94a3c8", fontSize: 14, fontWeight: "600" },
  selectIcon: { fontSize: 24 },
  selectName: { color: "#f0f4ff", fontSize: 14, fontWeight: "700", textAlign: "center" },
  selectSub: { color: "#94a3c8", fontSize: 12 },
  vsCircle: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: "#1a1f3a", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#7c3aed",
  },
  vsText: { color: "#a78bfa", fontSize: 12, fontWeight: "800" },
  scoreCard: {
    backgroundColor: "#141830", borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: "#2e3a5c", alignItems: "center", gap: 8,
  },
  scoreLabel: { color: "#94a3c8", fontSize: 13 },
  scoreValue: { fontSize: 52, fontWeight: "800" },
  scoreDesc: { fontSize: 15, fontWeight: "600" },
  scoreBar: {
    width: "100%", height: 8, backgroundColor: "#1a1f3a",
    borderRadius: 4, overflow: "hidden", marginTop: 4,
  },
  scoreBarFill: { height: "100%", borderRadius: 4 },
  analyzeBtn: {
    backgroundColor: "#7c3aed", borderRadius: 16,
    paddingVertical: 16, alignItems: "center",
    shadowColor: "#7c3aed", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 6,
  },
  analyzeBtnDisabled: { opacity: 0.6 },
  analyzeBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  analysisCard: {
    backgroundColor: "#141830", borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: "#7c3aed44", gap: 12,
  },
  analysisTitle: { color: "#f0f4ff", fontSize: 16, fontWeight: "700" },
  analysisText: { color: "#f0f4ff", fontSize: 14, lineHeight: 24 },
  compareSection: {
    backgroundColor: "#141830", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#2e3a5c", gap: 0,
  },
  compareTitle: { color: "#f0f4ff", fontSize: 15, fontWeight: "700", marginBottom: 12 },
  compareRow: {
    flexDirection: "row", alignItems: "center",
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1a1f3a",
  },
  compareLabel: { color: "#94a3c8", fontSize: 13, width: 110 },
  compareVal: { flex: 1, color: "#f0f4ff", fontSize: 13, fontWeight: "600" },
  compareSep: { color: "#7c3aed", fontSize: 14, fontWeight: "700", marginHorizontal: 4 },
});

const pickerStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", justifyContent: "flex-end" },
  sheet: {
    backgroundColor: "#0d1128", borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: "70%", borderTopWidth: 1, borderColor: "#2e3a5c",
  },
  handle: {
    width: 40, height: 4, backgroundColor: "#2e3a5c",
    borderRadius: 2, alignSelf: "center", marginTop: 12, marginBottom: 4,
  },
  title: {
    color: "#f0f4ff", fontSize: 17, fontWeight: "700",
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#2e3a5c",
  },
  item: {
    backgroundColor: "#141830", borderRadius: 12,
    padding: 14, borderWidth: 1, borderColor: "#2e3a5c",
  },
  itemName: { color: "#f0f4ff", fontSize: 15, fontWeight: "700" },
  itemSub: { color: "#94a3c8", fontSize: 12, marginTop: 4 },
  closeBtn: {
    margin: 16, backgroundColor: "#1a1f3a", borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
    borderWidth: 1, borderColor: "#2e3a5c",
  },
  closeBtnText: { color: "#94a3c8", fontSize: 15, fontWeight: "600" },
});
