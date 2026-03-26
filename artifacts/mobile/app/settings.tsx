import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, TextInput,
  Platform, Alert, KeyboardAvoidingView,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { useApp, CurrencyCode } from "@/context/AppContext";
import { CURRENCY_LIST } from "@/utils/format";

/* ─── Section wrapper ─────────────────────────────────────────────────────── */
function Section({ title, delay = 0, children }: { title: string; delay?: number; children: React.ReactNode }) {
  const { theme } = useTheme();
  return (
    <Animated.View entering={FadeInDown.delay(delay).duration(350)} style={styles.section}>
      <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{title.toUpperCase()}</Text>
      <View style={[styles.sectionCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        {children}
      </View>
    </Animated.View>
  );
}

/* ─── Row separator ───────────────────────────────────────────────────────── */
function Divider() {
  const { theme } = useTheme();
  return <View style={[styles.divider, { backgroundColor: theme.border }]} />;
}

/* ─── Settings row ────────────────────────────────────────────────────────── */
function SettingRow({
  icon, iconColor, label, sublabel, children,
}: {
  icon: string; iconColor: string; label: string; sublabel?: string; children?: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.settingRow}>
      <View style={[styles.settingIcon, { backgroundColor: iconColor + "18", borderColor: iconColor + "30" }]}>
        <Ionicons name={icon as any} size={18} color={iconColor} />
      </View>
      <View style={styles.settingText}>
        <Text style={[styles.settingLabel, { color: theme.text }]}>{label}</Text>
        {sublabel ? <Text style={[styles.settingSubLabel, { color: theme.textSecondary }]}>{sublabel}</Text> : null}
      </View>
      {children}
    </View>
  );
}

/* ─── Main Screen ─────────────────────────────────────────────────────────── */
export default function SettingsScreen() {
  const { theme, isDark, colorScheme, setTheme } = useTheme();
  const { userName, setUserName, userCurrency, setUserCurrency, formatAmount, totalBalance } = useApp();
  const insets = useSafeAreaInsets();

  const [nameInput, setNameInput] = useState(userName);
  const [nameSaved, setNameSaved] = useState(false);

  const handleSaveName = () => {
    const trimmed = nameInput.trim();
    if (!trimmed) {
      Alert.alert("Invalid name", "Please enter a valid display name.");
      return;
    }
    setUserName(trimmed);
    setNameSaved(true);
    setTimeout(() => setNameSaved(false), 2000);
  };

  const initials = (userName || "?").split(" ").map((w) => w[0]).slice(0, 2).join("").toUpperCase();

  const THEMES: { key: "light" | "dark"; label: string; icon: string; color: string }[] = [
    { key: "light", label: "Light",  icon: "sunny",  color: "#F59E0B" },
    { key: "dark",  label: "Dark",   icon: "moon",   color: "#6366F1" },
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
          contentContainerStyle={{ paddingBottom: insets.bottom + 60, paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 }}
        >
          {/* ── Header ── */}
          <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
            <Pressable
              onPress={() => router.back()}
              style={({ pressed }) => [styles.backBtn, { backgroundColor: theme.surface, opacity: pressed ? 0.6 : 1 }]}
            >
              <Ionicons name="arrow-back" size={20} color={theme.text} />
            </Pressable>
            <View style={{ flex: 1 }}>
              <Text style={[styles.screenLabel, { color: theme.textSecondary }]}>Preferences</Text>
              <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
            </View>
          </Animated.View>

          {/* ── Profile ── */}
          <Section title="Profile" delay={60}>
            {/* Avatar row */}
            <View style={[styles.avatarRow, { borderBottomColor: theme.border }]}>
              <LinearGradient
                colors={["#C0394D", "#E05A6D"]}
                style={styles.avatar}
              >
                <Text style={styles.avatarText}>{initials}</Text>
              </LinearGradient>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.avatarName, { color: theme.text }]}>{userName || "Set your name"}</Text>
                <Text style={[styles.avatarSub, { color: theme.textSecondary }]}>
                  Balance: {formatAmount(totalBalance)}
                </Text>
              </View>
            </View>
            <Divider />
            {/* Name edit */}
            <View style={styles.nameRow}>
              <View style={[styles.settingIcon, { backgroundColor: "#E05A6D18", borderColor: "#E05A6D30" }]}>
                <Ionicons name="person-outline" size={18} color="#E05A6D" />
              </View>
              <View style={styles.nameInputWrap}>
                <Text style={[styles.settingLabel, { color: theme.text }]}>Display Name</Text>
                <TextInput
                  value={nameInput}
                  onChangeText={setNameInput}
                  placeholder="Enter your name"
                  placeholderTextColor={theme.textTertiary}
                  style={[styles.nameInput, { color: theme.text, borderColor: isDark ? "rgba(255,255,255,0.1)" : theme.border }]}
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                  maxLength={40}
                />
              </View>
              <Pressable
                onPress={handleSaveName}
                style={({ pressed }) => [
                  styles.saveBtn,
                  { backgroundColor: nameSaved ? "#22C55E" : "#E05A6D", opacity: pressed ? 0.8 : 1 },
                ]}
              >
                <Ionicons name={nameSaved ? "checkmark" : "save-outline"} size={16} color="#fff" />
              </Pressable>
            </View>
          </Section>

          {/* ── Appearance ── */}
          <Section title="Appearance" delay={100}>
            <View style={styles.themePickerRow}>
              {THEMES.map((t, i) => {
                const active = colorScheme === t.key;
                return (
                  <React.Fragment key={t.key}>
                    <Pressable
                      onPress={() => setTheme(t.key)}
                      style={({ pressed }) => [
                        styles.themePickerBtn,
                        {
                          backgroundColor: active ? t.color + "15" : "transparent",
                          borderColor: active ? t.color + "55" : "transparent",
                          borderWidth: 1.5,
                          opacity: pressed ? 0.75 : 1,
                        },
                      ]}
                    >
                      <View style={[styles.themeIconWrap, { backgroundColor: active ? t.color + "20" : (isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)") }]}>
                        <Ionicons name={t.icon as any} size={22} color={active ? t.color : theme.textTertiary} />
                      </View>
                      <Text style={[styles.themeBtnLabel, { color: active ? t.color : theme.textSecondary, fontFamily: active ? "Inter_700Bold" : "Inter_400Regular" }]}>
                        {t.label}
                      </Text>
                      {active && (
                        <View style={[styles.themeCheck, { backgroundColor: t.color }]}>
                          <Ionicons name="checkmark" size={10} color="#fff" />
                        </View>
                      )}
                    </Pressable>
                    {i < THEMES.length - 1 && <View style={{ width: 10 }} />}
                  </React.Fragment>
                );
              })}
            </View>
            <View style={[styles.themeTip, { backgroundColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)" }]}>
              <Ionicons name="information-circle-outline" size={14} color={theme.textTertiary} />
              <Text style={[styles.themeTipText, { color: theme.textTertiary }]}>
                Theme is applied throughout the entire app and saved locally.
              </Text>
            </View>
          </Section>

          {/* ── Currency ── */}
          <Section title="Currency" delay={140}>
            <View style={styles.currencyGrid}>
              {CURRENCY_LIST.map((c) => {
                const active = userCurrency === c.code;
                return (
                  <Pressable
                    key={c.code}
                    onPress={() => setUserCurrency(c.code)}
                    style={({ pressed }) => ({ opacity: pressed ? 0.8 : 1, flex: 1, minWidth: "30%" })}
                  >
                    <View
                      style={[
                        styles.currencyCard,
                        {
                          backgroundColor: active ? "#E05A6D12" : (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)"),
                          borderColor: active ? "#E05A6D55" : "transparent",
                          borderWidth: 1.5,
                        },
                      ]}
                    >
                      <Text style={styles.currencyFlag}>{c.flag}</Text>
                      <Text style={[styles.currencySymbol, { color: active ? "#E05A6D" : theme.text }]}>{c.symbol}</Text>
                      <Text style={[styles.currencyCode, { color: active ? "#E05A6D" : theme.textSecondary, fontFamily: active ? "Inter_700Bold" : "Inter_400Regular" }]}>
                        {c.code}
                      </Text>
                      {active && (
                        <View style={[styles.currencyCheck, { backgroundColor: "#E05A6D" }]}>
                          <Ionicons name="checkmark" size={8} color="#fff" />
                        </View>
                      )}
                    </View>
                  </Pressable>
                );
              })}
            </View>
            <View style={[styles.currencyNote, { borderTopColor: theme.border }]}>
              <Ionicons name="swap-horizontal-outline" size={14} color={theme.textTertiary} />
              <Text style={[styles.currencyNoteText, { color: theme.textTertiary }]}>
                Selected: {CURRENCY_LIST.find(c => c.code === userCurrency)?.label} ({CURRENCY_LIST.find(c => c.code === userCurrency)?.symbol})
                {" — "}All balances and amounts shown in this currency.
              </Text>
            </View>
          </Section>

          {/* ── About ── */}
          <Section title="About" delay={180}>
            <SettingRow icon="apps-outline" iconColor="#6366F1" label="Timpla" sublabel="Your all-in-one student finance app" />
            <Divider />
            <SettingRow icon="code-slash-outline" iconColor="#2DD4BF" label="Version" sublabel="v1.0.0" />
            <Divider />
            <SettingRow icon="flag-outline" iconColor="#F59E0B" label="Made for" sublabel="Filipino students & teachers 🇵🇭" />
            <Divider />
            <SettingRow icon="lock-closed-outline" iconColor="#A78BFA" label="Privacy" sublabel="All data stored locally on your device only" />
          </Section>

        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 20, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  screenLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },

  section: { marginBottom: 8, paddingHorizontal: 20 },
  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1, marginBottom: 8, marginTop: 16 },
  sectionCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  divider: { height: 1, marginHorizontal: 16 },

  /* Avatar */
  avatarRow: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderBottomWidth: 1 },
  avatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  avatarName: { fontSize: 17, fontFamily: "Inter_700Bold" },
  avatarSub: { fontSize: 13, fontFamily: "Inter_400Regular" },

  /* Name row */
  nameRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, paddingHorizontal: 16 },
  settingIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", borderWidth: 1 },
  nameInputWrap: { flex: 1, gap: 4 },
  settingLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  nameInput: {
    fontSize: 14, fontFamily: "Inter_400Regular", borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  saveBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },

  /* Generic setting row */
  settingRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, paddingHorizontal: 16 },
  settingText: { flex: 1, gap: 3 },
  settingSubLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },

  /* Theme picker */
  themePickerRow: { flexDirection: "row", padding: 14, paddingHorizontal: 16, paddingBottom: 10 },
  themePickerBtn: {
    flex: 1,
    alignItems: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 16,
    position: "relative",
  },
  themeIconWrap: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  themeBtnLabel: { fontSize: 14 },
  themeCheck: { position: "absolute", top: 8, right: 8, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  themeTip: { flexDirection: "row", alignItems: "flex-start", gap: 6, marginHorizontal: 14, marginBottom: 14, padding: 10, borderRadius: 10 },
  themeTipText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 17 },

  /* Currency grid */
  currencyGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, padding: 14, paddingBottom: 8 },
  currencyCard: {
    alignItems: "center",
    gap: 4,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    position: "relative",
  },
  currencyFlag: { fontSize: 22 },
  currencySymbol: { fontSize: 16, fontFamily: "Inter_700Bold" },
  currencyCode: { fontSize: 11 },
  currencyCheck: { position: "absolute", top: 6, right: 6, width: 16, height: 16, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  currencyNote: { flexDirection: "row", alignItems: "flex-start", gap: 6, paddingHorizontal: 14, paddingVertical: 12, borderTopWidth: 1 },
  currencyNoteText: { fontSize: 12, fontFamily: "Inter_400Regular", flex: 1, lineHeight: 17 },
});
