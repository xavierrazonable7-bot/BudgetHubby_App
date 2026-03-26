import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Dimensions } from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { PieChart } from "react-native-chart-kit";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { isThisWeek, isThisMonth } from "@/utils/format";
import { getCategoryLabel, getCategoryColor } from "@/utils/categories";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { EmptyState } from "@/components/ui/EmptyState";

function dayOfWeek(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-PH", { weekday: "long" });
}
function isThisWeekDate(dateStr: string): boolean {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - now.getDay());
  start.setHours(0, 0, 0, 0);
  return new Date(dateStr) >= start;
}
function isLastWeekDate(dateStr: string): boolean {
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  const d = new Date(dateStr);
  return d >= lastWeekStart && d < thisWeekStart;
}

type Period = "week" | "month";
const { width: screenWidth } = Dimensions.get("window");

export default function InsightsScreen() {
  const { theme, isDark } = useTheme();
  const { transactions, monthlyIncome, monthlyExpenses, studySessions, tasks, formatAmount } = useApp();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>("month");

  const periodTransactions = useMemo(() =>
    transactions.filter((t) => period === "week" ? isThisWeek(t.date) : isThisMonth(t.date)),
    [transactions, period]
  );
  const expenses = useMemo(() => periodTransactions.filter((t) => t.type === "expense"), [periodTransactions]);
  const incomeTotal = useMemo(() => periodTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0), [periodTransactions]);
  const expenseTotal = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0), [expenses]);
  const saved = incomeTotal - expenseTotal;

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat, amount]) => ({
        category: cat, amount,
        label: getCategoryLabel(cat),
        color: getCategoryColor(cat),
        percent: expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0,
      }));
  }, [expenses, expenseTotal]);

  const pieData = categoryBreakdown.map((c) => ({
    name: c.label, amount: c.amount, color: c.color,
    legendFontColor: theme.textSecondary, legendFontSize: 12,
  }));

  const insights = useMemo(() => {
    const list: { icon: string; text: string; color: string }[] = [];
    if (categoryBreakdown.length > 0) {
      const top = categoryBreakdown[0];
      list.push({ icon: "bulb-outline", text: `You spent ${top.percent.toFixed(0)}% on ${top.label} this ${period}`, color: theme.primary });
    }
    if (saved > 0) {
      list.push({ icon: "trending-up-outline", text: `You saved ${formatAmount(saved)} this ${period}`, color: theme.income });
    } else if (saved < 0) {
      list.push({ icon: "warning-outline", text: `You overspent by ${formatAmount(Math.abs(saved))} this ${period}`, color: theme.expense });
    }
    if (expenseTotal > 0 && incomeTotal > 0) {
      const pct = (expenseTotal / incomeTotal) * 100;
      list.push({ icon: "stats-chart-outline", text: `You spent ${pct.toFixed(0)}% of your income this ${period}`, color: theme.warning });
    }
    return list;
  }, [categoryBreakdown, saved, expenseTotal, incomeTotal, period]);

  // ── Study Insights ───────────────────────────────────────────────────────
  const studyInsights = useMemo(() => {
    const list: { icon: string; text: string; color: string }[] = [];
    if (studySessions.length === 0) return list;

    const thisWeekSessions = studySessions.filter((s) => isThisWeekDate(s.date));
    const lastWeekSessions = studySessions.filter((s) => isLastWeekDate(s.date));
    const thisWeekMin = thisWeekSessions.reduce((s, ss) => s + ss.duration, 0);
    const lastWeekMin = lastWeekSessions.reduce((s, ss) => s + ss.duration, 0);

    if (thisWeekMin > 0 && lastWeekMin > 0) {
      if (thisWeekMin > lastWeekMin) {
        list.push({ icon: "trending-up-outline", text: `You studied ${thisWeekMin - lastWeekMin} more minutes this week vs last week`, color: "#2DD4BF" });
      } else if (thisWeekMin < lastWeekMin) {
        list.push({ icon: "trending-down-outline", text: `You studied ${lastWeekMin - thisWeekMin} fewer minutes this week vs last week`, color: "#F59E0B" });
      }
    }

    // Days studied this week
    const studiedDays = new Set(thisWeekSessions.map((s) => s.date.slice(0, 10))).size;
    const today = new Date();
    const dayOfWeekNum = today.getDay();
    const daysSoFar = dayOfWeekNum === 0 ? 7 : dayOfWeekNum;
    const missedDays = daysSoFar - studiedDays;
    if (missedDays > 0 && daysSoFar >= 2) {
      list.push({ icon: "calendar-clear-outline", text: `You missed ${missedDays} day${missedDays > 1 ? "s" : ""} of study this week`, color: "#E05A6D" });
    } else if (studiedDays >= daysSoFar && daysSoFar >= 2) {
      list.push({ icon: "flame-outline", text: `Studying streak! You studied every day this week`, color: "#F59E0B" });
    }

    // Most productive day
    const dayTotals: Record<string, number> = {};
    studySessions.forEach((s) => {
      const day = dayOfWeek(s.date);
      dayTotals[day] = (dayTotals[day] || 0) + s.duration;
    });
    const bestDay = Object.entries(dayTotals).sort((a, b) => b[1] - a[1])[0];
    if (bestDay) {
      list.push({ icon: "star-outline", text: `Most productive day: ${bestDay[0]} (${bestDay[1]} min total)`, color: "#6366F1" });
    }

    // Total sessions
    const totalPomodoros = studySessions.reduce((s, ss) => s + ss.completedPomodoros, 0);
    if (totalPomodoros > 0) {
      list.push({ icon: "timer-outline", text: `${totalPomodoros} Pomodoro session${totalPomodoros > 1 ? "s" : ""} completed — keep it up!`, color: "#A78BFA" });
    }

    return list;
  }, [studySessions]);

  const taskInsights = useMemo(() => {
    const list: { icon: string; text: string; color: string }[] = [];
    if (tasks.length === 0) return list;
    const done = tasks.filter((t) => t.completed).length;
    const total = tasks.length;
    const pct = Math.round((done / total) * 100);
    list.push({ icon: "checkmark-circle-outline", text: `${pct}% of tasks completed (${done}/${total})`, color: "#2DD4BF" });
    const highPending = tasks.filter((t) => t.priority === "high" && !t.completed).length;
    if (highPending > 0) {
      list.push({ icon: "flame-outline", text: `${highPending} high-priority task${highPending > 1 ? "s" : ""} still pending`, color: "#E05A6D" });
    }
    return list;
  }, [tasks]);

  const chartConfig = {
    backgroundGradientFrom: theme.surface,
    backgroundGradientTo: theme.surface,
    decimalPlaces: 0,
    color: () => theme.primary,
    labelColor: () => theme.textSecondary,
    propsForBackgroundLines: { stroke: theme.border },
  };

  const STATS = [
    { label: "Income", value: incomeTotal, icon: "arrow-down-circle", color: theme.income, gradColors: isDark ? ["#0D2018", "#102A1E"] as [string,string] : ["#D1FAE5", "#E8FFF5"] as [string,string] },
    { label: "Expenses", value: expenseTotal, icon: "arrow-up-circle", color: theme.expense, gradColors: isDark ? ["#2A1018", "#2A1820"] as [string,string] : ["#FFE4E8", "#FFF0F2"] as [string,string] },
    { label: "Saved", value: Math.abs(saved), icon: saved >= 0 ? "trending-up" : "trending-down", color: saved >= 0 ? theme.income : theme.expense, gradColors: isDark ? ["#0D102A", "#121630"] as [string,string] : ["#EDE9FE", "#F5F0FF"] as [string,string] },
  ];

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { backgroundColor: theme.surface, opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <Text style={[styles.screenLabel, { color: theme.textSecondary }]}>Analytics</Text>
            <Text style={[styles.title, { color: theme.text }]}>Insights</Text>
          </View>
          <View style={[styles.periodRow, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.08)" : theme.border }]}>
            {(["week", "month"] as Period[]).map((p) => {
              const active = period === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => setPeriod(p)}
                  style={[styles.periodTab, { backgroundColor: active ? theme.primary : "transparent" }]}
                >
                  <Text style={[styles.periodText, { color: active ? "#fff" : isDark ? "rgba(255,255,255,0.55)" : theme.textSecondary }]}>
                    {p === "week" ? "Week" : "Month"}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        {/* Summary Stats */}
        <View style={styles.statsRow}>
          {STATS.map((stat) => (
            <LinearGradient
              key={stat.label}
              colors={stat.gradColors}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
              style={[styles.statCard, { borderColor: stat.color + "25", shadowColor: stat.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.25 : 0.1, shadowRadius: 10, elevation: 5 }]}
            >
              <View style={[styles.statIconWrap, { backgroundColor: stat.color + "20" }]}>
                <Ionicons name={stat.icon as any} size={18} color={stat.color} />
              </View>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>{stat.label}</Text>
              <Text style={[styles.statValue, { color: stat.color }]}>{formatAmount(stat.value)}</Text>
            </LinearGradient>
          ))}
        </View>

        {/* Spending by Category */}
        <View style={styles.sectionWrap}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Spending by Category</Text>
          {categoryBreakdown.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.06)" : theme.border }]}>
              <EmptyState icon="pie-chart-outline" title="No expense data yet" subtitle="Add some expenses to see your breakdown" />
            </View>
          ) : (
            <View style={[styles.chartCard, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.05)" : theme.border, shadowColor: "#000", shadowOffset: { width: 3, height: 3 }, shadowOpacity: isDark ? 0.5 : 0.06, shadowRadius: 10, elevation: 4 }]}>
              <View style={{ alignItems: "center", marginBottom: 8 }}>
                <PieChart
                  data={pieData}
                  width={screenWidth - 80}
                  height={180}
                  chartConfig={chartConfig}
                  accessor="amount"
                  backgroundColor="transparent"
                  paddingLeft="0"
                  hasLegend={false}
                />
              </View>
              <View style={styles.legendList}>
                {categoryBreakdown.map((c) => (
                  <View key={c.category} style={styles.legendItem}>
                    <View style={[styles.legendDot, { backgroundColor: c.color, shadowColor: c.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.8, shadowRadius: 4 }]} />
                    <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>{c.label}</Text>
                    <View style={[styles.legendBar, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)" }]}>
                      <View style={[styles.legendBarFill, { width: `${c.percent}%`, backgroundColor: c.color }]} />
                    </View>
                    <Text style={[styles.legendPct, { color: theme.text }]}>{c.percent.toFixed(0)}%</Text>
                    <Text style={[styles.legendValue, { color: theme.textSecondary }]}>{formatAmount(c.amount)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Smart Insights */}
        {insights.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: theme.primary + "20" }]}>
                <Ionicons name="bulb-outline" size={16} color={theme.primary} />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Spending Insights</Text>
            </View>
            <View style={{ gap: 10 }}>
              {insights.map((insight, i) => (
                <LinearGradient
                  key={i}
                  colors={[insight.color + "15", insight.color + "08"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.insightCard, { borderColor: insight.color + "25", shadowColor: insight.color, shadowOffset: { width: 0, height: 3 }, shadowOpacity: isDark ? 0.2 : 0.08, shadowRadius: 8, elevation: 3 }]}
                >
                  <View style={[styles.insightIcon, { backgroundColor: insight.color + "20", borderWidth: 1, borderColor: insight.color + "30" }]}>
                    <Ionicons name={insight.icon as any} size={18} color={insight.color} />
                  </View>
                  <Text style={[styles.insightText, { color: theme.text }]}>{insight.text}</Text>
                </LinearGradient>
              ))}
            </View>
          </View>
        )}

        {/* Study Insights */}
        {studyInsights.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: "#6366F120" }]}>
                <Ionicons name="timer-outline" size={16} color="#6366F1" />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Study Insights</Text>
            </View>
            <View style={{ gap: 10 }}>
              {studyInsights.map((insight, i) => (
                <LinearGradient
                  key={i}
                  colors={[insight.color + "15", insight.color + "08"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.insightCard, { borderColor: insight.color + "25", shadowColor: insight.color, shadowOffset: { width: 0, height: 3 }, shadowOpacity: isDark ? 0.2 : 0.08, shadowRadius: 8, elevation: 3 }]}
                >
                  <View style={[styles.insightIcon, { backgroundColor: insight.color + "20", borderWidth: 1, borderColor: insight.color + "30" }]}>
                    <Ionicons name={insight.icon as any} size={18} color={insight.color} />
                  </View>
                  <Text style={[styles.insightText, { color: theme.text }]}>{insight.text}</Text>
                </LinearGradient>
              ))}
            </View>
          </View>
        )}

        {/* Task Insights */}
        {taskInsights.length > 0 && (
          <View style={styles.sectionWrap}>
            <View style={styles.sectionHeader}>
              <View style={[styles.sectionIconWrap, { backgroundColor: "#F59E0B20" }]}>
                <Ionicons name="checkbox-outline" size={16} color="#F59E0B" />
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Task Insights</Text>
            </View>
            <View style={{ gap: 10 }}>
              {taskInsights.map((insight, i) => (
                <LinearGradient
                  key={i}
                  colors={[insight.color + "15", insight.color + "08"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={[styles.insightCard, { borderColor: insight.color + "25", shadowColor: insight.color, shadowOffset: { width: 0, height: 3 }, shadowOpacity: isDark ? 0.2 : 0.08, shadowRadius: 8, elevation: 3 }]}
                >
                  <View style={[styles.insightIcon, { backgroundColor: insight.color + "20", borderWidth: 1, borderColor: insight.color + "30" }]}>
                    <Ionicons name={insight.icon as any} size={18} color={insight.color} />
                  </View>
                  <Text style={[styles.insightText, { color: theme.text }]}>{insight.text}</Text>
                </LinearGradient>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  screenLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  periodRow: { flexDirection: "row", borderRadius: 100, padding: 4, borderWidth: 1 },
  periodTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 100,
  },
  periodText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  statsRow: { flexDirection: "row", paddingHorizontal: 20, gap: 10, marginBottom: 24 },
  statCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
  },
  statIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  statValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  sectionWrap: { paddingHorizontal: 20, marginBottom: 20 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  sectionIconWrap: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  emptyCard: { borderRadius: 18, borderWidth: 1, overflow: "hidden" },
  chartCard: { borderRadius: 18, borderWidth: 1, padding: 18 },
  legendList: { gap: 10, marginTop: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { width: 80, fontSize: 12, fontFamily: "Inter_400Regular" },
  legendBar: { flex: 1, height: 5, borderRadius: 3, overflow: "hidden" },
  legendBarFill: { height: "100%", borderRadius: 3 },
  legendPct: { fontSize: 12, fontFamily: "Inter_600SemiBold", minWidth: 30, textAlign: "right" },
  legendValue: { fontSize: 11, fontFamily: "Inter_400Regular", minWidth: 60, textAlign: "right" },
  insightCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
  },
  insightIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  insightText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
