import React, { useState } from "react";
import { TextInput, View, Text, StyleSheet, TextInputProps, ViewStyle, Pressable } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  leftIcon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
}

export function Input({
  label,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  ...props
}: InputProps) {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.textSecondary }]}>{label}</Text>
      )}
      <View
        style={[
          styles.inputWrapper,
          {
            backgroundColor: theme.surfaceSecondary,
            borderColor: focused ? theme.primary : error ? theme.danger : theme.border,
            borderWidth: focused ? 1.5 : 1,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons name={leftIcon as any} size={18} color={theme.textTertiary} style={styles.leftIcon} />
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
      {error && (
        <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  leftIcon: { marginRight: 10 },
  rightIcon: { marginLeft: 10, padding: 2 },
  input: {
    fontSize: 15,
    margin: 0,
    padding: 0,
  },
  error: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
