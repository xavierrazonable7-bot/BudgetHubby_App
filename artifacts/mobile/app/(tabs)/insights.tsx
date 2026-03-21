import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Pressable, Platform, Dimensions } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { PieChart, BarChart } from "react-native-chart-kit";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { formatCurrency, isThisWeek, isThisMonth } from "@/utils/format";
import { getCategoryLabel, getCategoryColor } from "@/utils/categories";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type Period = "week" | "month";

const { width: screenWidth } = Dimensions.get("window");

export default function InsightsScreen() {
  const { theme, isDark } = useTheme();
  const { transactions, monthlyIncome, monthlyExpenses } = useApp();
  const insets = useSafeAreaInsets();
  const [period, setPeriod] = useState<Period>("month");

  const periodTransactions = useMemo(() => {
    return transactions.filter((t) =>
      period === "week" ? isThisWeek(t.date) : isThisMonth(t.date)
    );
  }, [transactions, period]);

  const expenses = useMemo(() => periodTransactions.filter((t) => t.type === "expense"), [periodTransactions]);
  const incomeTotal = useMemo(() => periodTransactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0), [periodTransactions]);
  const expenseTotal = useMemo(() => expenses.reduce((s, t) => s + t.amount, 0), [expenses]);
  const saved = incomeTotal - expenseTotal;

  const categoryBreakdown = useMemo(() => {
    const map: Record<string, number> = {};
    expenses.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + t.amount;
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([cat, amount]) => ({
        category: cat,
        amount,
        label: getCategoryLabel(cat),
        color: getCategoryColor(cat),
        percent: expenseTotal > 0 ? (amount / expenseTotal) * 100 : 0,
      }));
  }, [expenses, expenseTotal]);

  const pieData = categoryBreakdown.map((c) => ({
    name: c.label,
    amount: c.amount,
    color: c.color,
    legendFontColor: theme.textSecondary,
    legendFontSize: 12,
  }));

  const chartWidth = screenWidth - 40;

  const insights = useMemo(() => {
    const list: { icon: string; text: string; color: string }[] = [];
    if (categoryBreakdown.length > 0) {
      const top = categoryBreakdown[0];
      list.push({
        icon: "bulb-outline",
        text: `You spent ${top.percent.toFixed(0)}% on ${top.label} this ${period}`,
        color: theme.primary,
      });
    }
    if (saved > 0) {
      list.push({
        icon: "trending-up-outline",
        text: `You saved ${formatCurrency(saved)} this ${period}`,
        color: theme.accent,
      });
    } else if (saved < 0) {
      list.push({
        icon: "warning-outline",
        text: `You overspent by ${formatCurrency(Math.abs(saved))} this ${period}`,
        color: theme.danger,
      });
    }
    if (expenseTotal > 0 && incomeTotal > 0) {
      const pct = (expenseTotal / incomeTotal) * 100;
      list.push({
        icon: "stats-chart-outline",
        text: `You spent ${pct.toFixed(0)}% of your income this ${period}`,
        color: theme.warning,
      });
    }
    return list;
  }, [categoryBreakdown, saved, expenseTotal, incomeTotal, period]);

  const chartConfig = {
    backgroundGradientFrom: theme.card,
    backgroundGradientTo: theme.card,
    decimalPlaces: 0,
    color: () => theme.primary,
    labelColor: () => theme.textSecondary,
    propsForBackgroundLines: { stroke: theme.border },
    style: { borderRadius: 16 },
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Insights</Text>
          <View style={styles.periodRow}>
            {(["week", "month"] as Period[]).map((p) => (
              <Pressable
                key={p}
                onPress={() => setPeriod(p)}
                style={[
                  styles.periodTab,
                  { backgroundColor: period === p ? theme.primary : theme.surfaceSecondary },
                ]}
              >
                <Text style={[styles.periodText, { color: period === p ? "#fff" : theme.textSecondary }]}>
                  {p === "week" ? "Week" : "Month"}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          <Card style={styles.summaryCard} elevation>
            <Ionicons name="arrow-down-circle" size={22} color={theme.accent} />
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Income</Text>
            <Text style={[styles.summaryValue, { color: theme.accent }]}>{formatCurrency(incomeTotal)}</Text>
          </Card>
          <Card style={styles.summaryCard} elevation>
            <Ionicons name="arrow-up-circle" size={22} color={theme.danger} />
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Expenses</Text>
            <Text style={[styles.summaryValue, { color: theme.danger }]}>{formatCurrency(expenseTotal)}</Text>
          </Card>
          <Card style={styles.summaryCard} elevation>
            <Ionicons name="save" size={22} color={saved >= 0 ? theme.accent : theme.danger} />
            <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Saved</Text>
            <Text style={[styles.summaryValue, { color: saved >= 0 ? theme.accent : theme.danger }]}>
              {formatCurrency(Math.abs(saved))}
            </Text>
          </Card>
        </View>

        {/* Spending by Category */}
        {categoryBreakdown.length === 0 ? (
          <Card style={{ marginHorizontal: 20, marginBottom: 16 }}>
            <EmptyState
              icon="pie-chart-outline"
              title="No expense data yet"
              subtitle="Add some expenses to see your breakdown"
            />
          </Card>
        ) : (
          <>
            <Card style={{ marginHorizontal: 20, marginBottom: 16, overflow: "hidden" }}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>Spending by Category</Text>
              <View style={{ alignItems: "center", marginTop: 8 }}>
                <PieChart
                  data={pieData}
                  width={chartWidth}
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
                    <View style={[styles.legendDot, { backgroundColor: c.color }]} />
                    <Text style={[styles.legendLabel, { color: theme.textSecondary }]}>{c.label}</Text>
                    <Text style={[styles.legendAmount, { color: theme.text }]}>{c.percent.toFixed(0)}%</Text>
                    <Text style={[styles.legendValue, { color: theme.textSecondary }]}>{formatCurrency(c.amount)}</Text>
                  </View>
                ))}
              </View>
            </Card>
          </>
        )}

        {/* Smart Insights */}
        {insights.length > 0 && (
          <View style={{ paddingHorizontal: 20, marginBottom: 16 }}>
            <Text style={[styles.sectionTitle, { color: theme.text, marginBottom: 10 }]}>
              Smart Insights
            </Text>
            <View style={{ gap: 8 }}>
              {insights.map((insight, i) => (
                <Card key={i} style={styles.insightCard} elevation>
                  <View style={[styles.insightIcon, { backgroundColor: insight.color + "20" }]}>
                    <Ionicons name={insight.icon as any} size={18} color={insight.color} />
                  </View>
                  <Text style={[styles.insightText, { color: theme.text }]}>{insight.text}</Text>
                </Card>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  periodRow: { flexDirection: "row", gap: 6 },
  periodTab: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20 },
  periodText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  summaryCard: { flex: 1, gap: 4, padding: 12, alignItems: "flex-start" },
  summaryLabel: { fontSize: 11, fontFamily: "Inter_500Medium" },
  summaryValue: { fontSize: 14, fontFamily: "Inter_700Bold" },
  sectionTitle: { fontSize: 16, fontFamily: "Inter_700Bold", marginBottom: 4 },
  legendList: { gap: 10, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },
  legendAmount: { fontSize: 13, fontFamily: "Inter_600SemiBold", minWidth: 36 },
  legendValue: { fontSize: 12, fontFamily: "Inter_400Regular", minWidth: 70, textAlign: "right" },
  insightCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  insightIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  insightText: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
});
