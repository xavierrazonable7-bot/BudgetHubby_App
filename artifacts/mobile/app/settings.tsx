import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Platform, Alert, KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInDown, FadeIn, useSharedValue, useAnimatedStyle, withSpring,
} from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { useApp, CurrencyCode } from "@/context/AppContext";
import { CURRENCY_LIST } from "@/utils/format";

/* ═══════════════════════════════════════════════════════════════════════════
   Sub-components
═══════════════════════════════════════════════════════════════════════════ */

function SectionLabel({ label, delay = 0 }: { label: string; delay?: number }) {
  const { isDark } = useTheme();
  const color = isDark ? "#C8C8C8" : "#475569";
  return (
    <Animated.Text
      entering={FadeInDown.delay(delay).duration(300)}
      style={[styles.sectionLabel, { color }]}
    >
      {label}
    </Animated.Text>
  );
}

function Divider() {
  const { theme, isDark } = useTheme();
  return (
    <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]} />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Main Screen
═══════════════════════════════════════════════════════════════════════════ */
export default function SettingsScreen() {
  const { theme, isDark, colorScheme, setTheme } = useTheme();
  const { userName, setUserName, userCurrency, setUserCurrency, formatAmount, totalBalance } = useApp();
  const insets = useSafeAreaInsets();

  const [nameInput, setNameInput] = useState(userName);
  const [editingName, setEditingName] = useState(false);
  const [nameSaved, setNameSaved] = useState(false);

  /* Brighter sub-text that passes contrast on dark surfaces */
  const subText = isDark ? "#C8C8C8" : "#475569";
  const labelText = isDark ? "#E0E0E0" : "#1E293B";

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert("Invalid name", "Please enter a valid display name.");
      return;
    }
    setUserName(trimmed);
    setEditingName(false);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2500);
  };

  const handleCancelEdit = () => {
    setNameInput(userName);
    setEditingName(false);
  };

  const initials = (userName || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();
  const selectedCurrency = CURRENCY_LIST.find((c) => c.code === userCurrency)!;

  /* ── Theme options ── */
  const THEMES: { key: "light" | "dark"; label: string; desc: string; icon: string; accentColor: string; bgTop: string; bgBot: string }[] = [
    {
      key: "dark",  label: "Dark",  desc: "Easy on the eyes",
      icon: "moon",   accentColor: "#6366F1",
      bgTop: "#111", bgBot: "#1A1A2E",
    },
    {
      key: "light", label: "Light", desc: "Bright & clear",
      icon: "sunny",  accentColor: "#F59E0B",
      bgTop: "#F5F5F5", bgBot: "#E8E4F0",
    },
  ];

  return (
    <LinearGradient
      colors={isDark ? ["#0E0E0E", "#140810", "#0E0E0E"] : ["#F0F0F5", "#EDE8F5", "#F0F0F5"]}
      style={styles.container}
    >
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            paddingBottom: insets.bottom + 60,
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
          }}
        >

          {/* ════════════════════════════════════════
              HEADER
          ════════════════════════════════════════ */}
          <Animated.View entering={FadeInDown.duration(280)} style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [
                styles.backBtn,
                { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", opacity: pressed ? 0.6 : 1 },
              ]}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[styles.screenLabel, { color: subText }]}>Preferences</Text>
              <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
            </View>
          </Animated.View>

          {/* ════════════════════════════════════════
              PROFILE HERO CARD
          ════════════════════════════════════════ */}
          <Animated.View entering={FadeInDown.delay(50).duration(380)} style={styles.profileHeroWrap}>
            <LinearGradient
              colors={isDark ? ["#2A0D18", "#1A0A22", "#0E0E0E"] : ["#FFF0F2", "#F3EEFE", "#EDE8F5"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[styles.profileHero, {
                borderColor: isDark ? "rgba(224,90,109,0.18)" : "rgba(224,90,109,0.15)",
                shadowColor: "#E05A6D",
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isDark ? 0.3 : 0.12,
                shadowRadius: 20,
                elevation: 8,
              }]}
            >
              {/* Decorative blobs */}
              <View style={[styles.heroDeco1, { backgroundColor: "#E05A6D" }]} />
              <View style={[styles.heroDeco2, { backgroundColor: "#A78BFA" }]} />

              {/* Top row: avatar + name + edit button */}
              <View style={styles.heroTopRow}>
                <LinearGradient colors={["#C0394D", "#E05A6D", "#B03060"]} style={styles.heroAvatar}>
                  <Text style={styles.heroAvatarText}>{initials}</Text>
                </LinearGradient>

                <View style={styles.heroNameCol}>
                  <Text style={[styles.heroName, { color: theme.text }]} numberOfLines={1}>
                    {userName || "Set your name"}
                  </Text>
                  <View style={styles.heroBalanceChip}>
                    <Ionicons name="wallet-outline" size={12} color="#E05A6D" />
                    <Text style={[styles.heroBalance, { color: "#E05A6D" }]}>
                      {formatAmount(totalBalance)}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={() => setEditingName((v) => !v)}
                  style={({ pressed }) => [
                    styles.heroEditBtn,
                    {
                      backgroundColor: editingName ? "#E05A6D" : (isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.06)"),
                      opacity: pressed ? 0.7 : 1,
                    },
                  ]}
                >
                  <Ionicons
                    name={editingName ? "close" : "pencil"}
                    size={15}
                    color={editingName ? "#fff" : subText}
                  />
                </Pressable>
              </View>

              {/* Inline name editor */}
              {editingName && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.nameEditorWrap}>
                  <View style={[styles.nameEditorBox, {
                    backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.05)",
                    borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.1)",
                  }]}>
                    <Ionicons name="person-outline" size={16} color={theme.textTertiary} />
                    <TextInput
                      value={nameInput}
                      onChangeText={setNameInput}
                      placeholder="Enter display name"
                      placeholderTextColor={theme.textTertiary}
                      style={[styles.nameEditorInput, { color: theme.text }]}
                      returnKeyType="done"
                      onSubmitEditing={handleSaveName}
                      maxLength={40}
                      autoFocus
                    />
                  </View>
                  <View style={styles.nameEditorActions}>
                    <Pressable
                      onPress={handleCancelEdit}
                      style={({ pressed }) => [styles.nameEditorActionBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)", opacity: pressed ? 0.7 : 1 }]}
                    >
                      <Text style={[styles.nameEditorActionLabel, { color: theme.textSecondary }]}>Cancel</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleSaveName}
                      style={({ pressed }) => [styles.nameEditorActionBtn, { backgroundColor: "#E05A6D", opacity: pressed ? 0.8 : 1, flex: 1.4 }]}
                    >
                      <Ionicons name="checkmark" size={15} color="#fff" />
                      <Text style={[styles.nameEditorActionLabel, { color: "#fff" }]}>Save Name</Text>
                    </Pressable>
                  </View>
                </Animated.View>
              )}

              {/* Success toast */}
              {nameSaved && !editingName && (
                <Animated.View entering={FadeIn.duration(200)} style={styles.savedToast}>
                  <Ionicons name="checkmark-circle" size={15} color="#22C55E" />
                  <Text style={[styles.savedToastText, { color: "#22C55E" }]}>Name saved!</Text>
                </Animated.View>
              )}
            </LinearGradient>
          </Animated.View>

          {/* ════════════════════════════════════════
              APPEARANCE
          ════════════════════════════════════════ */}
          <SectionLabel label="APPEARANCE" delay={100} />
          <Animated.View entering={FadeInDown.delay(120).duration(350)} style={[styles.card, {
            backgroundColor: theme.surface,
            borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
          }]}>
            <View style={styles.themeCardsRow}>
              {THEMES.map((t) => {
                const active = colorScheme === t.key;
                return (
                  <Pressable
                    key={t.key}
                    onPress={() => setTheme(t.key)}
                    style={({ pressed }) => [styles.themeCard, { opacity: pressed ? 0.88 : 1 }]}
                  >
                    <LinearGradient
                      colors={active
                        ? (t.key === "dark" ? ["#1A1245", "#0E0E2A"] : ["#FFF9E6", "#FEF3C7"])
                        : [isDark ? "#1A1A1A" : "#F5F5F5", isDark ? "#141414" : "#EEEEEE"]
                      }
                      style={[styles.themeCardInner, {
                        borderColor: active ? t.accentColor + "60" : (isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)"),
                        borderWidth: active ? 1.5 : 1,
                        shadowColor: active ? t.accentColor : "transparent",
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: active ? 0.4 : 0,
                        shadowRadius: 12,
                        elevation: active ? 6 : 0,
                      }]}
                    >
                      {/* Mini UI preview */}
                      <View style={[styles.themeMiniScreen, { backgroundColor: t.bgTop }]}>
                        <View style={[styles.themeMiniBar, { backgroundColor: t.key === "dark" ? "#222" : "#fff" }]}>
                          <View style={[styles.themeMiniDot, { backgroundColor: t.accentColor }]} />
                          <View style={[styles.themeMiniLine, { backgroundColor: t.key === "dark" ? "#444" : "#ccc", width: 28 }]} />
                        </View>
                        <View style={[styles.themeMiniCard, { backgroundColor: t.key === "dark" ? "#1A1A1A" : "#fff" }]}>
                          <View style={[styles.themeMiniLine, { backgroundColor: t.accentColor, width: 22 }]} />
                          <View style={[styles.themeMiniLine, { backgroundColor: t.key === "dark" ? "#333" : "#ddd", width: 36, height: 4, marginTop: 3 }]} />
                        </View>
                        <View style={{ flexDirection: "row", gap: 4 }}>
                          {[t.accentColor + "90", t.key === "dark" ? "#2A2A2A" : "#e8e8e8"].map((bg, i) => (
                            <View key={i} style={[styles.themeMiniPill, { backgroundColor: bg }]} />
                          ))}
                        </View>
                      </View>

                      {/* Label row */}
                      <View style={styles.themeCardLabelRow}>
                        <View style={[styles.themeCardIconWrap, { backgroundColor: active ? t.accentColor + "20" : (isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)") }]}>
                          <Ionicons name={t.icon as any} size={16} color={active ? t.accentColor : subText} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.themeCardLabel, { color: active ? t.accentColor : theme.text, fontFamily: active ? "Inter_700Bold" : "Inter_600SemiBold" }]}>
                            {t.label}
                          </Text>
                          <Text style={[styles.themeCardDesc, { color: subText }]}>{t.desc}</Text>
                        </View>
                        {active && (
                          <View style={[styles.themeActiveCheck, { backgroundColor: t.accentColor }]}>
                            <Ionicons name="checkmark" size={11} color="#fff" />
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </Pressable>
                );
              })}
            </View>
          </Animated.View>

          {/* ════════════════════════════════════════
              CURRENCY
          ════════════════════════════════════════ */}
          <SectionLabel label="CURRENCY" delay={160} />
          <Animated.View entering={FadeInDown.delay(180).duration(350)} style={[styles.card, {
            backgroundColor: theme.surface,
            borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
          }]}>
            {/* Active currency hero */}
            <View style={[styles.activeCurrencyBanner, {
              backgroundColor: isDark ? "rgba(224,90,109,0.1)" : "rgba(224,90,109,0.06)",
              borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
            }]}>
              <Text style={styles.activeCurrencyFlag}>{selectedCurrency.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.activeCurrencyLabel, { color: theme.text }]}>
                  {selectedCurrency.label}
                </Text>
                <Text style={[styles.activeCurrencyCode, { color: subText }]}>
                  Symbol: {selectedCurrency.symbol} · Code: {selectedCurrency.code}
                </Text>
              </View>
              <View style={[styles.activeCurrencyBadge, { backgroundColor: "#E05A6D" }]}>
                <Text style={styles.activeCurrencyBadgeText}>Active</Text>
              </View>
            </View>

            {/* Currency rows */}
            {CURRENCY_LIST.map((c, i) => {
              const active = userCurrency === c.code;
              return (
                <React.Fragment key={c.code}>
                  <Pressable
                    onPress={() => setUserCurrency(c.code)}
                    style={({ pressed }) => [
                      styles.currencyRow,
                      {
                        backgroundColor: active
                          ? (isDark ? "rgba(224,90,109,0.08)" : "rgba(224,90,109,0.05)")
                          : "transparent",
                        opacity: pressed ? 0.75 : 1,
                      },
                    ]}
                  >
                    <Text style={styles.currencyRowFlag}>{c.flag}</Text>
                    <View style={styles.currencyRowText}>
                      <Text style={[styles.currencyRowName, { color: active ? "#E05A6D" : theme.text, fontFamily: active ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                        {c.label}
                      </Text>
                      <Text style={[styles.currencyRowCode, { color: subText }]}>
                        {c.code}  ·  {c.symbol}
                      </Text>
                    </View>
                    <Text style={[styles.currencyRowSymbol, { color: active ? "#E05A6D" : subText, fontFamily: active ? "Inter_700Bold" : "Inter_500Medium" }]}>
                      {c.symbol}
                    </Text>
                    <View style={[styles.currencyRadio, {
                      borderColor: active ? "#E05A6D" : (isDark ? "rgba(255,255,255,0.45)" : "rgba(0,0,0,0.35)"),
                      backgroundColor: active ? "#E05A6D" : "transparent",
                    }]}>
                      {active && <View style={styles.currencyRadioDot} />}
                    </View>
                  </Pressable>
                  {i < CURRENCY_LIST.length - 1 && <Divider />}
                </React.Fragment>
              );
            })}
          </Animated.View>

          {/* ════════════════════════════════════════
              ABOUT
          ════════════════════════════════════════ */}
          <SectionLabel label="ABOUT TIMPLA" delay={220} />
          <Animated.View entering={FadeInDown.delay(240).duration(350)} style={[styles.card, {
            backgroundColor: theme.surface,
            borderColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)",
            overflow: "hidden",
          }]}>
            {/* App name row with gradient pill */}
            <View style={styles.aboutAppRow}>
              <LinearGradient colors={["#C0394D", "#E05A6D"]} style={styles.aboutAppIcon}>
                <Ionicons name="apps" size={20} color="#fff" />
              </LinearGradient>
              <View style={{ flex: 1 }}>
                <Text style={[styles.aboutAppName, { color: theme.text }]}>Timpla</Text>
                <Text style={[styles.aboutAppTagline, { color: subText }]}>
                  All-in-one student finance & study app
                </Text>
              </View>
              <View style={[styles.aboutVersionPill, { backgroundColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }]}>
                <Text style={[styles.aboutVersionText, { color: subText }]}>v1.0.0</Text>
              </View>
            </View>

            <Divider />

            {[
              { icon: "flag-outline",        color: "#F59E0B", label: "Made for",  value: "Students & teachers everywhere 🇵🇭" },
              { icon: "lock-closed-outline", color: "#A78BFA", label: "Storage",   value: "Stored locally on your device only" },
              { icon: "wifi-outline",        color: "#2DD4BF", label: "Works",     value: "Fully offline — no internet needed" },
              { icon: "heart-outline",       color: "#E05A6D", label: "Made with", value: "Love & dedication 💙" },
            ].map((row, i, arr) => (
              <React.Fragment key={row.label}>
                <View style={styles.aboutRow}>
                  <View style={[styles.aboutRowIcon, { backgroundColor: row.color + "18", borderColor: row.color + "30" }]}>
                    <Ionicons name={row.icon as any} size={16} color={row.color} />
                  </View>
                  <View style={styles.aboutRowText}>
                    <Text style={[styles.aboutRowLabel, { color: subText }]}>{row.label}</Text>
                    <Text style={[styles.aboutRowValue, { color: labelText }]}>{row.value}</Text>
                  </View>
                </View>
                {i < arr.length - 1 && <Divider />}
              </React.Fragment>
            ))}
          </Animated.View>

          {/* Footer tagline */}
          <Animated.Text
            entering={FadeInDown.delay(280).duration(300)}
            style={[styles.footerText, { color: subText }]}
          >
            All your data lives safely on your device only.
          </Animated.Text>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   Styles
═══════════════════════════════════════════════════════════════════════════ */
const styles = StyleSheet.create({
  container: { flex: 1 },

  /* Header */
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  screenLabel: { fontSize: 12, fontFamily: "Inter_500Medium", marginBottom: 1, letterSpacing: 0.3 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.5 },

  /* Section label */
  sectionLabel: {
    fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1.2,
    paddingHorizontal: 20, marginTop: 20, marginBottom: 10,
  },

  /* Generic card */
  card: { marginHorizontal: 20, borderRadius: 20, borderWidth: 1, overflow: "hidden" },

  /* Divider */
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 0 },

  /* ─── Profile Hero ─────────────────────────────────────────────────────── */
  profileHeroWrap: { paddingHorizontal: 20, marginBottom: 4 },
  profileHero: {
    borderRadius: 22, borderWidth: 1, padding: 20,
    overflow: "hidden", position: "relative",
  },
  heroDeco1: {
    position: "absolute", width: 120, height: 120, borderRadius: 60,
    opacity: 0.06, top: -30, right: -20,
  },
  heroDeco2: {
    position: "absolute", width: 70, height: 70, borderRadius: 35,
    opacity: 0.05, bottom: -20, left: 10,
  },
  heroTopRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  heroAvatar: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#E05A6D", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 10, elevation: 8,
  },
  heroAvatarText: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  heroNameCol: { flex: 1, gap: 6 },
  heroName: { fontSize: 19, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  heroBalanceChip: {
    flexDirection: "row", alignItems: "center", gap: 5,
    alignSelf: "flex-start",
    backgroundColor: "rgba(224,90,109,0.12)", borderRadius: 20,
    paddingHorizontal: 10, paddingVertical: 4,
  },
  heroBalance: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  heroEditBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },

  /* Name editor */
  nameEditorWrap: { marginTop: 16, gap: 10 },
  nameEditorBox: {
    flexDirection: "row", alignItems: "center", gap: 10,
    borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingVertical: 12,
  },
  nameEditorInput: { flex: 1, fontSize: 15, fontFamily: "Inter_400Regular" },
  nameEditorActions: { flexDirection: "row", gap: 8 },
  nameEditorActionBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 12, borderRadius: 13,
  },
  nameEditorActionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  savedToast: {
    flexDirection: "row", alignItems: "center", gap: 6,
    marginTop: 12, alignSelf: "center",
  },
  savedToastText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },

  /* ─── Appearance ───────────────────────────────────────────────────────── */
  themeCardsRow: { flexDirection: "row", gap: 12, padding: 14 },
  themeCard: { flex: 1 },
  themeCardInner: { borderRadius: 16, overflow: "hidden" },

  /* Mini UI preview */
  themeMiniScreen: { padding: 10, gap: 6, height: 90, justifyContent: "flex-start" },
  themeMiniBar: { flexDirection: "row", alignItems: "center", gap: 5, borderRadius: 6, padding: 6 },
  themeMiniDot: { width: 8, height: 8, borderRadius: 4 },
  themeMiniCard: { borderRadius: 8, padding: 8, gap: 2 },
  themeMiniLine: { height: 5, borderRadius: 3 },
  themeMiniPill: { flex: 1, height: 18, borderRadius: 9 },

  themeCardLabelRow: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12 },
  themeCardIconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  themeCardLabel: { fontSize: 13 },
  themeCardDesc: { fontSize: 11, fontFamily: "Inter_400Regular", marginTop: 1 },
  themeActiveCheck: { width: 20, height: 20, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  /* ─── Currency ─────────────────────────────────────────────────────────── */
  activeCurrencyBanner: {
    flexDirection: "row", alignItems: "center", gap: 12,
    paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1,
  },
  activeCurrencyFlag: { fontSize: 28 },
  activeCurrencyLabel: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  activeCurrencyCode: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  activeCurrencyBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  activeCurrencyBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", color: "#fff" },

  currencyRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  currencyRowFlag: { fontSize: 22 },
  currencyRowText: { flex: 1, gap: 2 },
  currencyRowName: { fontSize: 14 },
  currencyRowCode: { fontSize: 11, fontFamily: "Inter_400Regular" },
  currencyRowSymbol: { fontSize: 16 },
  currencyRadio: {
    width: 20, height: 20, borderRadius: 10, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  currencyRadioDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },

  /* ─── About ────────────────────────────────────────────────────────────── */
  aboutAppRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  aboutAppIcon: { width: 46, height: 46, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  aboutAppName: { fontSize: 17, fontFamily: "Inter_700Bold", letterSpacing: -0.2 },
  aboutAppTagline: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  aboutVersionPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  aboutVersionText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  aboutRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  aboutRowIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  aboutRowText: { flex: 1, gap: 2 },
  aboutRowLabel: { fontSize: 11, fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  aboutRowValue: { fontSize: 13, fontFamily: "Inter_500Medium" },

  /* Footer */
  footerText: { textAlign: "center", fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 24, marginBottom: 4, paddingHorizontal: 40 },
});
