import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import {
  Animated,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getSavedThemes } from "@/lib/astral-store";
import type { SavedTheme } from "@/lib/astral-store";

const ZODIAC_EMOJIS: Record<string, string> = {
  "Ariete": "♈", "Toro": "♉", "Gemelli": "♊", "Cancro": "♋",
  "Leone": "♌", "Vergine": "♍", "Bilancia": "♎", "Scorpione": "♏",
  "Sagittario": "♐", "Capricorno": "♑", "Acquario": "♒", "Pesci": "♓",
};

function ThemeCard({ theme, onPress }: { theme: SavedTheme; onPress: () => void }) {
  const sun = theme.astrologicalData.sun;
  const moon = theme.astrologicalData.moon;
  const asc = theme.astrologicalData.ascendant;
  const date = new Date(theme.createdAt);

  return (
    <TouchableOpacity style={cardStyles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={cardStyles.header}>
        <View style={cardStyles.iconCircle}>
          <Text style={cardStyles.iconText}>🌟</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={cardStyles.name}>{theme.name}</Text>
          <Text style={cardStyles.date}>
            {theme.birthData.day}/{theme.birthData.month}/{theme.birthData.year} · {theme.birthData.placeName}
          </Text>
        </View>
        <Text style={cardStyles.chevron}>›</Text>
      </View>
      <View style={cardStyles.tripleRow}>
        <View style={cardStyles.tripleItem}>
          <Text style={cardStyles.tripleLabel}>☉ Sole</Text>
          <Text style={cardStyles.tripleValue}>{ZODIAC_EMOJIS[sun.sign] ?? ""} {sun.sign}</Text>
        </View>
        <View style={cardStyles.tripleItem}>
          <Text style={cardStyles.tripleLabel}>☽ Luna</Text>
          <Text style={cardStyles.tripleValue}>{ZODIAC_EMOJIS[moon.sign] ?? ""} {moon.sign}</Text>
        </View>
        <View style={cardStyles.tripleItem}>
          <Text style={cardStyles.tripleLabel}>AC Asc.</Text>
          <Text style={cardStyles.tripleValue}>{ZODIAC_EMOJIS[asc.sign] ?? ""} {asc.sign}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

export default function HomeScreen() {
  const router = useRouter();
  const [themes, setThemes] = useState<SavedTheme[]>([]);
  const [greeting, setGreeting] = useState("");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    // Controlla onboarding
    AsyncStorage.getItem("onboarding_done").then((done) => {
      if (!done) router.replace("/onboarding");
    });

    // Carica temi
    getSavedThemes().then(setThemes);

    // Saluto in base all'ora
    const h = new Date().getHours();
    if (h < 12) setGreeting("Buongiorno");
    else if (h < 18) setGreeting("Buon pomeriggio");
    else setGreeting("Buona sera");

    // Animazione entrata
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  // Ricarica temi quando la schermata torna in focus
  useEffect(() => {
    const interval = setInterval(() => {
      getSavedThemes().then(setThemes);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <FlatList
          data={themes}
          keyExtractor={(t) => t.id}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <View>
              {/* Header */}
              <View style={styles.topBar}>
                <View>
                  <Text style={styles.greeting}>{greeting} ✦</Text>
                  <Text style={styles.appName}>Cosmic Navigator</Text>
                </View>
                <Image
                  source={require("@/assets/images/icon.png")}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>

              {/* Hero Card */}
              <View style={styles.heroCard}>
                <Text style={styles.heroEmoji}>🪐</Text>
                <Text style={styles.heroTitle}>Il Tuo Universo Astrale</Text>
                <Text style={styles.heroText}>
                  Calcola il tuo tema astrale, scopri le posizioni planetarie al momento della tua nascita e ricevi interpretazioni personalizzate con l'AI.
                </Text>
                <TouchableOpacity
                  style={styles.heroBtn}
                  onPress={() => router.push("/birth-input")}
                  activeOpacity={0.85}
                >
                  <Text style={styles.heroBtnText}>✦ Crea Tema Astrale</Text>
                </TouchableOpacity>
              </View>

              {/* Quick Actions */}
              <View style={styles.quickRow}>
                <TouchableOpacity
                  style={styles.quickCard}
                  onPress={() => router.push("/compatibility" as any)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickIcon}>💫</Text>
                  <Text style={styles.quickLabel}>Compatibilità</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickCard}
                  onPress={() => router.push("/archive" as any)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickIcon}>📚</Text>
                  <Text style={styles.quickLabel}>Archivio</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.quickCard}
                  onPress={() => router.push("/profile" as any)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.quickIcon}>👤</Text>
                  <Text style={styles.quickLabel}>Profilo</Text>
                </TouchableOpacity>
              </View>

              {themes.length > 0 && (
                <Text style={styles.sectionTitle}>I tuoi temi recenti</Text>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <ThemeCard
              theme={item}
              onPress={() =>
                router.push({
                  pathname: "/astral-theme" as any,
                  params: { themeId: item.id },
                })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>✨</Text>
              <Text style={styles.emptyTitle}>Nessun tema salvato</Text>
              <Text style={styles.emptyText}>
                Crea il tuo primo tema astrale inserendo i dati di nascita.
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push("/birth-input")}
                activeOpacity={0.85}
              >
                <Text style={styles.emptyBtnText}>Inizia ora</Text>
              </TouchableOpacity>
            </View>
          }
        />
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#07091a" },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  topBar: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between", marginBottom: 16,
  },
  greeting: { color: "#94a3c8", fontSize: 14 },
  appName: { color: "#f0f4ff", fontSize: 24, fontWeight: "800", letterSpacing: 0.5 },
  logo: { width: 48, height: 48, borderRadius: 12 },
  heroCard: {
    backgroundColor: "#141830",
    borderRadius: 20,
    padding: 22,
    borderWidth: 1,
    borderColor: "#7c3aed44",
    alignItems: "center",
    gap: 10,
    marginBottom: 4,
  },
  heroEmoji: { fontSize: 48 },
  heroTitle: { color: "#f0f4ff", fontSize: 20, fontWeight: "800", textAlign: "center" },
  heroText: { color: "#94a3c8", fontSize: 14, textAlign: "center", lineHeight: 20 },
  heroBtn: {
    backgroundColor: "#7c3aed",
    borderRadius: 14,
    paddingVertical: 13,
    paddingHorizontal: 28,
    marginTop: 4,
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  heroBtnText: { color: "#ffffff", fontSize: 16, fontWeight: "700" },
  quickRow: { flexDirection: "row", gap: 10 },
  quickCard: {
    flex: 1, backgroundColor: "#141830", borderRadius: 16,
    padding: 14, alignItems: "center", gap: 8,
    borderWidth: 1, borderColor: "#2e3a5c",
  },
  quickIcon: { fontSize: 26 },
  quickLabel: { color: "#f0f4ff", fontSize: 12, fontWeight: "600", textAlign: "center" },
  sectionTitle: { color: "#f0f4ff", fontSize: 16, fontWeight: "700", marginTop: 8 },
  emptyCard: {
    backgroundColor: "#141830", borderRadius: 20, padding: 28,
    alignItems: "center", gap: 10, borderWidth: 1, borderColor: "#2e3a5c",
    marginTop: 8,
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: "#f0f4ff", fontSize: 18, fontWeight: "700" },
  emptyText: { color: "#94a3c8", fontSize: 14, textAlign: "center", lineHeight: 20 },
  emptyBtn: {
    backgroundColor: "#7c3aed", borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 24, marginTop: 4,
  },
  emptyBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
});

const cardStyles = StyleSheet.create({
  card: {
    backgroundColor: "#141830", borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: "#2e3a5c", gap: 12,
  },
  header: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#7c3aed22", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#7c3aed44",
  },
  iconText: { fontSize: 22 },
  name: { color: "#f0f4ff", fontSize: 16, fontWeight: "700" },
  date: { color: "#94a3c8", fontSize: 12, marginTop: 2 },
  chevron: { color: "#4a5568", fontSize: 22 },
  tripleRow: { flexDirection: "row", gap: 8 },
  tripleItem: {
    flex: 1, backgroundColor: "#1a1f3a", borderRadius: 10,
    padding: 10, alignItems: "center", gap: 4,
  },
  tripleLabel: { color: "#94a3c8", fontSize: 11, fontWeight: "600" },
  tripleValue: { color: "#f0f4ff", fontSize: 13, fontWeight: "700" },
});
