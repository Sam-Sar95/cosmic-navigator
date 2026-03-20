/**
 * Tab "Tema" — Bussola Quotidiana
 *
 * Mostra il Profilo Personale dell'utente (ID: user_me) con:
 * - Triade natale (Sole, Luna, Ascendente)
 * - Sezione "Energia del Giorno" generata dall'IA
 * - Chat "Chiedi all'Astrologo IA"
 *
 * Se il Profilo Personale non esiste ancora, invita a crearlo.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
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
import { useFocusEffect, useRouter } from "expo-router";
import { getPersonalProfile } from "@/lib/astral-store";
import type { SavedTheme } from "@/lib/astral-store";
import { trpc } from "@/lib/trpc";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const ZODIAC_EMOJI: Record<string, string> = {
  Ariete: "♈", Toro: "♉", Gemelli: "♊", Cancro: "♋",
  Leone: "♌", Vergine: "♍", Bilancia: "♎", Scorpione: "♏",
  Sagittario: "♐", Capricorno: "♑", Acquario: "♒", Pesci: "♓",
};

const MONTHS_IT = [
  "gennaio","febbraio","marzo","aprile","maggio","giugno",
  "luglio","agosto","settembre","ottobre","novembre","dicembre",
];

function todayLabel(): string {
  const d = new Date();
  return `${d.getDate()} ${MONTHS_IT[d.getMonth()]} ${d.getFullYear()}`;
}

interface ChatMessage {
  role: "user" | "ai";
  text: string;
}

// ─── Componente principale ────────────────────────────────────────────────────

export default function BussolaQuotidiana() {
  const router = useRouter();
  const [profile, setProfile] = useState<SavedTheme | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Energia del Giorno
  const [dailyText, setDailyText] = useState<string | null>(null);
  const [loadingDaily, setLoadingDaily] = useState(false);

  // Chat IA
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [question, setQuestion] = useState("");
  const [loadingChat, setLoadingChat] = useState(false);
  const chatListRef = useRef<FlatList>(null);

  const dailyMutation = trpc.gemini.dailyEnergy.useMutation();
  const askMutation = trpc.gemini.askAstrologer.useMutation();

  // Ricarica il profilo ogni volta che la tab diventa attiva
  useFocusEffect(
    useCallback(() => {
      let active = true;
      setLoadingProfile(true);
      getPersonalProfile().then((p) => {
        if (!active) return;
        setProfile(p);
        setLoadingProfile(false);
      });
      return () => { active = false; };
    }, [])
  );

  // Genera l'Energia del Giorno quando il profilo è disponibile
  useEffect(() => {
    if (!profile || dailyText) return;
    const sun = profile.astrologicalData?.sun?.sign ?? "";
    const moon = profile.astrologicalData?.moon?.sign ?? "";
    const asc = profile.astrologicalData?.ascendant?.sign ?? "";
    if (!sun) return;

    setLoadingDaily(true);
    dailyMutation.mutateAsync({
      sunSign: sun,
      moonSign: moon,
      ascendantSign: asc,
      todayDate: todayLabel(),
    }).then((text) => {
      setDailyText(text);
      setLoadingDaily(false);
    }).catch(() => {
      setDailyText("Le stelle sono momentaneamente silenziose. Riprova tra poco.");
      setLoadingDaily(false);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile]);

  const handleAsk = async () => {
    const q = question.trim();
    if (!q || !profile) return;
    setQuestion("");
    const userMsg: ChatMessage = { role: "user", text: q };
    setChatMessages((prev) => [...prev, userMsg]);
    setLoadingChat(true);

    try {
      const ad = profile.astrologicalData;
      const answer = await askMutation.mutateAsync({
        question: q,
        sunSign: ad?.sun?.sign ?? "",
        moonSign: ad?.moon?.sign ?? "",
        ascendantSign: ad?.ascendant?.sign ?? "",
        venusSign: ad?.venus?.sign ?? "",
        marsSign: ad?.mars?.sign ?? "",
      });
      setChatMessages((prev) => [...prev, { role: "ai", text: answer }]);
    } catch (e: any) {
      setChatMessages((prev) => [
        ...prev,
        { role: "ai", text: "Non riesco a rispondere in questo momento. Riprova tra poco." },
      ]);
    } finally {
      setLoadingChat(false);
      setTimeout(() => chatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  // ─── Schermata: nessun profilo ─────────────────────────────────────────────

  if (loadingProfile) {
    return (
      <SafeAreaView style={s.container} edges={["top", "left", "right"]}>
        <View style={s.center}>
          <ActivityIndicator color="#a78bfa" size="large" />
        </View>
      </SafeAreaView>
    );
  }

  if (!profile) {
    return (
      <SafeAreaView style={s.container} edges={["top", "left", "right"]}>
        <View style={s.center}>
          <Text style={s.emptyIcon}>🪐</Text>
          <Text style={s.emptyTitle}>La tua Bussola è vuota</Text>
          <Text style={s.emptyDesc}>
            Crea il tuo Profilo Personale per ricevere l'Energia del Giorno e
            consultare l'Astrologo IA.
          </Text>
          <TouchableOpacity
            style={s.ctaBtn}
            onPress={() => router.push("/birth-input" as any)}
          >
            <Text style={s.ctaBtnText}>✨ Crea il mio Profilo</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Schermata: Bussola Quotidiana ─────────────────────────────────────────

  const ad = profile.astrologicalData;
  const sun = ad?.sun?.sign ?? "?";
  const moon = ad?.moon?.sign ?? "?";
  const asc = ad?.ascendant?.sign ?? "?";

  return (
    <SafeAreaView style={s.container} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            <Text style={s.headerSub}>La tua Bussola Quotidiana</Text>
            <Text style={s.headerTitle}>{profile.name}</Text>
            <Text style={s.headerDate}>📅 {todayLabel()}</Text>
          </View>

          {/* Triade natale */}
          <View style={s.triadRow}>
            {[
              { label: "☉ Sole", sign: sun },
              { label: "☽ Luna", sign: moon },
              { label: "AC Asc.", sign: asc },
            ].map(({ label, sign }) => (
              <View key={label} style={s.triadCard}>
                <Text style={s.triadEmoji}>{ZODIAC_EMOJI[sign] ?? "✦"}</Text>
                <Text style={s.triadSign}>{sign}</Text>
                <Text style={s.triadLabel}>{label}</Text>
              </View>
            ))}
          </View>

          {/* Energia del Giorno */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>⚡ Energia del Giorno</Text>
            {loadingDaily ? (
              <View style={s.loadingRow}>
                <ActivityIndicator color="#a78bfa" size="small" />
                <Text style={s.loadingText}>Le stelle stanno parlando…</Text>
              </View>
            ) : (
              <View style={s.dailyCard}>
                <Text style={s.dailyText}>{dailyText}</Text>
                <TouchableOpacity
                  style={s.refreshBtn}
                  onPress={() => {
                    setDailyText(null);
                  }}
                >
                  <Text style={s.refreshBtnText}>↺ Aggiorna</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Chat IA */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🔮 Chiedi all'Astrologo IA</Text>
            <Text style={s.sectionDesc}>
              Fai una domanda specifica sul tuo tema natale.
            </Text>

            {/* Messaggi chat */}
            {chatMessages.length > 0 && (
              <View style={s.chatBox}>
                {chatMessages.map((msg, i) => (
                  <View
                    key={i}
                    style={[
                      s.chatBubble,
                      msg.role === "user" ? s.chatBubbleUser : s.chatBubbleAI,
                    ]}
                  >
                    <Text
                      style={[
                        s.chatBubbleText,
                        msg.role === "user" ? s.chatBubbleTextUser : s.chatBubbleTextAI,
                      ]}
                    >
                      {msg.text}
                    </Text>
                  </View>
                ))}
                {loadingChat && (
                  <View style={[s.chatBubble, s.chatBubbleAI]}>
                    <ActivityIndicator color="#a78bfa" size="small" />
                  </View>
                )}
              </View>
            )}

            {/* Input domanda */}
            <View style={s.inputRow}>
              <TextInput
                style={s.chatInput}
                value={question}
                onChangeText={setQuestion}
                placeholder="Es. Come gestire l'amore con la Luna in Scorpione?"
                placeholderTextColor="#4a5568"
                multiline
                returnKeyType="send"
                onSubmitEditing={handleAsk}
              />
              <TouchableOpacity
                style={[s.sendBtn, (!question.trim() || loadingChat) && s.sendBtnDisabled]}
                onPress={handleAsk}
                disabled={!question.trim() || loadingChat}
              >
                <Text style={s.sendBtnText}>✦</Text>
              </TouchableOpacity>
            </View>

            {/* Domande suggerite */}
            {chatMessages.length === 0 && (
              <View style={s.suggestionsRow}>
                {[
                  "Qual è la mia missione di vita?",
                  "Come si manifesta il mio Ascendente?",
                  "Cosa mi dice Venere sull'amore?",
                ].map((s_) => (
                  <TouchableOpacity
                    key={s_}
                    style={s.suggestionChip}
                    onPress={() => setQuestion(s_)}
                  >
                    <Text style={s.suggestionChipText}>{s_}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Spazio in fondo */}
          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Stili ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#07091a" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, gap: 16 },
  scroll: { padding: 16, paddingBottom: 40 },

  // Empty state
  emptyIcon: { fontSize: 56 },
  emptyTitle: { color: "#f0f4ff", fontSize: 22, fontWeight: "800", textAlign: "center" },
  emptyDesc: { color: "#94a3c8", fontSize: 15, lineHeight: 22, textAlign: "center" },
  ctaBtn: {
    backgroundColor: "#7c3aed", borderRadius: 16, paddingVertical: 14,
    paddingHorizontal: 28, marginTop: 8,
  },
  ctaBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },

  // Header
  header: { marginBottom: 20, gap: 4 },
  headerSub: { color: "#a78bfa", fontSize: 13, fontWeight: "600", letterSpacing: 1.2, textTransform: "uppercase" },
  headerTitle: { color: "#f0f4ff", fontSize: 24, fontWeight: "800" },
  headerDate: { color: "#94a3c8", fontSize: 13 },

  // Triade natale
  triadRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  triadCard: {
    flex: 1, backgroundColor: "#141830", borderRadius: 14,
    padding: 14, alignItems: "center", gap: 4,
    borderWidth: 1, borderColor: "#2e3a5c",
  },
  triadEmoji: { fontSize: 26 },
  triadSign: { color: "#f0f4ff", fontSize: 13, fontWeight: "700", textAlign: "center" },
  triadLabel: { color: "#94a3c8", fontSize: 11 },

  // Sezioni
  section: { marginBottom: 20, gap: 10 },
  sectionTitle: { color: "#f0f4ff", fontSize: 17, fontWeight: "800" },
  sectionDesc: { color: "#94a3c8", fontSize: 13, lineHeight: 18, marginTop: -4 },

  // Energia del Giorno
  loadingRow: { flexDirection: "row", alignItems: "center", gap: 10, padding: 16 },
  loadingText: { color: "#94a3c8", fontSize: 14 },
  dailyCard: {
    backgroundColor: "#141830", borderRadius: 16, padding: 16,
    borderWidth: 1, borderColor: "#7c3aed44", gap: 12,
  },
  dailyText: { color: "#e2e8f0", fontSize: 14, lineHeight: 22 },
  refreshBtn: { alignSelf: "flex-end" },
  refreshBtnText: { color: "#a78bfa", fontSize: 13, fontWeight: "600" },

  // Chat
  chatBox: {
    backgroundColor: "#0d1128", borderRadius: 16, padding: 12,
    borderWidth: 1, borderColor: "#2e3a5c", gap: 8, marginBottom: 8,
  },
  chatBubble: {
    maxWidth: "85%", borderRadius: 14, padding: 12,
  },
  chatBubbleUser: {
    alignSelf: "flex-end", backgroundColor: "#7c3aed",
  },
  chatBubbleAI: {
    alignSelf: "flex-start", backgroundColor: "#1a1f3a",
    borderWidth: 1, borderColor: "#2e3a5c",
  },
  chatBubbleText: { fontSize: 14, lineHeight: 20 },
  chatBubbleTextUser: { color: "#fff" },
  chatBubbleTextAI: { color: "#e2e8f0" },

  // Input
  inputRow: { flexDirection: "row", gap: 8, alignItems: "flex-end" },
  chatInput: {
    flex: 1, backgroundColor: "#141830", borderRadius: 14,
    borderWidth: 1, borderColor: "#2e3a5c",
    color: "#f0f4ff", fontSize: 14, paddingHorizontal: 14,
    paddingVertical: 12, maxHeight: 100,
  },
  sendBtn: {
    width: 46, height: 46, borderRadius: 14,
    backgroundColor: "#7c3aed", alignItems: "center", justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#2e3a5c" },
  sendBtnText: { color: "#fff", fontSize: 20, fontWeight: "700" },

  // Suggerimenti
  suggestionsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  suggestionChip: {
    backgroundColor: "#141830", borderRadius: 20, paddingVertical: 8,
    paddingHorizontal: 12, borderWidth: 1, borderColor: "#2e3a5c",
  },
  suggestionChipText: { color: "#a78bfa", fontSize: 12 },
});
