import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  elevation?: boolean;
  gradient?: [string, string];
  accentColor?: string;
}

export function Card({ children, style, padding = 16, elevation = true, gradient, accentColor }: CardProps) {
  const { theme, isDark } = useTheme();

  const shadowStyle = elevation
    ? {
        shadowColor: accentColor ?? "#000",
        shadowOffset: { width: 3, height: 3 },
        shadowOpacity: isDark ? (accentColor ? 0.3 : 0.55) : 0.08,
        shadowRadius: 10,
        elevation: accentColor ? 6 : 4,
      }
    : {};

  if (gradient) {
    return (
      <LinearGradient
        colors={gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          {
            borderColor: accentColor ? accentColor + "22" : (isDark ? "rgba(255,255,255,0.05)" : theme.border),
            padding,
            ...shadowStyle,
          },
          style,
        ]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.surface,
          borderColor: accentColor ? accentColor + "18" : (isDark ? "rgba(255,255,255,0.05)" : theme.border),
          padding,
          ...shadowStyle,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 18,
    borderWidth: 1,
  },
});
