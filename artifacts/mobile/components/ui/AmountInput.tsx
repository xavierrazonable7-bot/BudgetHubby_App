import React, { useState } from "react";
import { View, Text, TextInput, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface AmountInputProps {
  value: string;
  onChangeText: (text: string) => void;
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  color?: string;
}

export function AmountInput({
  value,
  onChangeText,
  label,
  error,
  containerStyle,
  color,
}: AmountInputProps) {
  const { theme } = useTheme();
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
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      )}
      <View
        style={[
          styles.wrapper,
          {
            backgroundColor: theme.surfaceSecondary,
            borderColor: focused ? accentColor : error ? theme.danger : theme.border,
            borderWidth: focused ? 2 : 1,
          },
        ]}
      >
        <Text style={[styles.symbol, { color: focused ? accentColor : theme.textSecondary }]}>
          ₱
        </Text>
        <TextInput
          style={[styles.input, { color: theme.text, fontFamily: "Inter_700Bold" }]}
          value={value}
          onChangeText={handleChange}
          keyboardType="decimal-pad"
          placeholder="0.00"
          placeholderTextColor={theme.textTertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          maxLength={12}
        />
      </View>
      {error && <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 4,
  },
  symbol: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    marginRight: 4,
  },
  input: {
    fontSize: 36,
    flex: 1,
    padding: 0,
    margin: 0,
  },
  error: { fontSize: 12, fontFamily: "Inter_400Regular" },
});
