import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { PieChart } from "react-native-chart-kit";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { formatCurrency, isThisWeek, isThisMonth } from "@/utils/format";
import { getCategoryLabel, getCategoryColor } from "@/utils/categories";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { EmptyState } from "@/components/ui/EmptyState";

type Period = "week" | "month";
const { width: screenWidth } = Dimensions.get("window");

export default function InsightsScreen() {
  const { theme, isDark } = useTheme();
  const { transactions, monthlyIncome, monthlyExpenses } = useApp();
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
      list.push({ icon: "trending-up-outline", text: `You saved ${formatCurrency(saved)} this ${period}`, color: theme.income });
    } else if (saved < 0) {
      list.push({ icon: "warning-outline", text: `You overspent by ${formatCurrency(Math.abs(saved))} this ${period}`, color: theme.expense });
    }
    if (expenseTotal > 0 && incomeTotal > 0) {
      const pct = (expenseTotal / incomeTotal) * 100;
      list.push({ icon: "stats-chart-outline", text: `You spent ${pct.toFixed(0)}% of your income this ${period}`, color: theme.warning });
    }
    return list;
  }, [categoryBreakdown, saved, expenseTotal, incomeTotal, period]);

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
          <View>
            <Text style={[styles.screenLabel, { color: theme.textSecondary }]}>Analytics</Text>
            <Text style={[styles.title, { color: theme.text }]}>Insights</Text>
          </View>
          <View style={styles.periodRow}>
            {(["week", "month"] as Period[]).map((p) => {
              const active = period === p;
              return (
                <Pressable
                  key={p}
                  onPress={() => setPeriod(p)}
                  style={[
                    styles.periodTab,
                    active
                      ? { backgroundColor: theme.primary + "20", borderColor: theme.primary + "50" }
                      : { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.06)" : theme.border },
                  ]}
                >
                  <Text style={[styles.periodText, { color: active ? theme.primary : theme.textSecondary }]}>
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
              <Text style={[styles.statValue, { color: stat.color }]}>{formatCurrency(stat.value)}</Text>
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
                    <Text style={[styles.legendValue, { color: theme.textSecondary }]}>{formatCurrency(c.amount)}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Smart Insights */}
        {insights.length > 0 && (
          <View style={styles.sectionWrap}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Smart Insights</Text>
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
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  screenLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  periodRow: { flexDirection: "row", gap: 6, alignItems: "center" },
  periodTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
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
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold", marginBottom: 12 },
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
