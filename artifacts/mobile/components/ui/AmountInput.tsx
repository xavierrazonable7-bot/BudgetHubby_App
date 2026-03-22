import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  color?: string;
}

export function AmountInput({ value, onChangeText, label, error, containerStyle, color }: AmountInputProps) {
  const { theme, isDark } = useTheme();
  const [focused, setFocused] = useState(false);
  const accentColor = color || theme.primary;

  const handleChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length > 2) return;
    if (parts[1] && parts[1].length > 2) return;
    onChangeText(cleaned);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: focused ? accentColor : theme.textSecondary }]}>{label}</Text>
      )}
      <View
        style={[
          styles.wrapper,
          {
            backgroundColor: theme.surface,
            borderColor: focused ? accentColor : error ? theme.danger : isDark ? "rgba(255,255,255,0.07)" : theme.border,
            borderWidth: focused ? 2 : 1,
            shadowColor: focused ? accentColor : "#000",
            shadowOffset: { width: 0, height: focused ? 0 : 2 },
            shadowOpacity: focused ? 0.25 : isDark ? 0.3 : 0.05,
            shadowRadius: focused ? 12 : 4,
            elevation: focused ? 4 : 1,
          },
        ]}
      >
        {/* Left accent bar */}
        <View style={[styles.accentBar, { backgroundColor: focused ? accentColor : "transparent" }]} />

        <Text style={[styles.symbol, { color: focused ? accentColor : theme.textTertiary }]}>₱</Text>
        <TextInput
          style={[styles.input, { color: value ? theme.text : theme.textTertiary, fontFamily: "Inter_700Bold" }]}
          value={value}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={theme.textTertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={12}
        />
        {value ? (
          <Text style={[styles.currency, { color: theme.textTertiary }]}>PHP</Text>
        ) : null}
      </View>
      {error && (
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
          <Text style={[styles.error, { color: theme.danger }]}>⚠ {error}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    paddingHorizontal: 20,
    paddingVertical: 20,
    gap: 6,
    overflow: "hidden",
  },
  accentBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    borderTopLeftRadius: 18,
    borderBottomLeftRadius: 18,
  },
  symbol: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    marginLeft: 8,
  },
  input: {
    fontSize: 42,
    flex: 1,
    padding: 0,
    margin: 0,
    letterSpacing: -1,
  },
  currency: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    alignSelf: "flex-end",
    paddingBottom: 6,
  },
  error: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
