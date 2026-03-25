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

const EMPTY_MESSAGES: Record<FilterType, { icon: string; title: string; subtitle: string }> = {
  all: { icon: "receipt-outline", title: "No transactions yet", subtitle: "Add your first income or expense to get started" },
  income: { icon: "arrow-down-circle-outline", title: "No income transactions", subtitle: "Record your first salary, allowance, or earnings" },
  expense: { icon: "arrow-up-circle-outline", title: "No expense transactions", subtitle: "Log your first spending to track where money goes" },
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

  const totalIncome = useMemo(
    () => transactions.filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const totalExpense = useMemo(
    () => transactions.filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const netBalance = totalIncome - totalExpense;

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

  const FILTERS: { key: FilterType; label: string; icon: string }[] = [
    { key: "all", label: "All", icon: "layers-outline" },
    { key: "income", label: "Income", icon: "arrow-down-circle-outline" },
    { key: "expense", label: "Expense", icon: "arrow-up-circle-outline" },
  ];

  const activeColor =
    filter === "income" ? theme.income : filter === "expense" ? theme.expense : theme.primary;

  const empty = EMPTY_MESSAGES[filter];

  return (
    <ScreenWrapper>
      {/* ── Header ── */}
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
          onPress={() =>
            router.push({ pathname: "/add-transaction", params: { type: "expense" } })
          }
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

      {/* ── Summary Row ── */}
      <View style={styles.summaryRow}>
        {/* Income */}
        <LinearGradient
          colors={isDark ? ["#0D2018", "#102A1E"] : ["#D1FAE5", "#E8FFF5"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[
            styles.summaryCard,
            {
              borderColor: theme.income + "25",
              shadowColor: theme.income,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.25 : 0.1,
              shadowRadius: 10,
              elevation: 5,
            },
          ]}
        >
          <View style={[styles.summaryIconWrap, { backgroundColor: theme.income + "20" }]}>
            <Ionicons name="arrow-down-circle" size={16} color={theme.income} />
          </View>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Income</Text>
          <Text style={[styles.summaryValue, { color: theme.income }]} numberOfLines={1}>
            {formatCurrency(totalIncome)}
          </Text>
        </LinearGradient>

        {/* Net Balance (center) */}
        <LinearGradient
          colors={isDark ? ["#12101A", "#1A1428"] : ["#EDE8FF", "#F5F0FF"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[
            styles.summaryCard,
            {
              borderColor: theme.primary + "25",
              shadowColor: theme.primary,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.2 : 0.08,
              shadowRadius: 10,
              elevation: 5,
            },
          ]}
        >
          <View style={[styles.summaryIconWrap, { backgroundColor: theme.primary + "20" }]}>
            <Ionicons name="wallet-outline" size={16} color={theme.primary} />
          </View>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Net</Text>
          <Text
            style={[
              styles.summaryValue,
              { color: netBalance >= 0 ? theme.income : theme.expense },
            ]}
            numberOfLines={1}
          >
            {netBalance >= 0 ? "+" : ""}{formatCurrency(Math.abs(netBalance))}
          </Text>
        </LinearGradient>

        {/* Expenses */}
        <LinearGradient
          colors={isDark ? ["#2A1018", "#2A1820"] : ["#FFE4E8", "#FFF0F2"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[
            styles.summaryCard,
            {
              borderColor: theme.expense + "25",
              shadowColor: theme.expense,
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDark ? 0.25 : 0.1,
              shadowRadius: 10,
              elevation: 5,
            },
          ]}
        >
          <View style={[styles.summaryIconWrap, { backgroundColor: theme.expense + "20" }]}>
            <Ionicons name="arrow-up-circle" size={16} color={theme.expense} />
          </View>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>Expenses</Text>
          <Text style={[styles.summaryValue, { color: theme.expense }]} numberOfLines={1}>
            {formatCurrency(totalExpense)}
          </Text>
        </LinearGradient>
      </View>

      {/* ── Segmented Control ── */}
      <View
        style={[
          styles.segmentWrap,
          {
            backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)",
            borderColor: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)",
          },
        ]}
      >
        {FILTERS.map((f) => {
          const active = filter === f.key;
          const fColor =
            f.key === "income" ? theme.income : f.key === "expense" ? theme.expense : theme.primary;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={({ pressed }) => [
                styles.segmentBtn,
                active
                  ? {
                      backgroundColor: fColor + "18",
                      borderColor: fColor + "50",
                      shadowColor: fColor,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.3,
                      shadowRadius: 6,
                      elevation: 3,
                    }
                  : { borderColor: "transparent" },
                { opacity: pressed ? 0.8 : 1 },
              ]}
            >
              <Ionicons
                name={f.icon as any}
                size={14}
                color={active ? fColor : theme.textTertiary}
              />
              <Text
                style={[
                  styles.segmentText,
                  { color: active ? fColor : theme.textTertiary },
                  active && { fontFamily: "Inter_700Bold" },
                ]}
              >
                {f.label}
              </Text>
              {active && (
                <View style={[styles.segmentDot, { backgroundColor: fColor }]} />
              )}
            </Pressable>
          );
        })}
      </View>

      {/* ── Count Badge ── */}
      <View style={styles.countRow}>
        <Text style={[styles.countText, { color: theme.textTertiary }]}>
          {filtered.length} {filtered.length === 1 ? "transaction" : "transactions"}
          {filter !== "all" ? ` · ${filter}` : ""}
        </Text>
        <View style={[styles.countDivider, { backgroundColor: theme.border }]} />
      </View>

      {/* ── Transaction List ── */}
      <FlatList
        data={groupedByDate}
        keyExtractor={([date]) => date}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
          paddingTop: 4,
          flexGrow: 1,
        }}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <View
              style={[
                styles.emptyIconWrap,
                {
                  backgroundColor: activeColor + "12",
                  borderColor: activeColor + "25",
                },
              ]}
            >
              <Ionicons name={empty.icon as any} size={36} color={activeColor} />
            </View>
            <Text style={[styles.emptyTitle, { color: theme.text }]}>{empty.title}</Text>
            <Text style={[styles.emptySub, { color: theme.textSecondary }]}>{empty.subtitle}</Text>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: "/add-transaction",
                  params: { type: filter === "income" ? "income" : "expense" },
                })
              }
              style={({ pressed }) => [
                styles.emptyBtn,
                {
                  backgroundColor: activeColor,
                  shadowColor: activeColor,
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                  elevation: 5,
                  opacity: pressed ? 0.85 : 1,
                },
              ]}
            >
              <Ionicons name="add" size={16} color="#fff" />
              <Text style={styles.emptyBtnText}>
                {filter === "income" ? "Add Income" : filter === "expense" ? "Add Expense" : "Add Transaction"}
              </Text>
            </Pressable>
          </View>
        }
        renderItem={({ item: [date, txs] }) => (
          <View style={styles.group}>
            {/* Date divider */}
            <View style={styles.groupDateRow}>
              <View style={[styles.groupDateLine, { backgroundColor: theme.border }]} />
              <View style={[styles.groupDateBadge, { backgroundColor: theme.surface, borderColor: theme.border }]}>
                <Text style={[styles.groupDate, { color: theme.textTertiary }]}>{date}</Text>
              </View>
              <View style={[styles.groupDateLine, { backgroundColor: theme.border }]} />
            </View>

            {/* Transaction cards */}
            <View style={{ gap: 10 }}>
              {txs.map((tx) => {
                const catColor = getCategoryColor(tx.category);
                const catIcon = (CAT_ICONS[tx.category] ?? "ellipsis-horizontal-circle") as any;
                const wallet = wallets.find((w) => w.id === tx.walletId);
                const isIncome = tx.type === "income";
                const typeColor = isIncome ? theme.income : theme.expense;

                return (
                  <Pressable
                    key={tx.id}
                    onPress={() =>
                      router.push({ pathname: "/transaction-detail", params: { id: tx.id } })
                    }
                    style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                  >
                    <Card accentColor={catColor} style={styles.txCard}>
                      {/* Left type stripe */}
                      <View style={[styles.typeStripe, { backgroundColor: typeColor }]} />

                      {/* Category icon */}
                      <View
                        style={[
                          styles.txIcon,
                          {
                            backgroundColor: catColor + "18",
                            borderWidth: 1,
                            borderColor: catColor + "30",
                            shadowColor: catColor,
                            shadowOffset: { width: 0, height: 0 },
                            shadowOpacity: isDark ? 0.45 : 0.15,
                            shadowRadius: 8,
                          },
                        ]}
                      >
                        <Ionicons name={catIcon} size={20} color={catColor} />
                      </View>

                      {/* Info */}
                      <View style={styles.txInfo}>
                        <View style={styles.txTopRow}>
                          <Text style={[styles.txCategory, { color: theme.text }]}>
                            {tx.category.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                          </Text>
                          <View style={[styles.typeBadge, { backgroundColor: typeColor + "18" }]}>
                            <Text style={[styles.typeBadgeText, { color: typeColor }]}>
                              {isIncome ? "IN" : "OUT"}
                            </Text>
                          </View>
                        </View>
                        <View style={styles.txMetaRow}>
                          {wallet && (
                            <View style={styles.txMetaItem}>
                              <Ionicons name="wallet-outline" size={10} color={theme.textTertiary} />
                              <Text style={[styles.txMeta, { color: theme.textTertiary }]}>
                                {wallet.name}
                              </Text>
                            </View>
                          )}
                          {tx.note ? (
                            <Text
                              style={[styles.txMeta, { color: theme.textSecondary, flex: 1 }]}
                              numberOfLines={1}
                            >
                              {wallet ? "· " : ""}{tx.note}
                            </Text>
                          ) : null}
                        </View>
                      </View>

                      {/* Amount + time */}
                      <View style={styles.txRight}>
                        <Text style={[styles.txAmount, { color: typeColor }]}>
                          {isIncome ? "+" : "−"}{formatCurrency(tx.amount)}
                        </Text>
                        <Text style={[styles.txTime, { color: theme.textTertiary }]}>
                          {new Date(tx.date).toLocaleTimeString("en-PH", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
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

  /* Summary */
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 18,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 16,
    padding: 12,
    gap: 5,
    borderWidth: 1,
  },
  summaryIconWrap: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  summaryLabel: { fontSize: 11, fontFamily: "Inter_400Regular" },
  summaryValue: { fontSize: 13, fontFamily: "Inter_700Bold" },

  /* Segmented control */
  segmentWrap: {
    flexDirection: "row",
    marginHorizontal: 20,
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginBottom: 12,
  },
  segmentBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 11,
    borderWidth: 1,
    gap: 5,
  },
  segmentText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  segmentDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    marginLeft: 1,
  },

  /* Count row */
  countRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 10,
  },
  countText: { fontSize: 11, fontFamily: "Inter_500Medium" },
  countDivider: { flex: 1, height: 1 },

  /* Empty state */
  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
    paddingHorizontal: 32,
    gap: 12,
  },
  emptyIconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    marginBottom: 4,
  },
  emptyTitle: { fontSize: 17, fontFamily: "Inter_700Bold", textAlign: "center" },
  emptySub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 22,
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 4,
  },
  emptyBtnText: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#fff",
  },

  /* Groups */
  group: { marginBottom: 20 },
  groupDateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 10,
  },
  groupDateLine: { flex: 1, height: 1 },
  groupDateBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
    borderWidth: 1,
  },
  groupDate: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.7,
  },

  /* Transaction card */
  txCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    overflow: "hidden",
  },
  typeStripe: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  txIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  txInfo: { flex: 1, gap: 4 },
  txTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 6,
  },
  txCategory: { fontSize: 14, fontFamily: "Inter_600SemiBold", flex: 1 },
  typeBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeBadgeText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  txMetaRow: { flexDirection: "row", alignItems: "center", gap: 4, flexWrap: "wrap" },
  txMetaItem: { flexDirection: "row", alignItems: "center", gap: 3 },
  txMeta: { fontSize: 11, fontFamily: "Inter_400Regular" },
  txRight: { alignItems: "flex-end", gap: 4 },
  txAmount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  txTime: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
