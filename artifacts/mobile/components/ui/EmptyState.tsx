import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  const { theme, isDark } = useTheme();
  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ["rgba(255,255,255,0.05)", "rgba(255,255,255,0.02)"] : ["rgba(0,0,0,0.04)", "rgba(0,0,0,0.02)"]}
        style={[
          styles.iconCircle,
          {
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
          },
        ]}
      >
        <Ionicons name={icon as any} size={34} color={theme.textTertiary} />
      </LinearGradient>
      <Text style={[styles.title, { color: theme.text }]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, { color: theme.textTertiary }]}>{subtitle}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    gap: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    maxWidth: 220,
    lineHeight: 20,
  },
});
