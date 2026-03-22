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

const FEATURES = [
  { icon: "wallet-outline", text: "Track all your wallets", color: "#2DD4BF", grad: ["#0D2018", "#102A1E"] as [string, string] },
  { icon: "stats-chart-outline", text: "Visual spending insights", color: "#6366F1", grad: ["#0D102A", "#121630"] as [string, string] },
  { icon: "chatbubble-ellipses-outline", text: "AI budget assistant", color: "#F59E0B", grad: ["#1A1608", "#221C08"] as [string, string] },
];

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
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
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
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : "height"}>
        <View style={[styles.inner, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 40 }]}>

          {/* Hero */}
          <View style={styles.hero}>
            {/* Outer glow ring */}
            <View style={[styles.glowRing, { borderColor: "#E05A6D30" }]}>
              <LinearGradient
                colors={["#C0394D", "#E05A6D", "#8B1A2E"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[
                  styles.logoCircle,
                  {
                    shadowColor: "#E05A6D",
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.7,
                    shadowRadius: 20,
                    elevation: 12,
                  },
                ]}
              >
                <Ionicons name="wallet" size={38} color="#fff" />
              </LinearGradient>
            </View>
            <Text style={[styles.appName, { color: theme.text }]}>BudgetBuddy</Text>
            <Text style={[styles.tagline, { color: theme.textSecondary }]}>
              Smart budgeting for students & educators
            </Text>
            {/* Accent line */}
            <View style={styles.accentDivider}>
              <View style={[styles.accentLine, { backgroundColor: theme.border }]} />
              <View style={[styles.accentDot, { backgroundColor: "#E05A6D" }]} />
              <View style={[styles.accentLine, { backgroundColor: theme.border }]} />
            </View>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Text style={[styles.question, { color: theme.text }]}>What should we call you?</Text>
            <Text style={[styles.subtext, { color: theme.textSecondary }]}>
              We'll personalize your BudgetBuddy experience
            </Text>
            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: theme.surface,
                  borderColor: focused ? "#E05A6D" : error ? theme.danger : isDark ? "rgba(255,255,255,0.07)" : theme.border,
                  borderWidth: focused ? 2 : 1,
                  shadowColor: focused ? "#E05A6D" : "#000",
                  shadowOffset: { width: 0, height: focused ? 0 : 2 },
                  shadowOpacity: focused ? 0.25 : isDark ? 0.3 : 0.05,
                  shadowRadius: focused ? 12 : 4,
                  elevation: focused ? 4 : 1,
                },
              ]}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={focused ? "#E05A6D" : theme.textTertiary}
              />
              <TextInput
                style={[styles.input, { color: theme.text, fontFamily: "Inter_600SemiBold" }]}
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
              <View style={styles.errorRow}>
                <Ionicons name="alert-circle-outline" size={14} color={theme.danger} />
                <Text style={[styles.error, { color: theme.danger }]}>{error}</Text>
              </View>
            ) : null}
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            {/* Feature List */}
            <View style={styles.features}>
              {FEATURES.map((f, i) => (
                <LinearGradient
                  key={i}
                  colors={isDark ? f.grad : ["rgba(0,0,0,0.02)", "rgba(0,0,0,0.02)"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[styles.featureRow, { borderColor: f.color + "25", borderWidth: 1 }]}
                >
                  <View style={[styles.featureIcon, { backgroundColor: f.color + "20", borderWidth: 1, borderColor: f.color + "30" }]}>
                    <Ionicons name={f.icon as any} size={16} color={f.color} />
                  </View>
                  <Text style={[styles.featureText, { color: theme.textSecondary }]}>{f.text}</Text>
                  <Ionicons name="checkmark-circle" size={16} color={f.color} />
                </LinearGradient>
              ))}
            </View>

            {/* CTA Button */}
            <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
              <Pressable
                onPress={handleContinue}
                style={({ pressed }) => [{ opacity: pressed ? 0.9 : 1 }]}
              >
                <LinearGradient
                  colors={["#C0394D", "#E05A6D"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.button,
                    {
                      shadowColor: "#E05A6D",
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.5,
                      shadowRadius: 16,
                      elevation: 10,
                    },
                  ]}
                >
                  <Text style={styles.buttonText}>Get Started</Text>
                  <View style={styles.buttonArrow}>
                    <Ionicons name="arrow-forward" size={18} color="#E05A6D" />
                  </View>
                </LinearGradient>
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
    paddingHorizontal: 24,
    justifyContent: "space-between",
  },
  hero: { alignItems: "center", gap: 10 },
  glowRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  logoCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    alignItems: "center",
    justifyContent: "center",
  },
  appName: {
    fontSize: 34,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.8,
  },
  tagline: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 22,
  },
  accentDivider: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginTop: 4,
    width: 120,
  },
  accentLine: { flex: 1, height: 1 },
  accentDot: { width: 6, height: 6, borderRadius: 3 },
  form: { gap: 10 },
  question: { fontSize: 22, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  subtext: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 6, lineHeight: 20 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 17,
    padding: 0,
    margin: 0,
  },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  error: { fontSize: 13, fontFamily: "Inter_400Regular" },
  footer: { gap: 20 },
  features: { gap: 10 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  featureIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  featureText: { flex: 1, fontSize: 13, fontFamily: "Inter_500Medium" },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 18,
    paddingHorizontal: 28,
    borderRadius: 18,
    gap: 10,
  },
  buttonText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  buttonArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
});
