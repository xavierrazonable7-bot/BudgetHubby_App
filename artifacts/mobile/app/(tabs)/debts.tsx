import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInRight } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp, Debt } from "@/context/AppContext";
import { formatCurrency, formatDate } from "@/utils/format";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";

type DebtFilter = "all" | "lent" | "borrowed";

export default function DebtsScreen() {
  const { theme } = useTheme();
  const { debts, updateDebt, deleteDebt } = useApp();
  const insets = useSafeAreaInsets();
  const [filter, setFilter] = useState<DebtFilter>("all");

  const filtered = useMemo(() => {
    if (filter === "all") return debts;
    return debts.filter((d) => d.type === filter);
  }, [debts, filter]);

  const totalLent = useMemo(
    () => debts.filter((d) => d.type === "lent" && d.status === "pending").reduce((s, d) => s + (d.amount - d.paidAmount), 0),
    [debts]
  );
  const totalBorrowed = useMemo(
    () => debts.filter((d) => d.type === "borrowed" && d.status === "pending").reduce((s, d) => s + (d.amount - d.paidAmount), 0),
    [debts]
  );

  const handleMarkPaid = (debt: Debt) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    updateDebt(debt.id, { status: "paid", paidAmount: debt.amount });
  };

  const handleDelete = (id: string) => {
    Alert.alert("Delete Debt", "Remove this debt record?", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => deleteDebt(id) },
    ]);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 },
        ]}
      >
        <Text style={[styles.title, { color: theme.text }]}>Debts</Text>
        <Pressable
          onPress={() => router.push("/add-debt")}
          style={[styles.addBtn, { backgroundColor: theme.primary }]}
        >
          <Ionicons name="add" size={20} color="#fff" />
        </Pressable>
      </View>

      {/* Summary */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: theme.accentLight }]}>
          <Ionicons name="arrow-down-circle" size={20} color={theme.accent} />
          <Text style={[styles.summaryLabel, { color: theme.accent }]}>They owe you</Text>
          <Text style={[styles.summaryAmount, { color: theme.accent }]}>
            {formatCurrency(totalLent)}
          </Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: theme.dangerLight }]}>
          <Ionicons name="arrow-up-circle" size={20} color={theme.danger} />
          <Text style={[styles.summaryLabel, { color: theme.danger }]}>You owe</Text>
          <Text style={[styles.summaryAmount, { color: theme.danger }]}>
            {formatCurrency(totalBorrowed)}
          </Text>
        </View>
      </View>

      {/* Filter */}
      <View style={styles.filterRow}>
        {(["all", "lent", "borrowed"] as DebtFilter[]).map((f) => (
          <Pressable
            key={f}
            onPress={() => setFilter(f)}
            style={[
              styles.filterTab,
              { backgroundColor: filter === f ? theme.primary : theme.surfaceSecondary },
            ]}
          >
            <Text style={[styles.filterText, { color: filter === f ? "#fff" : theme.textSecondary }]}>
              {f === "all" ? "All" : f === "lent" ? "Lent" : "Borrowed"}
            </Text>
          </Pressable>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
          paddingTop: 8,
          gap: 10,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No debts recorded"
            subtitle="Track money you lent or borrowed"
          />
        }
        renderItem={({ item: debt, index }) => (
          <Animated.View entering={FadeInRight.delay(index * 40).duration(300)}>
            <Card>
              <View style={styles.debtRow}>
                <View
                  style={[
                    styles.debtIcon,
                    {
                      backgroundColor:
                        debt.type === "lent" ? theme.accentLight : theme.dangerLight,
                    },
                  ]}
                >
                  <Ionicons
                    name={debt.type === "lent" ? "arrow-down" : "arrow-up"}
                    size={18}
                    color={debt.type === "lent" ? theme.accent : theme.danger}
                  />
                </View>
                <View style={styles.debtInfo}>
                  <View style={styles.debtTop}>
                    <Text style={[styles.debtName, { color: theme.text }]}>
                      {debt.personName}
                    </Text>
                    <View
                      style={[
                        styles.statusBadge,
                        {
                          backgroundColor:
                            debt.status === "paid"
                              ? theme.accentLight
                              : theme.warningLight,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.statusText,
                          { color: debt.status === "paid" ? theme.accent : theme.warning },
                        ]}
                      >
                        {debt.status === "paid" ? "Paid" : "Pending"}
                      </Text>
                    </View>
                  </View>
                  {debt.note ? (
                    <Text style={[styles.debtNote, { color: theme.textTertiary }]} numberOfLines={1}>
                      {debt.note}
                    </Text>
                  ) : null}
                  <Text style={[styles.debtDate, { color: theme.textTertiary }]}>
                    {formatDate(debt.date)}
                  </Text>
                  {debt.paidAmount > 0 && debt.status !== "paid" && (
                    <Text style={[styles.partialText, { color: theme.accent }]}>
                      Paid: {formatCurrency(debt.paidAmount)} / {formatCurrency(debt.amount)}
                    </Text>
                  )}
                </View>
                <View style={styles.debtRight}>
                  <Text
                    style={[
                      styles.debtAmount,
                      { color: debt.type === "lent" ? theme.accent : theme.danger },
                    ]}
                  >
                    {formatCurrency(debt.amount - debt.paidAmount)}
                  </Text>
                  <View style={styles.debtActions}>
                    {debt.status === "pending" && (
                      <Pressable
                        onPress={() => handleMarkPaid(debt)}
                        style={[styles.actionIcon, { backgroundColor: theme.accentLight }]}
                      >
                        <Ionicons name="checkmark" size={14} color={theme.accent} />
                      </Pressable>
                    )}
                    <Pressable
                      onPress={() => handleDelete(debt.id)}
                      style={[styles.actionIcon, { backgroundColor: theme.dangerLight }]}
                    >
                      <Ionicons name="trash-outline" size={14} color={theme.danger} />
                    </Pressable>
                  </View>
                </View>
              </View>
            </Card>
          </Animated.View>
        )}
      />
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
  summaryRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12,
  },
  summaryCard: {
    flex: 1,
    borderRadius: 14,
    padding: 14,
    gap: 4,
  },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_500Medium" },
  summaryAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingBottom: 10,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  filterText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  debtRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  debtIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  debtInfo: { flex: 1, gap: 4 },
  debtTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  debtName: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  debtNote: { fontSize: 12, fontFamily: "Inter_400Regular" },
  debtDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  partialText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  debtRight: { alignItems: "flex-end", gap: 8 },
  debtAmount: { fontSize: 16, fontFamily: "Inter_700Bold" },
  debtActions: { flexDirection: "row", gap: 6 },
  actionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
});
