import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  Animated,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";

export default function OnboardingScreen() {
  const { theme, isDark } = useTheme();
  const { completeOnboarding } = useApp();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [focused, setFocused] = useState(false);
  const [error, setError] = useState("");
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleContinue = () => {
    if (!name.trim()) {
      setError("Please enter your name to continue");
      return;
    }
    setError("");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Animated.sequence([
      Animated.timing(scaleAnim, { toValue: 0.97, duration: 100, useNativeDriver: true }),
      Animated.timing(scaleAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(() => {
      completeOnboarding(name.trim());
      router.replace("/(tabs)");
    });
  };

  const bgGradient: [string, string, string] = isDark
    ? ["#0E0E0E", "#140810", "#0E0E0E"]
    : ["#F0F0F5", "#EDE8F5", "#F0F0F5"];

  return (
    <LinearGradient colors={bgGradient} style={styles.container}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
      <View style={[styles.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>
        <View style={styles.hero}>
          <View style={[styles.logoCircle, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="wallet" size={40} color={theme.primary} />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>BudgetBuddy</Text>
          <Text style={[styles.tagline, { color: theme.textSecondary }]}>
            Smart budgeting for students & educators
          </Text>
        </View>

        <View style={styles.form}>
          <Text style={[styles.question, { color: theme.text }]}>
            What should we call you?
          </Text>
          <Text style={[styles.subtext, { color: theme.textSecondary }]}>
            We'll personalize your experience
          </Text>

          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: theme.surfaceSecondary,
                borderColor: focused ? theme.primary : error ? theme.danger : theme.border,
                borderWidth: focused ? 2 : 1,
              },
            ]}
          >
            <Ionicons
              name="person-outline"
              size={20}
              color={focused ? theme.primary : theme.textTertiary}
              style={styles.inputIcon}
            />
            <TextInput
              style={[styles.input, { color: theme.text, fontFamily: "Inter_500Medium" }]}
              value={name}
              onChangeText={(t) => { setName(t); setError(""); }}
              placeholder="Enter your name"
              placeholderTextColor={theme.textTertiary}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleContinue}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              maxLength={30}
            />
          </View>
          {error ? (
            <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <View style={styles.features}>
            {[
              { icon: "wallet-outline", text: "Track all your wallets" },
              { icon: "stats-chart-outline", text: "Visual spending insights" },
              { icon: "chatbubble-ellipses-outline", text: "AI budget assistant" },
            ].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons name={f.icon as any} size={16} color={theme.primary} />
                </View>
                <Text style={[styles.featureText, { color: theme.textSecondary }]}>{f.text}</Text>
              </View>
            ))}
          </View>

          <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Pressable
              onPress={handleContinue}
              style={({ pressed }) => [
                styles.button,
                {
                  backgroundColor: theme.primary,
                  shadowColor: theme.primary,
                  opacity: pressed ? 0.9 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}
            >
              <Text style={styles.buttonText}>Get Started</Text>
              <Ionicons name="arrow-forward" size={20} color="#fff" />
            </Pressable>
          </Animated.View>
        </View>
      </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    paddingHorizontal: 28,
    justifyContent: "space-between",
  },
  hero: { alignItems: "center", gap: 12 },
  logoCircle: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  appName: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  form: { gap: 10 },
  question: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  subtext: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  inputIcon: {},
  input: {
    flex: 1,
    fontSize: 18,
    padding: 0,
    margin: 0,
  },
  error: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  footer: { gap: 24 },
  features: { gap: 12 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    borderRadius: 16,
    gap: 10,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
});
