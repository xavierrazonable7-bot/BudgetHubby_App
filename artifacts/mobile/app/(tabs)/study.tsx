import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import {
  View, Text, StyleSheet, ScrollView, Pressable,
  Platform, Alert, Dimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { ScreenWrapper } from "@/components/ScreenWrapper";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type Phase = "focus" | "break";

function pad(n: number) { return String(n).padStart(2, "0"); }
function formatMinutes(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${pad(m)}:${pad(s)}`;
}

function buildHeatmap(sessions: { date: string; duration: number }[], weeks = 8) {
  const map: Record<string, number> = {};
  sessions.forEach((s) => {
    const key = s.date.slice(0, 10);
    map[key] = (map[key] || 0) + s.duration;
  });
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
  if (minutes === 0) return isDark ? "#1A1A1A" : "#E5E7EB";
  if (minutes < 25)  return isDark ? "#1A2E20" : "#BBF7D0";
  if (minutes < 50)  return isDark ? "#166534" : "#4ADE80";
  if (minutes < 100) return isDark ? "#15803D" : "#22C55E";
  return "#16A34A";
}

export default function StudyScreen() {
  const { theme, isDark } = useTheme();
  const { studySessions, addStudySession } = useApp();
  const insets = useSafeAreaInsets();

  const [focusMinutes, setFocusMinutes] = useState(25);
  const [breakMinutes, setBreakMinutes] = useState(5);
  const [phase, setPhase] = useState<Phase>("focus");
  const [secondsLeft, setSecondsLeft] = useState(focusMinutes * 60);
  const [running, setRunning] = useState(false);
  const [completedSessions, setCompletedSessions] = useState(0);
  const [todayMinutes, setTodayMinutes] = useState(0);
  const [showSettings, setShowSettings] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sessionStartRef = useRef<number>(0);

  const totalSeconds = phase === "focus" ? focusMinutes * 60 : breakMinutes * 60;
  const progress = 1 - secondsLeft / totalSeconds;

  const heatmapData = useMemo(() => buildHeatmap(studySessions), [studySessions]);
  const maxMinutes = useMemo(() => Math.max(...heatmapData.map((d) => d.minutes), 1), [heatmapData]);

  const totalStudyTime = useMemo(() =>
    studySessions.reduce((s, sess) => s + sess.duration, 0),
    [studySessions]
  );
  const weekStudyTime = useMemo(() => {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return studySessions
      .filter((s) => new Date(s.date) >= weekAgo)
      .reduce((sum, s) => sum + s.duration, 0);
  }, [studySessions]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const saveSession = useCallback((minutes: number) => {
    if (minutes < 1) return;
    addStudySession({
      date: new Date().toISOString(),
      duration: minutes,
      completedPomodoros: 1,
    });
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
    sessionStartRef.current = Date.now();
    setRunning(true);
    intervalRef.current = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          handlePhaseComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const pause = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const reset = () => {
    setRunning(false);
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase("focus");
    setSecondsLeft(focusMinutes * 60);
  };

  const isFocus = phase === "focus";
  const phaseColor = isFocus ? "#6366F1" : "#2DD4BF";
  const circumference = 2 * Math.PI * 90;
  const strokeDash = circumference * (1 - progress);

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.screenLabel, { color: theme.textSecondary }]}>Study time</Text>
            <Text style={[styles.title, { color: theme.text }]}>Pomodoro</Text>
          </View>
          <Pressable
            onPress={() => setShowSettings((p) => !p)}
            style={[styles.settingsBtn, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.07)" : theme.border, borderWidth: 1 }]}
          >
            <Ionicons name="settings-outline" size={20} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* Settings Panel */}
        {showSettings && (
          <View style={[styles.settingsPanel, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.07)" : theme.border, marginHorizontal: 20, marginBottom: 16 }]}>
            <Text style={[styles.settingsPanelTitle, { color: theme.text }]}>Customize Timer</Text>
            <View style={styles.settingsRow}>
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>Focus (min)</Text>
                <View style={styles.settingControls}>
                  <Pressable onPress={() => { setFocusMinutes((p) => Math.max(1, p - 5)); if (!running) setSecondsLeft(Math.max(1, focusMinutes - 5) * 60); }} style={[styles.controlBtn, { backgroundColor: phaseColor + "20" }]}>
                    <Ionicons name="remove" size={16} color={phaseColor} />
                  </Pressable>
                  <Text style={[styles.settingValue, { color: theme.text }]}>{focusMinutes}</Text>
                  <Pressable onPress={() => { setFocusMinutes((p) => Math.min(60, p + 5)); if (!running) setSecondsLeft(Math.min(60, focusMinutes + 5) * 60); }} style={[styles.controlBtn, { backgroundColor: phaseColor + "20" }]}>
                    <Ionicons name="add" size={16} color={phaseColor} />
                  </Pressable>
                </View>
              </View>
              <View style={styles.settingItem}>
                <Text style={[styles.settingLabel, { color: theme.textSecondary }]}>Break (min)</Text>
                <View style={styles.settingControls}>
                  <Pressable onPress={() => setBreakMinutes((p) => Math.max(1, p - 1))} style={[styles.controlBtn, { backgroundColor: "#2DD4BF20" }]}>
                    <Ionicons name="remove" size={16} color="#2DD4BF" />
                  </Pressable>
                  <Text style={[styles.settingValue, { color: theme.text }]}>{breakMinutes}</Text>
                  <Pressable onPress={() => setBreakMinutes((p) => Math.min(30, p + 1))} style={[styles.controlBtn, { backgroundColor: "#2DD4BF20" }]}>
                    <Ionicons name="add" size={16} color="#2DD4BF" />
                  </Pressable>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Timer Card */}
        <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <LinearGradient
            colors={isFocus ? (isDark ? ["#0D102A", "#121630"] : ["#EDE9FE", "#F5F0FF"]) : (isDark ? ["#0D2018", "#102A1E"] : ["#D1FAE5", "#E8FFF5"])}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.timerCard, { borderColor: phaseColor + "25", shadowColor: phaseColor, shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0.3 : 0.15, shadowRadius: 20, elevation: 8 }]}
          >
            {/* Phase Indicator */}
            <View style={[styles.phaseBadge, { backgroundColor: phaseColor + "20", borderColor: phaseColor + "40" }]}>
              <Ionicons name={isFocus ? "brain-outline" as any : "cafe-outline"} size={14} color={phaseColor} />
              <Text style={[styles.phaseText, { color: phaseColor }]}>{isFocus ? "Focus Time" : "Break Time"}</Text>
            </View>

            {/* SVG Circle Timer */}
            <View style={styles.timerCircleWrap}>
              <View style={[styles.timerCircleBg, { borderColor: phaseColor + "18" }]} />
              <View style={[styles.timerInner]}>
                <Text style={[styles.timerDisplay, { color: theme.text }]}>{formatMinutes(secondsLeft)}</Text>
                <Text style={[styles.timerSub, { color: theme.textSecondary }]}>{isFocus ? "stay focused" : "take a break"}</Text>
              </View>
              {/* Progress arc using border trick */}
              <View
                style={[
                  styles.progressArc,
                  {
                    borderColor: phaseColor,
                    borderTopColor: progress > 0.25 ? phaseColor : "transparent",
                    borderRightColor: progress > 0.5 ? phaseColor : "transparent",
                    borderBottomColor: progress > 0.75 ? phaseColor : "transparent",
                    borderLeftColor: progress > 0.0 ? phaseColor : "transparent",
                    transform: [{ rotate: `${progress * 360}deg` }],
                  },
                ]}
              />
            </View>

            {/* Controls */}
            <View style={styles.controls}>
              <Pressable
                onPress={reset}
                style={[styles.controlRound, { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }]}
              >
                <Ionicons name="refresh" size={20} color={theme.textSecondary} />
              </Pressable>

              <Pressable
                onPress={running ? pause : start}
                style={({ pressed }) => [
                  styles.playBtn,
                  {
                    backgroundColor: phaseColor,
                    shadowColor: phaseColor,
                    shadowOffset: { width: 0, height: 6 },
                    shadowOpacity: 0.45,
                    shadowRadius: 14,
                    elevation: 8,
                    opacity: pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Ionicons name={running ? "pause" : "play"} size={28} color="#fff" style={{ marginLeft: running ? 0 : 3 }} />
              </Pressable>

              <View style={[styles.controlRound, { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }]}>
                <Text style={[styles.sessionCount, { color: theme.textSecondary }]}>{completedSessions}</Text>
                <Ionicons name="flame" size={14} color="#F59E0B" />
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Today Stats */}
        <View style={styles.statsRowSmall}>
          {[
            { label: "Today", value: `${todayMinutes}m`, icon: "today-outline", color: "#6366F1" },
            { label: "This Week", value: `${weekStudyTime}m`, icon: "calendar-outline", color: "#F59E0B" },
            { label: "All Time", value: `${Math.floor(totalStudyTime / 60)}h ${totalStudyTime % 60}m`, icon: "time-outline", color: "#2DD4BF" },
          ].map((s) => (
            <LinearGradient
              key={s.label}
              colors={[s.color + "18", s.color + "08"]}
              style={[styles.smallStat, { borderColor: s.color + "25" }]}
            >
              <Ionicons name={s.icon as any} size={16} color={s.color} />
              <Text style={[styles.smallStatValue, { color: theme.text }]}>{s.value}</Text>
              <Text style={[styles.smallStatLabel, { color: theme.textSecondary }]}>{s.label}</Text>
            </LinearGradient>
          ))}
        </View>

        {/* Study Heatmap */}
        <View style={{ paddingHorizontal: 20 }}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Study Heatmap</Text>
          <Text style={[styles.sectionSub, { color: theme.textSecondary }]}>Last 8 weeks of study activity</Text>
          <View style={[styles.heatmapCard, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.05)" : theme.border, shadowColor: "#000", shadowOffset: { width: 3, height: 3 }, shadowOpacity: isDark ? 0.45 : 0.06, shadowRadius: 10 }]}>
            <View style={styles.heatmapGrid}>
              {Array.from({ length: 8 }, (_, week) => (
                <View key={week} style={styles.heatmapCol}>
                  {Array.from({ length: 7 }, (_, day) => {
                    const idx = week * 7 + day;
                    const d = heatmapData[idx];
                    if (!d) return <View key={day} style={styles.heatCell} />;
                    return (
                      <View
                        key={day}
                        style={[styles.heatCell, { backgroundColor: heatColor(d.minutes, isDark) }]}
                      />
                    );
                  })}
                </View>
              ))}
            </View>
            <View style={styles.heatLegend}>
              <Text style={[styles.heatLegendText, { color: theme.textTertiary }]}>Less</Text>
              {[0, 25, 50, 100].map((m) => (
                <View key={m} style={[styles.heatLegendCell, { backgroundColor: heatColor(m, isDark) }]} />
              ))}
              <Text style={[styles.heatLegendText, { color: theme.textTertiary }]}>More</Text>
            </View>
          </View>
        </View>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 20, paddingBottom: 16 },
  screenLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  settingsBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  settingsPanel: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  settingsPanelTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  settingsRow: { flexDirection: "row", gap: 16 },
  settingItem: { flex: 1, gap: 8 },
  settingLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  settingControls: { flexDirection: "row", alignItems: "center", gap: 12 },
  controlBtn: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  settingValue: { fontSize: 18, fontFamily: "Inter_700Bold", minWidth: 28, textAlign: "center" },
  timerCard: { borderRadius: 22, padding: 28, alignItems: "center", gap: 24, borderWidth: 1 },
  phaseBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  phaseText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  timerCircleWrap: { position: "relative", width: 200, height: 200, alignItems: "center", justifyContent: "center" },
  timerCircleBg: { position: "absolute", width: 196, height: 196, borderRadius: 98, borderWidth: 8 },
  timerInner: { alignItems: "center", gap: 6 },
  timerDisplay: { fontSize: 52, fontFamily: "Inter_700Bold", letterSpacing: -2 },
  timerSub: { fontSize: 13, fontFamily: "Inter_400Regular" },
  progressArc: { position: "absolute", width: 196, height: 196, borderRadius: 98, borderWidth: 8 },
  controls: { flexDirection: "row", alignItems: "center", gap: 24 },
  controlRound: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: 2 },
  sessionCount: { fontSize: 14, fontFamily: "Inter_700Bold" },
  playBtn: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  statsRowSmall: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  smallStat: { flex: 1, borderRadius: 14, padding: 12, alignItems: "center", gap: 5, borderWidth: 1 },
  smallStatValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  smallStatLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 4 },
  sectionSub: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 12 },
  heatmapCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  heatmapGrid: { flexDirection: "row", gap: 3 },
  heatmapCol: { gap: 3 },
  heatCell: { width: 14, height: 14, borderRadius: 3 },
  heatLegend: { flexDirection: "row", alignItems: "center", gap: 4, justifyContent: "flex-end" },
  heatLegendText: { fontSize: 10, fontFamily: "Inter_400Regular" },
  heatLegendCell: { width: 12, height: 12, borderRadius: 2 },
});
