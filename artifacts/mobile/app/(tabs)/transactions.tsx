import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import { useApp, Transaction } from "@/context/AppContext";
import { formatCurrency } from "@/utils/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { Card } from "@/components/ui/Card";
import { getCategoryColor } from "@/utils/categories";

type FilterType = "all" | "income" | "expense";

const CAT_ICONS: Record<string, string> = {
  food: "fast-food", transport: "car", school: "school",
  shopping: "bag", entertainment: "game-controller", health: "medkit",
  utilities: "flash", rent: "home", savings: "save",
  allowance: "wallet", salary: "briefcase", freelance: "laptop",
  gift: "gift", investment: "trending-up", other: "ellipsis-horizontal-circle",
  other_income: "add-circle",
};

export default function TransactionsScreen() {
  const { theme, isDark } = useTheme();
  const { transactions, wallets } = useApp();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  const totalIncome = useMemo(() => transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0), [transactions]);
  const totalExpense = useMemo(() => transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0), [transactions]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach((tx) => {
      const date = new Date(tx.date);
      const key = date.toLocaleDateString("en-PH", {
        weekday: "long", month: "long", day: "numeric",
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return Object.entries(groups);
  }, [filtered]);

  const FILTERS: { key: FilterType; label: string; color: string }[] = [
    { key: "all", label: "All", color: theme.primary },
    { key: "income", label: "Income", color: theme.income },
    { key: "expense", label: "Expense", color: theme.expense },
  ];

  return (
    <ScreenWrapper>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 },
        ]}
      >
        <View>
          <Text style={[styles.screenLabel, { color: theme.textSecondary }]}>Overview</Text>
          <Text style={[styles.title, { color: theme.text }]}>Transactions</Text>
        </View>
        <Pressable
          onPress={() => router.push({ pathname: "/add-transaction", params: { type: "expense" } })}
          style={({ pressed }) => [
            styles.addBtn,
            {
              backgroundColor: theme.primary,
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.4,
              shadowRadius: 10,
              elevation: 6,
              opacity: pressed ? 0.85 : 1,
            },
          ]}
        >
          <Ionicons name="add" size={22} color="#fff" />
        </Pressable>
      </View>

      {/* Summary Row */}
      <View style={styles.summaryRow}>
        <LinearGradient
          colors={isDark ? ["#0D2018", "#102A1E"] : ["#D1FAE5", "#E8FFF5"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.summaryCard, { borderColor: theme.income + "25", shadowColor: theme.income, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.25 : 0.1, shadowRadius: 10, elevation: 5 }]}
        >
          <View style={[styles.summaryIconWrap, { backgroundColor: theme.income + "20" }]}>
            <Ionicons name="arrow-down-circle" size={18} color={theme.income} />
          </View>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Income</Text>
          <Text style={[styles.summaryValue, { color: theme.income }]}>{formatCurrency(totalIncome)}</Text>
        </LinearGradient>
        <LinearGradient
          colors={isDark ? ["#2A1018", "#2A1820"] : ["#FFE4E8", "#FFF0F2"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.summaryCard, { borderColor: theme.expense + "25", shadowColor: theme.expense, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.25 : 0.1, shadowRadius: 10, elevation: 5 }]}
        >
          <View style={[styles.summaryIconWrap, { backgroundColor: theme.expense + "20" }]}>
            <Ionicons name="arrow-up-circle" size={18} color={theme.expense} />
          </View>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Expenses</Text>
          <Text style={[styles.summaryValue, { color: theme.expense }]}>{formatCurrency(totalExpense)}</Text>
        </LinearGradient>
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={({ pressed }) => [
                styles.filterTab,
                active
                  ? {
                      backgroundColor: f.color + "20",
                      borderColor: f.color + "50",
                      shadowColor: f.color,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                      elevation: 3,
                    }
                  : { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.06)" : theme.border },
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              {active && (
                <View style={[styles.filterDot, { backgroundColor: f.color }]} />
              )}
              <Text style={[styles.filterText, { color: active ? f.color : theme.textSecondary }]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={groupedByDate}
        keyExtractor={([date]) => date}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
          paddingTop: 8,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="receipt-outline"
            title="No transactions"
            subtitle="Add your first income or expense"
          />
        }
        renderItem={({ item: [date, txs] }) => (
          <View style={styles.group}>
            <View style={styles.groupDateRow}>
              <View style={[styles.groupDateLine, { backgroundColor: theme.border }]} />
              <Text style={[styles.groupDate, { color: theme.textTertiary }]}>{date}</Text>
              <View style={[styles.groupDateLine, { backgroundColor: theme.border }]} />
            </View>
            <View style={{ gap: 10 }}>
              {txs.map((tx) => {
                const catColor = getCategoryColor(tx.category);
                const catIcon = (CAT_ICONS[tx.category] ?? "ellipsis-horizontal-circle") as any;
                const wallet = wallets.find((w) => w.id === tx.walletId);
                const isIncome = tx.type === "income";
                return (
                  <Pressable
                    key={tx.id}
                    onPress={() => router.push({ pathname: "/transaction-detail", params: { id: tx.id } })}
                    style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                  >
                    <Card
                      accentColor={catColor}
                      style={styles.txCard}
                    >
                      <View
                        style={[
                          styles.txIcon,
                          {
                            backgroundColor: catColor + "18",
                            borderWidth: 1,
                            borderColor: catColor + "30",
                            shadowColor: catColor,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: isDark ? 0.5 : 0.2,
                            shadowRadius: 8,
                          },
                        ]}
                      >
                        <Ionicons name={catIcon} size={20} color={catColor} />
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={[styles.txCategory, { color: theme.text }]}>
                          {tx.category.replace("_", " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                        </Text>
                        {tx.note ? (
                          <Text style={[styles.txNote, { color: theme.textTertiary }]} numberOfLines={1}>
                            {tx.note}
                          </Text>
                        ) : (
                          <Text style={[styles.txNote, { color: theme.textTertiary }]}>
                            {wallet?.name ?? "Wallet"}
                          </Text>
                        )}
                      </View>
                      <View style={styles.txRight}>
                        <Text style={[styles.txAmount, { color: isIncome ? theme.income : theme.expense }]}>
                          {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
                        </Text>
                        <Text style={[styles.txTime, { color: theme.textTertiary }]}>
                          {new Date(tx.date).toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}
                        </Text>
                      </View>
                    </Card>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "flex-end",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  screenLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 2 },
  title: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 14,
    gap: 6,
    borderWidth: 1,
  },
  summaryIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  summaryValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 8,
  },
  filterTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 22,
    borderWidth: 1,
    gap: 6,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  group: { marginBottom: 20 },
  groupDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  groupDateLine: { flex: 1, height: 1 },
  groupDate: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  txCard: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  txIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  txInfo: { flex: 1 },
  txCategory: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  txNote: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 3 },
  txRight: { alignItems: "flex-end", gap: 4 },
  txAmount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  txTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
