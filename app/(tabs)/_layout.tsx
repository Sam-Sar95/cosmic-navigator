import { Tabs } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Platform, View, Text, StyleSheet } from "react-native";
import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";

function TabIcon({ icon, label, focused }: { icon: string; label: string; focused: boolean }) {
  return (
    <View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive]}>
      <Text style={[tabStyles.iconEmoji]}>{icon}</Text>
      <Text style={[tabStyles.iconLabel, focused && tabStyles.iconLabelActive]}>{label}</Text>
    </View>
  );
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const bottomPadding = Platform.OS === "web" ? 12 : Math.max(insets.bottom, 8);
  const tabBarHeight = 60 + bottomPadding;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarButton: HapticTab,
        tabBarStyle: {
          paddingTop: 6,
          paddingBottom: bottomPadding,
          height: tabBarHeight,
          backgroundColor: "#0d1128",
          borderTopColor: "#2e3a5c",
          borderTopWidth: 1,
        },
        tabBarActiveTintColor: "#a78bfa",
        tabBarInactiveTintColor: "#4a5568",
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
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 2,
  },
  iconWrapActive: {
    backgroundColor: "#7c3aed22",
  },
  iconEmoji: { fontSize: 20 },
  iconLabel: { fontSize: 9, color: "#4a5568", fontWeight: "600" },
  iconLabelActive: { color: "#a78bfa" },
});
