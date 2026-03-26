import React from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform, Switch,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/utils/format";

interface MenuItemProps {
  icon: string;
  label: string;
  sublabel?: string;
  color: string;
  gradColors: [string, string];
  onPress: () => void;
  badge?: string | number;
}

function MenuItem({ icon, label, sublabel, color, gradColors, onPress, badge }: MenuItemProps) {
  const { theme, isDark } = useTheme();
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
      <LinearGradient
        colors={isDark ? gradColors : ["rgba(0,0,0,0.015)", "rgba(0,0,0,0.02)"]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[
          styles.menuItem,
          { borderColor: color + "22", shadowColor: color, shadowOffset: { width: 0, height: 3 }, shadowOpacity: isDark ? 0.2 : 0.08, shadowRadius: 8, elevation: 4 },
        ]}
      >
        <View style={[styles.menuIcon, { backgroundColor: color + "20", borderWidth: 1, borderColor: color + "30" }]}>
          <Ionicons name={icon as any} size={22} color={color} />
        </View>
        <View style={styles.menuText}>
          <Text style={[styles.menuLabel, { color: theme.text }]}>{label}</Text>
          {sublabel ? <Text style={[styles.menuSub, { color: theme.textSecondary }]}>{sublabel}</Text> : null}
        </View>
        {badge !== undefined && (
          <View style={[styles.badge, { backgroundColor: color + "20" }]}>
            <Text style={[styles.badgeText, { color }]}>{badge}</Text>
          </View>
        )}
        <Ionicons name="chevron-forward" size={16} color={theme.textTertiary} />
      </LinearGradient>
    </Pressable>
  );
}

