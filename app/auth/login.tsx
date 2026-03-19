import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { startOAuthLogin } from "@/constants/oauth";
import { useAuth } from "@/hooks/use-auth";

export default function LoginScreen() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(40)).current;

  useEffect(() => {
    if (isAuthenticated) {
      router.replace("/(tabs)/profile");
      return;
    }
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, [isAuthenticated]);

  const handleLogin = () => {
    startOAuthLogin();
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom", "left", "right"]}>
      {/* Stelle decorative */}
      <Text style={[styles.star, { top: "8%", left: "10%", opacity: 0.6 }]}>✦</Text>
      <Text style={[styles.star, { top: "12%", right: "14%", opacity: 0.4 }]}>✧</Text>
      <Text style={[styles.star, { top: "35%", left: "6%", opacity: 0.5 }]}>✦</Text>
      <Text style={[styles.star, { bottom: "25%", right: "8%", opacity: 0.6 }]}>✧</Text>

      {/* Back button */}
      <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
        <Text style={styles.backText}>← Indietro</Text>
      </TouchableOpacity>

      <Animated.View
        style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}
      >
        {/* Logo */}
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />

        {/* Titolo */}
        <Text style={styles.title}>Accedi a{"\n"}Cosmic Navigator</Text>
        <Text style={styles.subtitle}>
          Salva i tuoi temi astrali nel cloud e accedili da qualsiasi dispositivo.
        </Text>

        {/* Benefici */}
        <View style={styles.benefitsCard}>
          {[
            { icon: "☁️", text: "Sincronizzazione cloud dei temi" },
            { icon: "📱", text: "Accesso da tutti i dispositivi" },
            { icon: "🔒", text: "Dati sicuri e privati" },
            { icon: "✨", text: "Interpretazioni AI illimitate" },
          ].map((b) => (
            <View key={b.text} style={styles.benefitRow}>
              <Text style={styles.benefitIcon}>{b.icon}</Text>
              <Text style={styles.benefitText}>{b.text}</Text>
            </View>
          ))}
        </View>

        {/* Login button */}
        <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} activeOpacity={0.85}>
          <Text style={styles.loginBtnText}>🚀 Accedi con Manus</Text>
        </TouchableOpacity>

        <Text style={styles.disclaimer}>
          Accedendo accetti i termini di servizio. I tuoi dati sono al sicuro.
        </Text>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07091a",
  },
  star: {
    position: "absolute",
    color: "#a78bfa",
    fontSize: 18,
  },
  backBtn: {
    position: "absolute",
    top: 60,
    left: 20,
    zIndex: 10,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  backText: { color: "#a78bfa", fontSize: 15, fontWeight: "600" },
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 20,
  },
  logo: { width: 100, height: 100, borderRadius: 22 },
  title: {
    fontSize: 30,
    fontWeight: "800",
    color: "#f0f4ff",
    textAlign: "center",
    letterSpacing: 0.5,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 15,
    color: "#94a3c8",
    textAlign: "center",
    lineHeight: 22,
  },
  benefitsCard: {
    width: "100%",
    backgroundColor: "#141830",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#2e3a5c",
    gap: 12,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  benefitIcon: { fontSize: 20 },
  benefitText: { color: "#f0f4ff", fontSize: 14, fontWeight: "500" },
  loginBtn: {
    width: "100%",
    backgroundColor: "#7c3aed",
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center",
    shadowColor: "#7c3aed",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  loginBtnText: { color: "#ffffff", fontSize: 17, fontWeight: "700" },
  disclaimer: {
    fontSize: 11,
    color: "#4a5568",
    textAlign: "center",
    lineHeight: 16,
  },
});
