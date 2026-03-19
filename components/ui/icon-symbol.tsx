import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolViewProps, SymbolWeight } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, StyleProp, TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

const MAPPING = {
  // navigazione
  "house.fill":                              "home",
  "paperplane.fill":                         "send",
  "chevron.left.forwardslash.chevron.right": "code",
  "chevron.right":                           "chevron-right",
  "chevron.left":                            "chevron-left",
  "chevron.down":                            "expand-more",
  "chevron.up":                              "expand-less",
  // cosmic navigator
  "star.fill":                               "star",
  "moon.fill":                               "nightlight-round",
  "sun.max.fill":                            "wb-sunny",
  "sparkles":                                "auto-awesome",
  "person.fill":                             "person",
  "person.2.fill":                           "people",
  "heart.fill":                              "favorite",
  "bookmark.fill":                           "bookmark",
  "trash.fill":                              "delete",
  "plus":                                    "add",
  "xmark":                                   "close",
  "arrow.left":                              "arrow-back",
  "arrow.right":                             "arrow-forward",
  "gear":                                    "settings",
  "bell.fill":                               "notifications",
  "magnifyingglass":                         "search",
  "info.circle.fill":                        "info",
  "checkmark.circle.fill":                   "check-circle",
  "exclamationmark.circle.fill":             "error",
  "lock.fill":                               "lock",
  "envelope.fill":                           "email",
  "globe":                                   "language",
  "calendar":                                "calendar-today",
  "clock.fill":                              "access-time",
  "location.fill":                           "location-on",
  "wand.and.stars":                          "auto-fix-high",
  "chart.bar.fill":                          "bar-chart",
  "list.bullet":                             "list",
  "square.grid.2x2.fill":                    "grid-view",
} as IconMapping;

export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name] ?? "help-outline"}
      style={style}
    />
  );
}