export default function MoreScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const { wallets, debts, tasks, studySessions, transactions, totalBalance } = useApp();
  const insets = useSafeAreaInsets();

  const pendingDebts  = debts.filter((d) => d.status === "pending").length;
  const doneTasks     = tasks.filter((t) => t.completed).length;
  const totalSessions = studySessions.length;

  const SECTIONS = [
    {
      title: "Money",
      items: [
        {
          icon: "wallet-outline",
          label: "Wallets",
          sublabel: `${wallets.length} accounts · ${formatCurrency(totalBalance)}`,
          color: "#2DD4BF",
          gradColors: ["#0D2018", "#102A1E"] as [string, string],
          route: "/(tabs)/wallets",
        },
        {
          icon: "people-outline",
          label: "Debts / Utang",
          sublabel: "Track lent & borrowed money",
          color: "#E05A6D",
          gradColors: ["#2A1018", "#2A1820"] as [string, string],
          route: "/(tabs)/debts",
          badge: pendingDebts > 0 ? pendingDebts : undefined,
        },
      ],
    },
    {
      title: "Analytics",
      items: [
        {
          icon: "bar-chart-outline",
          label: "Insights",
          sublabel: "Spending · Study · Task trends",
          color: "#6366F1",
          gradColors: ["#0D102A", "#121630"] as [string, string],
          route: "/(tabs)/insights",
        },
        {
          icon: "share-social-outline",
          label: "Export PDF",
          sublabel: "Financial & study report",
          color: "#A78BFA",
          gradColors: ["#1A0D2A", "#221630"] as [string, string],
          route: "/pdf-export",
        },
      ],
    },
    {
      title: "AI & Assistant",
      items: [
        {
          icon: "sparkles-outline",
          label: "AI Assistant",
          sublabel: "Your offline budget advisor",
          color: "#6366F1",
          gradColors: ["#0D102A", "#121630"] as [string, string],
          route: "/(tabs)/assistant",
        },
      ],
    },
  ];

  return (
    <LinearGradient
      colors={isDark ? ["#0E0E0E", "#140810", "#0E0E0E"] : ["#F0F0F5", "#EDE8F5", "#F0F0F5"]}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 }}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(300)} style={styles.header}>
          <View>
            <Text style={[styles.screenLabel, { color: theme.textSecondary }]}>More options</Text>
            <Text style={[styles.title, { color: theme.text }]}>Features</Text>
          </View>
        </Animated.View>

        {/* Stats Banner */}
        <Animated.View entering={FadeInDown.delay(60).duration(350)} style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <LinearGradient
            colors={["#C0394D", "#E05A6D", "#8B1A2E"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.statsBanner, { shadowColor: "#E05A6D", shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.4, shadowRadius: 20, elevation: 10 }]}
          >
            <View style={styles.statsBannerDeco1} />
            <View style={styles.statsBannerDeco2} />
            <Text style={styles.bannerTitle}>Timpla</Text>
            <Text style={styles.bannerSub}>Your all-in-one student finance & productivity app</Text>
            <View style={styles.bannerRow}>
              <View style={styles.bannerStat}>
                <Text style={styles.bannerStatValue}>{transactions.length}</Text>
                <Text style={styles.bannerStatLabel}>Transactions</Text>
              </View>
              <View style={styles.bannerDivider} />
              <View style={styles.bannerStat}>
                <Text style={styles.bannerStatValue}>{doneTasks}</Text>
                <Text style={styles.bannerStatLabel}>Tasks Done</Text>
              </View>
              <View style={styles.bannerDivider} />
              <View style={styles.bannerStat}>
                <Text style={styles.bannerStatValue}>{totalSessions}</Text>
                <Text style={styles.bannerStatLabel}>Study Sessions</Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* ── Appearance Section ─────────────────────────────────────────── */}
        <Animated.View entering={FadeInDown.delay(90).duration(350)}>
          <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>APPEARANCE</Text>
          <View style={styles.sectionItems}>
            <LinearGradient
              colors={isDark ? ["#181020", "#1C1428"] : ["rgba(0,0,0,0.015)", "rgba(0,0,0,0.02)"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[
                styles.themeCard,
                {
                  borderColor: "#A78BFA22",
                  shadowColor: "#A78BFA",
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isDark ? 0.2 : 0.08,
                  shadowRadius: 8,
                  elevation: 4,
                },
              ]}
            >
              {/* Left icon */}
              <View style={[styles.themeIconWrap, { backgroundColor: "#A78BFA20", borderWidth: 1, borderColor: "#A78BFA30" }]}>
                <Ionicons name={isDark ? "moon" : "sunny"} size={22} color="#A78BFA" />
              </View>

              {/* Center text */}
              <View style={styles.themeTextWrap}>
                <Text style={[styles.themeLabel, { color: theme.text }]}>
                  {isDark ? "Dark Mode" : "Light Mode"}
                </Text>
                <Text style={[styles.themeSub, { color: theme.textSecondary }]}>
                  {isDark ? "Switch to light theme" : "Switch to dark theme"}
                </Text>
              </View>

              {/* Mode preview dots */}
              <View style={styles.modePreviewRow}>
                <View style={[styles.modePreviewDot, { backgroundColor: isDark ? "#E05A6D" : "#F0F0F5", borderWidth: isDark ? 0 : 1, borderColor: "#ccc" }]} />
                <View style={[styles.modePreviewDot, { backgroundColor: isDark ? "#1A1A1A" : "#FFFFFF", borderWidth: 1, borderColor: isDark ? "#333" : "#ddd" }]} />
              </View>

              {/* Switch */}
              <Switch
                value={isDark}
                onValueChange={toggleTheme}
                trackColor={{ false: "#E2E8F0", true: "#A78BFA50" }}
                thumbColor={isDark ? "#A78BFA" : "#FFFFFF"}
                ios_backgroundColor={isDark ? "#2A2A2A" : "#E2E8F0"}
              />
            </LinearGradient>

            {/* Light / Dark buttons row */}
            <View style={styles.themePickerRow}>
              <Pressable
                onPress={() => !isDark ? null : toggleTheme()}
                style={({ pressed }) => [
                  styles.themePickerBtn,
                  {
                    backgroundColor: !isDark
                      ? "#F59E0B18"
                      : isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
                    borderColor: !isDark ? "#F59E0B55" : isDark ? "rgba(255,255,255,0.08)" : theme.border,
                    borderWidth: 1,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Ionicons name="sunny" size={18} color={!isDark ? "#F59E0B" : theme.textTertiary} />
                <Text style={[styles.themePickerLabel, { color: !isDark ? "#F59E0B" : theme.textTertiary, fontFamily: !isDark ? "Inter_700Bold" : "Inter_400Regular" }]}>
                  Light
                </Text>
                {!isDark && (
                  <View style={[styles.themePickerCheck, { backgroundColor: "#F59E0B" }]}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                )}
              </Pressable>

              <Pressable
                onPress={() => isDark ? null : toggleTheme()}
                style={({ pressed }) => [
                  styles.themePickerBtn,
                  {
                    backgroundColor: isDark
                      ? "#6366F118"
                      : "rgba(0,0,0,0.04)",
                    borderColor: isDark ? "#6366F155" : isDark ? "rgba(255,255,255,0.08)" : theme.border,
                    borderWidth: 1,
                    opacity: pressed ? 0.8 : 1,
                  },
                ]}
              >
                <Ionicons name="moon" size={18} color={isDark ? "#6366F1" : theme.textTertiary} />
                <Text style={[styles.themePickerLabel, { color: isDark ? "#6366F1" : theme.textTertiary, fontFamily: isDark ? "Inter_700Bold" : "Inter_400Regular" }]}>
                  Dark
                </Text>
                {isDark && (
                  <View style={[styles.themePickerCheck, { backgroundColor: "#6366F1" }]}>
                    <Ionicons name="checkmark" size={10} color="#fff" />
                  </View>
                )}
              </Pressable>
            </View>
          </View>
        </Animated.View>

        {/* Feature Sections */}
        {SECTIONS.map((section, sIdx) => (
          <Animated.View key={section.title} entering={FadeInDown.delay(130 + sIdx * 60).duration(350)}>
            <Text style={[styles.sectionTitle, { color: theme.textSecondary }]}>{section.title.toUpperCase()}</Text>
            <View style={styles.sectionItems}>
              {section.items.map((item) => (
                <MenuItem
                  key={item.label}
                  icon={item.icon}
                  label={item.label}
                  sublabel={item.sublabel}
                  color={item.color}
                  gradColors={item.gradColors}
                  onPress={() => router.push(item.route as any)}
                  badge={"badge" in item ? item.badge : undefined}
                />
              ))}
            </View>
          </Animated.View>
        ))}

        <Text style={[styles.version, { color: theme.textTertiary }]}>Timpla v1.0</Text>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 20, paddingBottom: 16 },
  screenLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },

  statsBanner: { borderRadius: 22, padding: 22, overflow: "hidden", position: "relative" },
  statsBannerDeco1: { position: "absolute", width: 130, height: 130, borderRadius: 65, backgroundColor: "rgba(255,255,255,0.07)", top: -40, right: -20 },
  statsBannerDeco2: { position: "absolute", width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.05)", bottom: -20, left: 10 },
  bannerTitle: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 4 },
  bannerSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.85)", marginBottom: 16, lineHeight: 18 },
  bannerRow: { flexDirection: "row", alignItems: "center" },
  bannerStat: { flex: 1, alignItems: "center" },
  bannerStatValue: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff" },
  bannerStatLabel: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.85)" },
  bannerDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)" },

  sectionTitle: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1, paddingHorizontal: 20, marginBottom: 10 },
  sectionItems: { paddingHorizontal: 20, gap: 10, marginBottom: 24 },

  /* Theme toggle card */
  themeCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  themeIconWrap: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  themeTextWrap: { flex: 1, gap: 3 },
  themeLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  themeSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  modePreviewRow: { flexDirection: "row", gap: 4, marginRight: 4 },
  modePreviewDot: { width: 14, height: 14, borderRadius: 7 },

  /* Light / Dark picker buttons */
  themePickerRow: { flexDirection: "row", gap: 10 },
  themePickerBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 13,
    borderRadius: 14,
    position: "relative",
  },
  themePickerLabel: { fontSize: 14 },
  themePickerCheck: {
    position: "absolute",
    top: 6,
    right: 8,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  menuItem: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: 16, borderWidth: 1 },
  menuIcon: { width: 48, height: 48, borderRadius: 24, alignItems: "center", justifyContent: "center" },
  menuText: { flex: 1, gap: 3 },
  menuLabel: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  menuSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 12, fontFamily: "Inter_700Bold" },
  version: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", marginTop: 8, paddingBottom: 8 },
});
