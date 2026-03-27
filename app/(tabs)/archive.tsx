import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { deleteTheme, getSavedThemes } from "@/lib/astral-store";
import type { SavedTheme } from "@/lib/astral-store";

const ZODIAC_EMOJIS: Record<string, string> = {
  "Ariete": "♈", "Toro": "♉", "Gemelli": "♊", "Cancro": "♋",
  "Leone": "♌", "Vergine": "♍", "Bilancia": "♎", "Scorpione": "♏",
  "Sagittario": "♐", "Capricorno": "♑", "Acquario": "♒", "Pesci": "♓",
};

export default function ArchiveScreen() {
  const router = useRouter();
  const [themes, setThemes] = useState<SavedTheme[]>([]);

  const load = () => getSavedThemes().then(setThemes);

  useEffect(() => { load(); }, []);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Elimina tema",
      `Vuoi eliminare "${name}"?`,
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina",
          style: "destructive",
          onPress: async () => {
            await deleteTheme(id);
            load();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>📚 Archivio Temi</Text>
        <TouchableOpacity
          style={styles.addBtn}
          onPress={() => router.push("/birth-input")}
          activeOpacity={0.8}
        >
          <Text style={styles.addBtnText}>+ Nuovo</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={themes}
        keyExtractor={(t) => t.id}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => {
          const sun = item.astrologicalData.sun;
          const moon = item.astrologicalData.moon;
          const asc = item.astrologicalData.ascendant;
          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                router.push({ pathname: "/astral-theme" as any, params: { themeId: item.id } })
              }
              activeOpacity={0.8}
            >
              <View style={styles.cardHeader}>
                <View style={styles.iconCircle}>
                  <Text style={styles.iconText}>🌟</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.name}</Text>
                  <Text style={styles.cardDate}>
                    {item.birthData.day}/{item.birthData.month}/{item.birthData.year} · {item.birthData.placeName}
                  </Text>
                </View>
                <View style={styles.deleteBtnWrapper}>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={(e) => {
                      e.stopPropagation?.();
                      handleDelete(item.id, item.name);
                    }}
                    activeOpacity={0.6}
                  >
                    <Text style={styles.deleteText}>🗑</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <View style={styles.tripleRow}>
                <View style={styles.tripleItem}>
                  <Text style={styles.tripleLabel}>☉ Sole</Text>
                  <Text style={styles.tripleValue}>{ZODIAC_EMOJIS[sun.sign] ?? ""} {sun.sign}</Text>
                </View>
                <View style={styles.tripleItem}>
                  <Text style={styles.tripleLabel}>☽ Luna</Text>
                  <Text style={styles.tripleValue}>{ZODIAC_EMOJIS[moon.sign] ?? ""} {moon.sign}</Text>
                </View>
                <View style={styles.tripleItem}>
                  <Text style={styles.tripleLabel}>AC Asc.</Text>
                  <Text style={styles.tripleValue}>{ZODIAC_EMOJIS[asc.sign] ?? ""} {asc.sign}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>📭</Text>
            <Text style={styles.emptyTitle}>Nessun tema salvato</Text>
            <Text style={styles.emptyText}>Crea il tuo primo tema astrale.</Text>
            <TouchableOpacity
              style={styles.emptyBtn}
              onPress={() => router.push("/birth-input")}
            >
              <Text style={styles.emptyBtnText}>Crea tema</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#07091a" },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 16, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#2e3a5c",
  },
  headerTitle: { color: "#f0f4ff", fontSize: 20, fontWeight: "800" },
  addBtn: {
    backgroundColor: "#7c3aed", borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  addBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
  list: { padding: 16, paddingBottom: 40, gap: 12 },
  card: {
    backgroundColor: "#141830", borderRadius: 16,
    padding: 16, borderWidth: 1, borderColor: "#2e3a5c", gap: 12,
  },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: "#7c3aed22", alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#7c3aed44",
  },
  iconText: { fontSize: 22 },
  cardName: { color: "#f0f4ff", fontSize: 16, fontWeight: "700" },
  cardDate: { color: "#94a3c8", fontSize: 12, marginTop: 2 },
  deleteBtnWrapper: { zIndex: 10 },
  deleteBtn: {
    width: 36, height: 36, backgroundColor: "#1a1f3a",
    borderRadius: 10, alignItems: "center", justifyContent: "center",
    borderWidth: 1, borderColor: "#2e3a5c",
  },
  deleteText: { fontSize: 16 },
  tripleRow: { flexDirection: "row", gap: 8 },
  tripleItem: {
    flex: 1, backgroundColor: "#1a1f3a", borderRadius: 10,
    padding: 10, alignItems: "center", gap: 4,
  },
  tripleLabel: { color: "#94a3c8", fontSize: 11, fontWeight: "600" },
  tripleValue: { color: "#f0f4ff", fontSize: 13, fontWeight: "700" },
  empty: { alignItems: "center", paddingTop: 60, gap: 12 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { color: "#f0f4ff", fontSize: 18, fontWeight: "700" },
  emptyText: { color: "#94a3c8", fontSize: 14 },
  emptyBtn: {
    backgroundColor: "#7c3aed", borderRadius: 14,
    paddingVertical: 12, paddingHorizontal: 24, marginTop: 4,
  },
  emptyBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
});
