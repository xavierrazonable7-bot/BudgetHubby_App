import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { useTheme } from "@/context/ThemeContext";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  padding?: number;
  elevation?: boolean;
}

export function Card({ children, style, padding = 16, elevation = true }: CardProps) {
  const { theme, isDark } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: theme.card,
          borderColor: theme.border,
          padding,
          ...(elevation && !isDark
            ? {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.06,
                shadowRadius: 8,
                elevation: 3,
              }
            : elevation && isDark
            ? {
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
                elevation: 3,
              }
            : {}),
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
    borderRadius: 16,
    borderWidth: 1,
  },
});
