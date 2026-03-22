import React, { useState } from "react";
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  ...props
}: InputProps) {
  const { theme, isDark } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: focused ? theme.primary : theme.textSecondary }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.surface,
            borderColor: focused
              ? theme.primary
              : error
              ? theme.danger
              : isDark
              ? "rgba(255,255,255,0.07)"
              : theme.border,
            borderWidth: focused ? 1.5 : 1,
            shadowColor: focused ? theme.primary : "#000",
            shadowOffset: { width: 0, height: focused ? 0 : 2 },
            shadowOpacity: focused ? 0.2 : isDark ? 0.3 : 0.04,
            shadowRadius: focused ? 8 : 4,
            elevation: focused ? 3 : 1,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon as any}
            size={18}
            color={focused ? theme.primary : theme.textTertiary}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[
            styles.input,
            {
              color: theme.text,
              fontFamily: "Inter_400Regular",
              flex: 1,
            },
          ]}
          placeholderTextColor={theme.textTertiary}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          {...props}
        />
        {rightIcon && (
          <Pressable onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon as any} size={18} color={theme.textTertiary} />
          </Pressable>
        )}
      </View>
      {error ? (
        <View style={styles.feedbackRow}>
          <Ionicons name="alert-circle-outline" size={13} color={theme.danger} />
          <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
        </View>
      ) : hint ? (
        <Text style={[styles.hint, { color: theme.textTertiary }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 2,
    letterSpacing: 0.1,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    minHeight: 50,
  },
  leftIcon: { marginRight: 10 },
  rightIcon: { marginLeft: 10, padding: 2 },
  input: {
    fontSize: 15,
    margin: 0,
    padding: 0,
  },
  feedbackRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  error: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  hint: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
