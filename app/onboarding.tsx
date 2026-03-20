import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import {
  Animated,
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";

const { width, height } = Dimensions.get("window");

export default function OnboardingScreen() {
  const router = useRouter();

  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale = useRef(new Animated.Value(0.7)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const titleY = useRef(new Animated.Value(30)).current;
  const subtitleOpacity = useRef(new Animated.Value(0)).current;
  const btnOpacity = useRef(new Animated.Value(0)).current;
  const star1 = useRef(new Animated.Value(0)).current;
  const star2 = useRef(new Animated.Value(0)).current;
  const star3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animazione stelle di sfondo
    Animated.loop(
      Animated.sequence([
        Animated.timing(star1, { toValue: 1, duration: 1800, useNativeDriver: true }),
        Animated.timing(star1, { toValue: 0.3, duration: 1800, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.delay(600),
        Animated.timing(star2, { toValue: 1, duration: 2200, useNativeDriver: true }),
        Animated.timing(star2, { toValue: 0.2, duration: 2200, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.delay(1100),
        Animated.timing(star3, { toValue: 1, duration: 1600, useNativeDriver: true }),
        Animated.timing(star3, { toValue: 0.4, duration: 1600, useNativeDriver: true }),
      ])
    ).start();

    // Sequenza animazione principale
    Animated.sequence([
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(logoOpacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.spring(logoScale, { toValue: 1, friction: 6, useNativeDriver: true }),
      ]),
      Animated.delay(200),
      Animated.parallel([
        Animated.timing(titleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
        Animated.timing(titleY, { toValue: 0, duration: 500, useNativeDriver: true }),
      ]),
      Animated.delay(150),
      Animated.timing(subtitleOpacity, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.delay(300),
      Animated.timing(btnOpacity, { toValue: 1, duration: 400, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleStart = async () => {
    await AsyncStorage.setItem("onboarding_done", "1");
    router.replace("/(tabs)");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom", "left", "right"]}>
      {/* Stelle decorative */}
      <Animated.Text style={[styles.starDeco, styles.star1, { opacity: star1 }]}>✦</Animated.Text>
      <Animated.Text style={[styles.starDeco, styles.star2, { opacity: star2 }]}>✧</Animated.Text>
      <Animated.Text style={[styles.starDeco, styles.star3, { opacity: star3 }]}>✦</Animated.Text>
      <Animated.Text style={[styles.starDeco, styles.star4, { opacity: star2 }]}>✧</Animated.Text>
      <Animated.Text style={[styles.starDeco, styles.star5, { opacity: star1 }]}>✦</Animated.Text>
      <Animated.Text style={[styles.starDeco, styles.star6, { opacity: star3 }]}>✧</Animated.Text>

      {/* Logo */}
      <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
        <Image
          source={require("@/assets/images/icon.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </Animated.View>

      {/* Titolo */}
      <Animated.View style={{ opacity: titleOpacity, transform: [{ translateY: titleY }] }}>
        <Text style={styles.title}>Cosmic Navigator</Text>
      </Animated.View>

      {/* Sottotitolo */}
      <Animated.View style={{ opacity: subtitleOpacity }}>
        <Text style={styles.subtitle}>Scopri il tuo tema astrale</Text>
        <Text style={styles.description}>
          Calcola le posizioni planetarie al momento della tua nascita e ottieni
          interpretazioni personalizzate con l'intelligenza cosmica.
        </Text>
      </Animated.View>

      {/* Features */}
      <Animated.View style={[styles.features, { opacity: subtitleOpacity }]}>
        {[
          { icon: "🪐", text: "Tema astrale completo" },
          { icon: "✨", text: "Interpretazioni AI avanzate" },
          { icon: "💫", text: "Compatibilità tra temi" },
        ].map((f) => (
          <View key={f.text} style={styles.featureRow}>
            <Text style={styles.featureIcon}>{f.icon}</Text>
            <Text style={styles.featureText}>{f.text}</Text>
          </View>
        ))}
      </Animated.View>

      {/* CTA */}
      <Animated.View style={{ opacity: btnOpacity, width: "100%" }}>
        <TouchableOpacity style={styles.btn} onPress={handleStart} activeOpacity={0.85}>
          <Text style={styles.btnText}>Inizia il viaggio ✦</Text>
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#07091a",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 28,
    gap: 20,
  },
  starDeco: { position: "absolute", color: "#a78bfa", fontSize: 20 },
  star1: { top: "10%", left: "8%" },
  star2: { top: "15%", right: "12%" },
  star3: { top: "30%", left: "5%" },
  star4: { top: "60%", right: "6%" },
  star5: { bottom: "20%", left: "10%" },
  star6: { bottom: "15%", right: "15%" },
  logo: { width: 140, height: 140, borderRadius: 28 },
  title: {
    fontSize: 34,
    fontWeight: "800",
    color: "#f0f4ff",
    textAlign: "center",
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 18,
    color: "#a78bfa",
    textAlign: "center",
    fontWeight: "600",
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    color: "#94a3c8",
    textAlign: "center",
    lineHeight: 22,
  },
  features: { width: "100%", gap: 10, marginTop: 4 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#141830",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#2e3a5c",
    gap: 12,
  },
  featureIcon: { fontSize: 22 },
  featureText: { fontSize: 15, color: "#f0f4ff", fontWeight: "500" },
  btn: {
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
  btnText: { color: "#ffffff", fontSize: 17, fontWeight: "700", letterSpacing: 0.5 },
});
