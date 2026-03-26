import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable, Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { ScreenWrapper } from "@/components/ScreenWrapper";

// ─── Helpers ──────────────────────────────────────────────────────────────────
type Phase = "focus" | "break";

function pad(n: number) { return String(n).padStart(2, "0"); }
function formatMinutes(seconds: number) {
  return `${pad(Math.floor(seconds / 60))}:${pad(seconds % 60)}`;
}

function buildHeatmap(sessions: { date: string; duration: number }[], weeks = 8) {
  const map: Record<string, number> = {};
  sessions.forEach((s) => { const k = s.date.slice(0, 10); map[k] = (map[k] || 0) + s.duration; });
  const today = new Date();
  const days: { date: string; minutes: number }[] = [];
  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    days.push({ date: key, minutes: map[key] || 0 });
  }
  return days;
}

function heatColor(minutes: number, isDark: boolean): string {
  if (minutes === 0) return isDark ? "#1E1E2A" : "#E5E7EB";
  if (minutes < 25)  return isDark ? "#1A2E20" : "#BBF7D0";
  if (minutes < 50)  return isDark ? "#166534" : "#4ADE80";
  if (minutes < 100) return isDark ? "#15803D" : "#22C55E";
  return "#16A34A";
}

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

// ─── Screen ───────────────────────────────────────────────────────────────────
export default function StudyScreen() {
  const { theme, isDark } = useTheme();
  const { studySessions, addStudySession } = useApp();
  const insets = useSafeAreaInsets();

  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [phase, setPhase]               = useState<Phase>("focus");
  const [secondsLeft, setSecondsLeft]   = useState(focusMinutes * 60);
  const [running, setRunning]           = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [showSettings, setShowSettings] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const adjustFocus = useCallback((delta: number) => {
    const next = Math.min(120, Math.max(1, focusMinutes + delta));
    setFocusMinutes(next);
    if (!running) setSecondsLeft(next * 60);
    Haptics.selectionAsync();
  }, [focusMinutes, running]);

  const adjustBreak = useCallback((delta: number) => {
    const next = Math.min(60, Math.max(1, breakMinutes + delta));
    setBreakMinutes(next);
    Haptics.selectionAsync();
  }, [breakMinutes]);

  const totalSeconds = phase === "focus" ? focusMinutes * 60 : breakMinutes * 60;
  const progress     = 1 - secondsLeft / totalSeconds;

  const heatmapData   = useMemo(() => buildHeatmap(studySessions), [studySessions]);
  const totalStudyMin = useMemo(() => studySessions.reduce((s, x) => s + x.duration, 0), [studySessions]);
  const weekStudyMin  = useMemo(() => {
    const weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 7);
    return studySessions.filter((s) => new Date(s.date) >= weekAgo).reduce((sum, s) => sum + s.duration, 0);
  }, [studySessions]);

  useEffect(() => { return () => { if (intervalRef.current) clearInterval(intervalRef.current); }; }, []);

  const saveSession = useCallback((minutes: number) => {
    if (minutes < 1) return;
    addStudySession({ date: new Date().toISOString(), duration: minutes, completedPomodoros: 1 });
    setTodayMinutes((p) => p + minutes);
  }, [addStudySession]);

  const handlePhaseComplete = useCallback(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (phase === "focus") {
      saveSession(focusMinutes);
      setCompletedSessions((p) => p + 1);
      setPhase("break");
      setSecondsLeft(breakMinutes * 60);
    } else {
      setPhase("focus");
      setSecondsLeft(focusMinutes * 60);
    }
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, [phase, focusMinutes, breakMinutes, saveSession]);

  const start = () => {
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) { handlePhaseComplete(); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const pause = () => { setRunning(false); if (intervalRef.current) clearInterval(intervalRef.current); };
  const reset = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("focus");
    setSecondsLeft(focusMinutes * 60);
  };

  const isFocus    = phase === "focus";
  const phaseColor = isFocus ? "#6366F1" : "#2DD4BF";
  const phaseGradient: [string, string] = isFocus
    ? (isDark ? ["#0D102A", "#121630"] : ["#EDE9FE", "#F5F0FF"])
    : (isDark ? ["#0D2018", "#102A1E"] : ["#D1FAE5", "#E8FFF5"]);

  // Format total study time nicely
  const totalHours = Math.floor(totalStudyMin / 60);
  const totalMins  = totalStudyMin % 60;
  const totalLabel = totalHours > 0 ? `${totalHours}h ${totalMins}m` : `${totalMins}m`;

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
        }}
      >
        {/* ── Header ── */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.screenLabel, { color: theme.textSecondary }]}>Study time</Text>
            <Text style={[styles.title, { color: theme.text }]}>Pomodoro</Text>
          </View>
          <Pressable
            onPress={() => setShowSettings((p) => !p)}
            style={[
              styles.settingsBtn,
              {
                backgroundColor: showSettings ? phaseColor + "18" : theme.surface,
                borderColor: showSettings ? phaseColor + "45" : isDark ? "rgba(255,255,255,0.08)" : theme.border,
                borderWidth: 1,
              },
            ]}
          >
            <Ionicons
              name={showSettings ? "close" : "settings-outline"}
              size={20}
              color={showSettings ? phaseColor : theme.textSecondary}
            />
          </Pressable>
        </View>

        {/* ── Settings Panel ── */}
        {showSettings && (
          <View style={{ marginHorizontal: 20, marginBottom: 16, gap: 12 }}>
            {[
              {
                label: "Focus",
                sub: "Concentration period",
                color: "#6366F1",
                icon: "bulb-outline" as const,
                value: focusMinutes,
                unit: "min",
                onMinus: () => adjustFocus(-1),
                onPlus: () => adjustFocus(1),
                atMin: focusMinutes <= 1,
                atMax: focusMinutes >= 120,
                gradient: isDark ? ["#0D102A", "#121630"] as [string, string] : ["#EDE9FE", "#F5F0FF"] as [string, string],
              },
              {
                label: "Break",
                sub: "Rest period",
                color: "#2DD4BF",
                icon: "cafe-outline" as const,
                value: breakMinutes,
                unit: "min",
                onMinus: () => adjustBreak(-1),
                onPlus: () => adjustBreak(1),
                atMin: breakMinutes <= 1,
                atMax: breakMinutes >= 60,
                gradient: isDark ? ["#0D2018", "#102A1E"] as [string, string] : ["#D1FAE5", "#E8FFF5"] as [string, string],
              },
            ].map((item) => (
              <LinearGradient
                key={item.label}
                colors={item.gradient}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[
                  styles.settingCard,
                  {
                    borderColor: item.color + "25",
                    shadowColor: item.color,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: isDark ? 0.2 : 0.08,
                    shadowRadius: 12,
                    elevation: 4,
                  },
                ]}
              >
                {/* Label row */}
                <View style={styles.settingLabelRow}>
                  <View style={[styles.settingIconBubble, { backgroundColor: item.color + "20" }]}>
                    <Ionicons name={item.icon} size={16} color={item.color} />
                  </View>
                  <View>
                    <Text style={[styles.settingLabel, { color: theme.text }]}>{item.label}</Text>
                    <Text style={[styles.settingSub, { color: theme.textSecondary }]}>{item.sub}</Text>
                  </View>
                </View>

                {/* Controls: − value + */}
                <View style={styles.settingControlRow}>
                  <Pressable
                    onPress={item.onMinus}
                    disabled={item.atMin}
                    style={({ pressed }) => [
                      styles.adjBtn,
                      {
                        backgroundColor: item.atMin ? (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)") : item.color + "18",
                        borderColor: item.atMin ? "transparent" : item.color + "30",
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Ionicons name="remove" size={22} color={item.atMin ? theme.textTertiary : item.color} />
                  </Pressable>

                  <View style={styles.settingValueWrap}>
                    <Text style={[styles.settingValue, { color: item.color }]}>{item.value}</Text>
                    <Text style={[styles.settingUnit, { color: item.color + "99" }]}>{item.unit}</Text>
                  </View>

                  <Pressable
                    onPress={item.onPlus}
                    disabled={item.atMax}
                    style={({ pressed }) => [
                      styles.adjBtn,
                      {
                        backgroundColor: item.atMax ? (isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)") : item.color + "18",
                        borderColor: item.atMax ? "transparent" : item.color + "30",
                        opacity: pressed ? 0.7 : 1,
                      },
                    ]}
                  >
                    <Ionicons name="add" size={22} color={item.atMax ? theme.textTertiary : item.color} />
                  </Pressable>
                </View>
              </LinearGradient>
            ))}
          </View>
        )}

        {/* ── Timer Card ── */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <LinearGradient
            colors={phaseGradient}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[
              styles.timerCard,
              {
                borderColor: phaseColor + "25",
                shadowColor: phaseColor,
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: isDark ? 0.3 : 0.15,
                shadowRadius: 24,
                elevation: 10,
              },
            ]}
          >
            {/* Phase badge */}
            <View style={[styles.phaseBadge, { backgroundColor: phaseColor + "20", borderColor: phaseColor + "40" }]}>
              <Ionicons name={isFocus ? "bulb-outline" : "cafe-outline"} size={14} color={phaseColor} />
              <Text style={[styles.phaseText, { color: phaseColor }]}>
                {isFocus ? "Focus Time" : "Break Time"}
              </Text>
            </View>

            {/* Circle timer */}
            <View style={styles.timerCircleWrap}>
              {/* Outer ring (track) */}
              <View style={[styles.timerTrack, { borderColor: phaseColor + "18" }]} />
              {/* Progress ring — CSS border trick */}
              <View
                style={[
                  styles.timerProgress,
                  {
                    borderColor: phaseColor,
                    borderTopColor:    progress > 0.25 ? phaseColor : "transparent",
                    borderRightColor:  progress > 0.5  ? phaseColor : "transparent",
                    borderBottomColor: progress > 0.75 ? phaseColor : "transparent",
                    borderLeftColor:   progress > 0    ? phaseColor : "transparent",
                    transform: [{ rotate: `${progress * 360}deg` }],
                  },
                ]}
              />
              {/* Center content */}
              <View style={styles.timerCenter}>
                <Text style={[styles.timerDisplay, { color: theme.text }]}>{formatMinutes(secondsLeft)}</Text>
                <Text style={[styles.timerSub, { color: theme.textSecondary }]}>
                  {isFocus ? "stay focused" : "take a break"}
                </Text>
              </View>
            </View>

            {/* Controls row */}
            <View style={styles.controlsRow}>
              {/* Reset */}
              <Pressable
                onPress={reset}
                style={[styles.sideBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }]}
              >
                <Ionicons name="refresh" size={20} color={theme.textSecondary} />
              </Pressable>

              {/* Play / Pause */}
              <Pressable
                onPress={running ? pause : start}
                style={({ pressed }) => [
                  styles.playBtn,
                  {
                    backgroundColor: phaseColor,
                    shadowColor: phaseColor,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.5,
                    shadowRadius: 16,
                    elevation: 8,
                    opacity: pressed ? 0.88 : 1,
                  },
                ]}
              >
                <Ionicons name={running ? "pause" : "play"} size={28} color="#fff" style={{ marginLeft: running ? 0 : 3 }} />
              </Pressable>

              {/* Session counter */}
              <View style={[styles.sideBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }]}>
                <Ionicons name="flame" size={16} color="#F59E0B" />
                <Text style={[styles.sessionCount, { color: theme.text }]}>{completedSessions}</Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* ── Stats Row ── */}
        <View style={styles.statsRow}>
          {[
            { label: "Today",     value: `${todayMinutes}m`,  icon: "today-outline",    color: "#6366F1" },
            { label: "This Week", value: `${weekStudyMin}m`,  icon: "calendar-outline", color: "#F59E0B" },
            { label: "All Time",  value: totalLabel,           icon: "time-outline",     color: "#2DD4BF" },
          ].map((s) => (
            <LinearGradient
              key={s.label}
              colors={[s.color + "1C", s.color + "0A"]}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[
                styles.statCard,
                {
                  borderColor: s.color + "28",
                  shadowColor: s.color,
                  shadowOffset: { width: 0, height: 3 },
                  shadowOpacity: isDark ? 0.15 : 0.06,
                  shadowRadius: 8,
                  elevation: 3,
                },
              ]}
            >
              <View style={[styles.statIconWrap, {
                backgroundColor: s.color + "18",
                borderWidth: 1,
                borderColor: s.color + "30",
                shadowColor: s.color,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.35,
                shadowRadius: 6,
              }]}>
                <Ionicons name={s.icon as any} size={18} color={s.color} />
              </View>
              <View style={styles.statTextCol}>
                <Text style={[styles.statValue, { color: theme.text }]}>{s.value}</Text>
                <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{s.label}</Text>
              </View>
            </LinearGradient>
          ))}
        </View>

        {/* ── Heatmap Section ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Study Heatmap</Text>
              <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>Last 8 weeks of activity</Text>
            </View>
            <View style={[styles.sectionBadge, { backgroundColor: "#22C55E18", borderColor: "#22C55E28" }]}>
              <Ionicons name="leaf-outline" size={12} color="#22C55E" />
              <Text style={[styles.sectionBadgeText, { color: "#22C55E" }]}>Activity</Text>
            </View>
          </View>

          <View
            style={[
              styles.heatmapCard,
              {
                backgroundColor: theme.surface,
                borderColor: isDark ? "rgba(255,255,255,0.06)" : theme.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.3 : 0.06,
                shadowRadius: 12,
                elevation: 4,
              },
            ]}
          >
            {/* Day labels + Grid */}
            <View style={styles.heatmapBody}>
              {/* Day labels column */}
              <View style={styles.dayLabelsCol}>
                {DAY_LABELS.map((d, i) => (
                  <Text key={i} style={[styles.dayLabel, { color: theme.textTertiary }]}>{d}</Text>
                ))}
              </View>

              {/* Calendar grid */}
              <View style={styles.heatmapGrid}>
                {Array.from({ length: 8 }, (_, week) => (
                  <View key={week} style={styles.heatmapCol}>
                    {Array.from({ length: 7 }, (_, day) => {
                      const d = heatmapData[week * 7 + day];
                      return (
                        <View
                          key={day}
                          style={[
                            styles.heatCell,
                            { backgroundColor: d ? heatColor(d.minutes, isDark) : (isDark ? "#1E1E2A" : "#E5E7EB") },
                          ]}
                        />
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            {/* Legend */}
            <View style={[styles.legendRow, { borderTopColor: isDark ? "rgba(255,255,255,0.06)" : theme.border }]}>
              <Text style={[styles.legendText, { color: theme.textTertiary }]}>Less</Text>
              {[0, 20, 50, 90].map((m, i) => (
                <View key={i} style={[styles.legendCell, { backgroundColor: heatColor(m, isDark) }]} />
              ))}
              <Text style={[styles.legendText, { color: theme.textTertiary }]}>More</Text>
            </View>
          </View>
        </View>

        {/* ── Sessions Summary ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Sessions</Text>
              <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>Your study history</Text>
            </View>
          </View>

          <View
            style={[
              styles.summaryCard,
              {
                backgroundColor: theme.surface,
                borderColor: isDark ? "rgba(255,255,255,0.06)" : theme.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isDark ? 0.2 : 0.05,
                shadowRadius: 10,
                elevation: 3,
              },
            ]}
          >
            {[
              { icon: "checkmark-circle-outline", color: "#6366F1", label: "Sessions completed",    value: String(studySessions.length) },
              { icon: "flame-outline",            color: "#F59E0B", label: "Today's sessions",       value: String(completedSessions) },
              { icon: "hourglass-outline",         color: "#2DD4BF", label: "Total study time",      value: totalLabel },
            ].map((item, i, arr) => (
              <View key={item.label}>
                <View style={styles.summaryRow}>
                  <View style={[styles.summaryIconWrap, { backgroundColor: item.color + "18" }]}>
                    <Ionicons name={item.icon as any} size={20} color={item.color} />
                  </View>
                  <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>{item.label}</Text>
                  <Text style={[styles.summaryValue, { color: theme.text }]}>{item.value}</Text>
                </View>
                {i < arr.length - 1 && (
                  <View style={[styles.summaryDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : theme.border }]} />
                )}
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  /* Header */
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  screenLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  settingsBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },

  /* Settings cards */
  settingCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 18,
  },
  settingLabelRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  settingIconBubble: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  settingLabel: { fontSize: 16, fontFamily: "Inter_700Bold" },
  settingSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 1 },
  settingControlRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 20,
  },
  adjBtn: {
    width: 48, height: 48, borderRadius: 24,
    alignItems: "center", justifyContent: "center",
    borderWidth: 1,
  },
  settingValueWrap: { alignItems: "center", minWidth: 80 },
  settingValue: { fontSize: 40, fontFamily: "Inter_700Bold", lineHeight: 46 },
  settingUnit: { fontSize: 13, fontFamily: "Inter_500Medium", marginTop: 2 },

  /* Timer card */
  timerCard: {
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 26,
    borderWidth: 1,
  },
  phaseBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 22,
    borderWidth: 1,
  },
  phaseText: { fontSize: 13, fontFamily: "Inter_700Bold" },
  timerCircleWrap: {
    position: "relative",
    width: 204,
    height: 204,
    alignItems: "center",
    justifyContent: "center",
  },
  timerTrack: {
    position: "absolute",
    width: 200, height: 200,
    borderRadius: 100,
    borderWidth: 8,
  },
  timerProgress: {
    position: "absolute",
    width: 200, height: 200,
    borderRadius: 100,
    borderWidth: 8,
  },
  timerCenter: { alignItems: "center", gap: 6 },
  timerDisplay: { fontSize: 52, fontFamily: "Inter_700Bold", letterSpacing: -2 },
  timerSub: { fontSize: 13, fontFamily: "Inter_400Regular" },

  /* Controls */
  controlsRow: { flexDirection: "row", alignItems: "center", gap: 24 },
  sideBtn: {
    width: 54, height: 54, borderRadius: 27,
    alignItems: "center", justifyContent: "center",
    flexDirection: "row", gap: 3,
  },
  sessionCount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  playBtn: {
    width: 74, height: 74, borderRadius: 37,
    alignItems: "center", justifyContent: "center",
  },

  /* Stats row */
  statsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 28 },
  statCard: { flex: 1, borderRadius: 18, padding: 12, flexDirection: "row", alignItems: "center", gap: 10, borderWidth: 1 },
  statTextCol: { flex: 1, gap: 2 },
  statIconWrap: {
    width: 40, height: 40, borderRadius: 20,
    alignItems: "center", justifyContent: "center",
  },
  statValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  statLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },

  /* Section */
  section: { paddingHorizontal: 20, marginBottom: 24 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  sectionSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  sectionBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  sectionBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },

  /* Heatmap */
  heatmapCard: { borderRadius: 20, borderWidth: 1, padding: 16, gap: 14 },
  heatmapBody: { flexDirection: "row", gap: 8, alignItems: "flex-start" },
  dayLabelsCol: { gap: 3, paddingTop: 1 },
  dayLabel: { fontSize: 10, fontFamily: "Inter_500Medium", height: 16, textAlignVertical: "center" },
  heatmapGrid: { flexDirection: "row", gap: 3, flex: 1 },
  heatmapCol: { gap: 3, flex: 1 },
  heatCell: { height: 14, borderRadius: 3 },
  legendRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    justifyContent: "flex-end",
    paddingTop: 10,
    borderTopWidth: 1,
  },
  legendText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  legendCell: { width: 12, height: 12, borderRadius: 3 },

  /* Sessions summary card */
  summaryCard: { borderRadius: 20, borderWidth: 1, overflow: "hidden" },
  summaryRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  summaryIconWrap: {
    width: 42, height: 42, borderRadius: 21,
    alignItems: "center", justifyContent: "center",
  },
  summaryLabel: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  summaryValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  summaryDivider: { height: 1, marginHorizontal: 16 },
});
