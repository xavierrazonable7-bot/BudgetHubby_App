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
import { useTheme } from "@/context/ThemeContext";
import { useApp, Transaction } from "@/context/AppContext";
import { TransactionItem } from "@/components/TransactionItem";
import { EmptyState } from "@/components/ui/EmptyState";

type FilterType = "all" | "income" | "expense";

export default function TransactionsScreen() {
  const { theme } = useTheme();
  const { transactions } = useApp();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<FilterType>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return transactions;
    return transactions.filter((t) => t.type === filter);
  }, [transactions, filter]);

  const groupedByDate = useMemo(() => {
    const groups: Record<string, Transaction[]> = {};
    filtered.forEach((tx) => {
      const date = new Date(tx.date);
      const key = date.toLocaleDateString("en-PH", {
        weekday: "long",
        month: "long",
        day: "numeric",
      });
      if (!groups[key]) groups[key] = [];
      groups[key].push(tx);
    });
    return Object.entries(groups);
  }, [filtered]);

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <Text style={[styles.title, { color: theme.text }]}>Transactions</Text>
        <Pressable
          onPress={() => router.push({ pathname: "/add-transaction", params: { type: "expense" } })}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterRow, { backgroundColor: theme.background }]}>
        {(["all", "income", "expense"] as FilterType[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterTab,
              {
                backgroundColor: filter === f ? theme.primary : theme.surfaceSecondary,
              },
            ]}
          >
            <Text
              style={[
                styles.filterText,
                { color: filter === f ? "#fff" : theme.textSecondary },
              ]}
            >
              {f === "all" ? "All" : f === "income" ? "Income" : "Expense"}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={groupedByDate}
        keyExtractor={([date]) => date}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
          paddingTop: 12,
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
            <Text style={[styles.groupDate, { color: theme.textSecondary }]}>{date}</Text>
            {txs.map((tx, idx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                index={idx}
                onPress={() =>
                  router.push({ pathname: "/transaction-detail", params: { id: tx.id } })
                }
              />
            ))}
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  group: { marginBottom: 16 },
  groupDate: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
});
