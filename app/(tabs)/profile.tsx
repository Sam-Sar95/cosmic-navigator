import { useRouter } from "expo-router";
import { useState } from "react";
import {
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useAuth } from "@/hooks/use-auth";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [notifications, setNotifications] = useState(false);

  const handleSignOut = async () => {
    Alert.alert("Logout", "Vuoi uscire dall'account?", [
      { text: "Annulla", style: "cancel" },
      {
        text: "Esci",
        style: "destructive",
          onPress: async () => {
            await logout();
          },
      },
    ]);
  };

  const handleClearData = () => {
    Alert.alert(
      "Cancella dati",
      "Vuoi eliminare tutti i temi salvati localmente? Questa azione è irreversibile.",
      [
        { text: "Annulla", style: "cancel" },
        {
          text: "Elimina tutto",
          style: "destructive",
          onPress: async () => {
            await AsyncStorage.removeItem("cosmic_navigator_themes");
            Alert.alert("Fatto", "Tutti i temi locali sono stati eliminati.");
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "left", "right"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>👤 Profilo</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View style={styles.avatarSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarEmoji}>🧑‍🚀</Text>
          </View>
          {user ? (
            <>
              <Text style={styles.userName}>{user.name ?? "Utente Cosmico"}</Text>
              <Text style={styles.userEmail}>{user.email}</Text>
            </>
          ) : (
            <>
              <Text style={styles.userName}>Ospite</Text>
              <Text style={styles.userEmail}>Accedi per sincronizzare i tuoi temi</Text>
            </>
          )}
        </View>

        {/* Login / Logout */}
        {!user ? (
          <View style={styles.authCard}>
            <Text style={styles.authTitle}>✦ Accedi a Cosmic Navigator</Text>
            <Text style={styles.authText}>
              Crea un account per salvare i tuoi temi nel cloud e accedervi da qualsiasi dispositivo.
            </Text>
            <TouchableOpacity
              style={styles.loginBtn}
              onPress={() => router.push("/auth/login" as any)}
              activeOpacity={0.85}
            >
              <Text style={styles.loginBtnText}>Accedi / Registrati</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.logoutBtn} onPress={handleSignOut} activeOpacity={0.8}>
            <Text style={styles.logoutBtnText}>🚪 Esci dall'account</Text>
          </TouchableOpacity>
        )}

        {/* Impostazioni */}
        <Text style={styles.sectionTitle}>Impostazioni</Text>

        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>🔔 Notifiche</Text>
              <Text style={styles.settingDesc}>Ricevi aggiornamenti cosmici</Text>
            </View>
            <Switch
              value={notifications}
              onValueChange={setNotifications}
              trackColor={{ false: "#2e3a5c", true: "#7c3aed" }}
              thumbColor={notifications ? "#f0f4ff" : "#94a3c8"}
            />
          </View>
        </View>

        {/* Info app */}
        <Text style={styles.sectionTitle}>Informazioni</Text>

        <View style={styles.infoCard}>
          {[
            { icon: "🪐", label: "Versione", value: "1.0.0" },
            { icon: "✨", label: "Motore astrologico", value: "Meeus Algorithms" },
            { icon: "🤖", label: "AI", value: "Google Gemini" },
            { icon: "📍", label: "Geocoding", value: "Nominatim / OpenStreetMap" },
          ].map((row) => (
            <View key={row.label} style={styles.infoRow}>
              <Text style={styles.infoIcon}>{row.icon}</Text>
              <Text style={styles.infoLabel}>{row.label}</Text>
              <Text style={styles.infoValue}>{row.value}</Text>
            </View>
          ))}
        </View>

        {/* Dati */}
        <Text style={styles.sectionTitle}>Gestione Dati</Text>
        <TouchableOpacity style={styles.dangerBtn} onPress={handleClearData} activeOpacity={0.8}>
          <Text style={styles.dangerBtnText}>🗑 Cancella tutti i temi locali</Text>
        </TouchableOpacity>

        {/* Credits */}
        <View style={styles.credits}>
          <Text style={styles.creditsText}>
            Cosmic Navigator · Creato con ❤️ e stelle
          </Text>
          <Text style={styles.creditsText}>
            I calcoli astrologici sono basati sugli algoritmi di Jean Meeus
          </Text>
        </View>
      </ScrollView>
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
  content: { padding: 16, paddingBottom: 60, gap: 12 },
  avatarSection: { alignItems: "center", paddingVertical: 20, gap: 8 },
  avatar: {
    width: 90, height: 90, borderRadius: 45,
    backgroundColor: "#141830", alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: "#7c3aed",
  },
  avatarEmoji: { fontSize: 44 },
  userName: { color: "#f0f4ff", fontSize: 20, fontWeight: "700" },
  userEmail: { color: "#94a3c8", fontSize: 14 },
  authCard: {
    backgroundColor: "#141830", borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: "#7c3aed44", gap: 10,
  },
  authTitle: { color: "#f0f4ff", fontSize: 16, fontWeight: "700" },
  authText: { color: "#94a3c8", fontSize: 14, lineHeight: 20 },
  loginBtn: {
    backgroundColor: "#7c3aed", borderRadius: 14,
    paddingVertical: 13, alignItems: "center", marginTop: 4,
  },
  loginBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  logoutBtn: {
    backgroundColor: "#1a1f3a", borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
    borderWidth: 1, borderColor: "#f87171",
  },
  logoutBtnText: { color: "#f87171", fontSize: 15, fontWeight: "600" },
  sectionTitle: { color: "#f0f4ff", fontSize: 15, fontWeight: "700", marginTop: 8 },
  settingsCard: {
    backgroundColor: "#141830", borderRadius: 16,
    borderWidth: 1, borderColor: "#2e3a5c", overflow: "hidden",
  },
  settingRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 14, gap: 12,
  },
  settingInfo: { flex: 1 },
  settingLabel: { color: "#f0f4ff", fontSize: 15, fontWeight: "600" },
  settingDesc: { color: "#94a3c8", fontSize: 12, marginTop: 2 },
  infoCard: {
    backgroundColor: "#141830", borderRadius: 16,
    borderWidth: 1, borderColor: "#2e3a5c", overflow: "hidden",
  },
  infoRow: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 13, gap: 10,
    borderBottomWidth: 1, borderBottomColor: "#2e3a5c",
  },
  infoIcon: { fontSize: 18 },
  infoLabel: { flex: 1, color: "#94a3c8", fontSize: 14 },
  infoValue: { color: "#f0f4ff", fontSize: 13, fontWeight: "600" },
  dangerBtn: {
    backgroundColor: "#1a1f3a", borderRadius: 14,
    paddingVertical: 14, alignItems: "center",
    borderWidth: 1, borderColor: "#f87171",
  },
  dangerBtnText: { color: "#f87171", fontSize: 14, fontWeight: "600" },
  credits: { alignItems: "center", gap: 4, paddingTop: 16 },
  creditsText: { color: "#4a5568", fontSize: 11, textAlign: "center" },
});
