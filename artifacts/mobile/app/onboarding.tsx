import React, { useState, useRef } from "react";
import {
  View, Text, StyleSheet, Pressable,
  ScrollView, Dimensions, TextInput,
  Platform, KeyboardAvoidingView, Animated,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";

const { width: W } = Dimensions.get("window");

// ─── Slide data ───────────────────────────────────────────────────────────────
const SLIDES = [
  {
    icon:     "grid-outline" as const,
    color:    "#6366F1",
    bg:       ["#10113A", "#0D0E2E"] as [string, string],
    lightBg:  ["#F0F0FF", "#EAEEFF"] as [string, string],
    title:    "Organize Your Life",
    subtitle: "Track tasks, events, and notes in one place — everything you need, always at hand.",
  },
  {
    icon:     "wallet-outline" as const,
    color:    "#2DD4BF",
    bg:       ["#0A2020", "#0C2828"] as [string, string],
    lightBg:  ["#E8FFFE", "#F0FFFD"] as [string, string],
    title:    "Manage Your Money",
    subtitle: "Monitor transactions, wallets, and financial activity with clear visual insights.",
  },
  {
    icon:     "timer-outline" as const,
    color:    "#F59E0B",
    bg:       ["#1C1400", "#221A00"] as [string, string],
    lightBg:  ["#FFFBEB", "#FFF8DD"] as [string, string],
    title:    "Stay Productive",
    subtitle: "Plan your day, run a Pomodoro study session, and crush your goals.",
  },
  {
    icon:     "sparkles-outline" as const,
    color:    "#E05A6D",
    bg:       ["#1A0810", "#22101A"] as [string, string],
    lightBg:  ["#FFF0F3", "#FFE8EC"] as [string, string],
    title:    "Everything in One App",
    subtitle: "Timpla helps you balance your daily life — study, plan, budget, achieve.",
  },
];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function OnboardingScreen() {
  const { theme, isDark } = useTheme();
  const { completeOnboarding } = useApp();
  const insets = useSafeAreaInsets();

  const scrollRef   = useRef<ScrollView>(null);
  const scrollX     = useRef(new Animated.Value(0)).current;
  const [index, setIndex]   = useState(0);
  const [name, setName]     = useState("");
  const [nameFocused, setNameFocused] = useState(false);
  const [nameError, setNameError]     = useState("");

  const isLast = index === SLIDES.length - 1;

  // ── Navigation helpers ───────────────────────────────────────────────────
  const goTo = (i: number) => {
    scrollRef.current?.scrollTo({ x: i * W, animated: true });
    setIndex(i);
    Haptics.selectionAsync();
  };
  const goNext = () => goTo(Math.min(index + 1, SLIDES.length - 1));
  const goLast = () => goTo(SLIDES.length - 1);

  const handleComplete = () => {
    if (!name.trim()) {
      setNameError("Please enter your name to continue");
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    completeOnboarding(name.trim());
    router.replace("/(tabs)");
  };

  // ── Backgrounds ─────────────────────────────────────────────────────────
  const bgGradient: [string, string, string] = isDark
    ? ["#0E0E0E", "#140810", "#0E0E0E"]
    : ["#F0F0F5", "#EDE8F5", "#F0F0F5"];

  return (
    <LinearGradient colors={bgGradient} style={{ flex: 1 }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <View style={[styles.root, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 20 }]}>

          {/* ── Slides ─────────────────────────────────────────────────── */}
          <Animated.ScrollView
            ref={scrollRef}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { x: scrollX } } }],
              {
                useNativeDriver: false,
                listener: (e: any) => {
                  const newIndex = Math.round(e.nativeEvent.contentOffset.x / W);
                  if (newIndex !== index) setIndex(newIndex);
                },
              }
            )}
            style={styles.scrollView}
          >
            {SLIDES.map((slide, i) => (
              <View key={i} style={[styles.slide, { width: W }]}>
                {/* Icon area */}
                <View style={styles.iconArea}>
                  {/* Outer glow rings */}
                  <LinearGradient
                    colors={isDark ? slide.bg : slide.lightBg}
                    style={[styles.outerRing, { borderColor: slide.color + "28" }]}
                  >
                    <View style={[styles.middleRing, { borderColor: slide.color + "40", backgroundColor: slide.color + "14" }]}>
                      <LinearGradient
                        colors={[slide.color + "30", slide.color + "18"]}
                        style={[styles.iconCircle, {
                          shadowColor: slide.color,
                          shadowOffset: { width: 0, height: 12 },
                          shadowOpacity: 0.45,
                          shadowRadius: 24,
                          elevation: 12,
                        }]}
                      >
                        <Ionicons name={slide.icon} size={54} color={slide.color} />
                      </LinearGradient>
                    </View>
                  </LinearGradient>
                </View>

                {/* Text */}
                <View style={styles.textArea}>
                  <Text style={[styles.slideTitle, { color: theme.text }]}>{slide.title}</Text>
                  <Text style={[styles.slideSubtitle, { color: theme.textSecondary }]}>{slide.subtitle}</Text>
                </View>

                {/* Name input — only on last slide */}
                {i === SLIDES.length - 1 && (
                  <View style={styles.nameArea}>
                    <Text style={[styles.nameLabel, { color: theme.textSecondary }]}>What should we call you?</Text>
                    <View
                      style={[
                        styles.inputWrapper,
                        {
                          backgroundColor: theme.surface,
                          borderColor: nameFocused
                            ? slide.color
                            : nameError
                            ? theme.danger
                            : isDark ? "rgba(255,255,255,0.08)" : theme.border,
                          borderWidth: nameFocused ? 2 : 1,
                          shadowColor: nameFocused ? slide.color : "#000",
                          shadowOpacity: nameFocused ? 0.25 : 0.08,
                          shadowOffset: { width: 0, height: nameFocused ? 0 : 2 },
                          shadowRadius: nameFocused ? 12 : 4,
                          elevation: nameFocused ? 4 : 1,
                        },
                      ]}
                    >
                      <Ionicons
                        name="person-outline"
                        size={20}
                        color={nameFocused ? slide.color : theme.textTertiary}
                      />
                      <TextInput
                        style={[styles.input, { color: theme.text }]}
                        value={name}
                        onChangeText={(t) => { setName(t); setNameError(""); }}
                        placeholder="Enter your name"
                        placeholderTextColor={theme.textTertiary}
                        returnKeyType="done"
                        onSubmitEditing={handleComplete}
                        onFocus={() => setNameFocused(true)}
                        onBlur={() => setNameFocused(false)}
                        maxLength={30}
                      />
                    </View>
                    {nameError ? (
                      <View style={styles.errorRow}>
                        <Ionicons name="alert-circle-outline" size={14} color={theme.danger} />
                        <Text style={[styles.errorText, { color: theme.danger }]}>{nameError}</Text>
                      </View>
                    ) : null}
                  </View>
                )}
              </View>
            ))}
          </Animated.ScrollView>

          {/* ── Dot Pagination ──────────────────────────────────────────── */}
          <View style={styles.dotsRow}>
            {SLIDES.map((slide, i) => {
              const inputRange = [(i - 1) * W, i * W, (i + 1) * W];
              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 24, 8],
                extrapolate: "clamp",
              });
              const dotOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.35, 1, 0.35],
                extrapolate: "clamp",
              });
              return (
                <Animated.View
                  key={i}
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity: dotOpacity,
                      backgroundColor: i === index ? SLIDES[index].color : (isDark ? "#4B5563" : "#D1D5DB"),
                    },
                  ]}
                />
              );
            })}
          </View>

          {/* ── Buttons ─────────────────────────────────────────────────── */}
          {isLast ? (
            /* Get Started */
            <Pressable onPress={handleComplete} style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}>
              <LinearGradient
                colors={["#C0394D", "#E05A6D"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.ctaBtn,
                  {
                    shadowColor: "#E05A6D",
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.45,
                    shadowRadius: 16,
                    elevation: 10,
                  },
                ]}
              >
                <Text style={styles.ctaBtnText}>Get Started</Text>
                <View style={styles.ctaArrow}>
                  <Ionicons name="arrow-forward" size={17} color="#E05A6D" />
                </View>
              </LinearGradient>
            </Pressable>
          ) : (
            /* Next + Skip row */
            <View style={styles.navRow}>
              <Pressable
                onPress={goLast}
                style={[styles.skipBtn, { borderColor: isDark ? "rgba(255,255,255,0.1)" : theme.border }]}
              >
                <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
              </Pressable>

              <Pressable onPress={goNext} style={({ pressed }) => [{ opacity: pressed ? 0.88 : 1 }]}>
                <LinearGradient
                  colors={[SLIDES[index].color + "EE", SLIDES[index].color]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={[
                    styles.nextBtn,
                    {
                      shadowColor: SLIDES[index].color,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.4,
                      shadowRadius: 14,
                      elevation: 8,
                    },
                  ]}
                >
                  <Text style={styles.nextBtnText}>Next</Text>
                  <Ionicons name="arrow-forward" size={16} color="#fff" />
                </LinearGradient>
              </Pressable>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 0,
  },
  scrollView: {
    flex: 1,
    width: W,
  },
  slide: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 24,
    gap: 28,
  },

  /* Icon */
  iconArea: { alignItems: "center", justifyContent: "center" },
  outerRing: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  middleRing: {
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center",
    justifyContent: "center",
  },

  /* Text */
  textArea: { alignItems: "center", gap: 12 },
  slideTitle: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.5,
    textAlign: "center",
  },
  slideSubtitle: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 24,
    maxWidth: 300,
  },

  /* Name input */
  nameArea: { width: "100%", gap: 10 },
  nameLabel: { fontSize: 14, fontFamily: "Inter_500Medium", textAlign: "center" },
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
    fontFamily: "Inter_600SemiBold",
    padding: 0,
  },
  errorRow: { flexDirection: "row", alignItems: "center", gap: 5 },
  errorText: { fontSize: 13, fontFamily: "Inter_400Regular" },

  /* Dots */
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginVertical: 20,
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },

  /* CTA */
  ctaBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 17,
    paddingHorizontal: 36,
    borderRadius: 18,
    gap: 10,
    minWidth: W - 64,
  },
  ctaBtnText: { color: "#fff", fontSize: 17, fontFamily: "Inter_700Bold" },
  ctaArrow: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },

  /* Nav row */
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 16,
    width: W - 64,
  },
  skipBtn: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 1,
  },
  skipText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  nextBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    gap: 8,
  },
  nextBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_700Bold" },
});
