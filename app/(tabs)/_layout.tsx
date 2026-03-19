import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View, Text, StyleSheet } from "react-native";
import { HapticTab } from "@/components/haptic-tab";

// Icone SVG custom per la tab bar - più nitide degli emoji
const TAB_ICONS: Record<string, { active: string; inactive: string }> = {
  home:    { active: "🏠", inactive: "🏠" },
  tema:    { active: "🪐", inactive: "🪐" },
  archive: { active: "📚", inactive: "📚" },
  compat:  { active: "💫", inactive: "💫" },
  profile: { active: "👤", inactive: "👤" },
};

function TabIcon({
  icon,
  label,
  focused,
}: {
  icon: string;
  label: string;
  focused: boolean;
}) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      {/* Indicatore attivo in cima */}
      {focused && <View style={tabStyles.activeBar} />}
      <Text style={tabStyles.iconEmoji}>{icon}</Text>
      <Text
        style={[tabStyles.iconLabel, focused && tabStyles.iconLabelActive]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 14 : Math.max(insets.bottom, 10);
  const tabBarHeight = 72 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 0,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: "#0a0c1e",
          borderTopColor: "#7c3aed55",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#c4b5fd",
        tabBarInactiveTintColor: "#6b7280",
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="new-theme"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🪐" label="Tema" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="archive"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📚" label="Archivio" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="compatibility"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="💫" label="Compat." focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" label="Profilo" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    width: 64,
    paddingTop: 10,
    paddingBottom: 6,
    paddingHorizontal: 4,
    borderRadius: 14,
    gap: 4,
    position: "relative",
  },
  iconWrapActive: {
    backgroundColor: "#7c3aed28",
  },
  activeBar: {
    position: "absolute",
    top: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#a78bfa",
  },
  iconEmoji: {
    fontSize: 26,
    lineHeight: 32,
  },
  iconLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
    letterSpacing: 0.2,
    textAlign: "center",
  },
  iconLabelActive: {
    color: "#c4b5fd",
    fontWeight: "700",
  },
});
