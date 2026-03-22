import React from "react";
import { Pressable, Text, StyleSheet, ActivityIndicator, ViewStyle, TextStyle, View } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
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
  leftIcon?: React.ReactNode;
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
  leftIcon,
}: ButtonProps) {
  const { theme, isDark } = useTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const getTextColor = (): string => {
    switch (variant) {
      case "outline": return theme.primary;
      case "ghost": return theme.textSecondary;
      default: return "#FFFFFF";
    }
  };

  const sizeMap = {
    sm: { py: 9, px: 18, radius: 12, fontSize: 13 },
    md: { py: 14, px: 22, radius: 14, fontSize: 15 },
    lg: { py: 18, px: 28, radius: 16, fontSize: 17 },
  };
  const sz = sizeMap[size];

  const baseStyle: ViewStyle = {
    paddingVertical: sz.py,
    paddingHorizontal: sz.px,
    borderRadius: sz.radius,
    ...(fullWidth ? { width: "100%" as any } : {}),
    ...(disabled || loading ? { opacity: 0.5 } : {}),
  };

  // Glow shadow for primary/danger/secondary
  const glowColor = variant === "danger" ? theme.danger : variant === "secondary" ? theme.secondary : theme.primary;

  if (variant === "primary" || variant === "secondary" || variant === "danger") {
    const gradStart = variant === "danger" ? "#C0394D" : variant === "secondary" ? "#5B21B6" : "#C0394D";
    const gradEnd = variant === "danger" ? "#E05A6D" : variant === "secondary" ? "#7C3AED" : "#E05A6D";

    // Override with passed style backgroundColor if provided
    const styleColor = (style as any)?.backgroundColor;
    const g1 = styleColor ? styleColor + "CC" : gradStart;
    const g2 = styleColor ? styleColor : gradEnd;

    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          { opacity: pressed ? 0.88 : 1, transform: [{ scale: pressed ? 0.985 : 1 }] },
          fullWidth && { width: "100%" as any },
        ]}
      >
        <LinearGradient
          colors={[g1, g2]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.button,
            baseStyle,
            {
              shadowColor: g2,
              shadowOffset: { width: 0, height: 5 },
              shadowOpacity: 0.45,
              shadowRadius: 14,
              elevation: 8,
            },
            style,
            { backgroundColor: undefined },
          ]}
        >
          {loading ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              {leftIcon}
              <Text style={[styles.text, { color: "#fff", fontSize: sz.fontSize }, textStyle]}>{title}</Text>
            </>
          )}
        </LinearGradient>
      </Pressable>
    );
  }

  return (
    <Pressable
      onPress={handlePress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.button,
        baseStyle,
        variant === "outline" && { borderWidth: 1.5, borderColor: theme.primary, backgroundColor: "transparent" },
        variant === "ghost" && { backgroundColor: "transparent" },
        pressed && styles.pressed,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {leftIcon}
          <Text style={[styles.text, { color: getTextColor(), fontSize: sz.fontSize }, textStyle]}>{title}</Text>
        </>
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
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  text: {
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
});
