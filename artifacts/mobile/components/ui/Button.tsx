import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle } from "react-native";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: "primary" | "secondary" | "outline" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  fullWidth?: boolean;
}

export function Button({
  title,
  onPress,
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  style,
  textStyle,
  fullWidth = false,
}: ButtonProps) {
  const { theme, isDark } = useTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getVariantStyle = (): ViewStyle => {
    switch (variant) {
      case "primary":
        return { backgroundColor: theme.primary };
      case "secondary":
        return { backgroundColor: theme.secondary };
      case "outline":
        return {
          backgroundColor: "transparent",
          borderWidth: 1.5,
          borderColor: theme.primary,
        };
      case "danger":
        return { backgroundColor: theme.danger };
      case "ghost":
        return { backgroundColor: "transparent" };
      default:
        return { backgroundColor: theme.primary };
    }
  };

  const getTextColor = (): string => {
    switch (variant) {
      case "outline":
        return theme.primary;
      case "ghost":
        return theme.textSecondary;
      default:
        return "#FFFFFF";
    }
  };

  const getSizeStyle = (): ViewStyle => {
    switch (size) {
      case "sm":
        return { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 };
      case "lg":
        return { paddingVertical: 18, paddingHorizontal: 24, borderRadius: 14 };
      default:
        return { paddingVertical: 14, paddingHorizontal: 20, borderRadius: 12 };
    }
  };

  const getFontSize = (): number => {
    switch (size) {
      case "sm":
        return 13;
      case "lg":
        return 17;
      default:
        return 15;
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        getVariantStyle(),
        getSizeStyle(),
        fullWidth && styles.fullWidth,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <Text
          style={[
            styles.text,
            { color: getTextColor(), fontSize: getFontSize() },
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  fullWidth: {
    width: "100%",
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
});
