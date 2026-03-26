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
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp, Debt } from "@/context/AppContext";
import { formatDate } from "@/utils/format";
import { ScreenWrapper } from "@/components/ScreenWrapper";
import { EmptyState } from "@/components/ui/EmptyState";

type DebtFilter = "all" | "lent" | "borrowed";

export default function DebtsScreen() {
  const { theme, isDark } = useTheme();
  const { debts, updateDebt, deleteDebt, formatAmount } = useApp();
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

  const FILTERS: { key: DebtFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "lent", label: "Lent" },
    { key: "borrowed", label: "Borrowed" },
  ];

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12 }]}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backBtn, { backgroundColor: theme.surface, opacity: pressed ? 0.6 : 1 }]}
        >
          <Ionicons name="arrow-back" size={20} color={theme.text} />
        </Pressable>
        <View style={{ flex: 1 }}>
          <Text style={[styles.screenLabel, { color: theme.textSecondary }]}>Utang tracker</Text>
          <Text style={[styles.title, { color: theme.text }]}>Debts</Text>
        </View>
        <Pressable
          onPress={() => router.push("/add-debt")}
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
          style={[styles.summaryCard, { borderColor: theme.income + "30", shadowColor: theme.income, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.25 : 0.1, shadowRadius: 10, elevation: 5 }]}
        >
          <View style={[styles.summaryIconWrap, { backgroundColor: theme.income + "20" }]}>
            <Ionicons name="arrow-down" size={16} color={theme.income} />
          </View>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>They owe you</Text>
          <Text style={[styles.summaryAmount, { color: theme.income }]}>{formatAmount(totalLent)}</Text>
        </LinearGradient>
        <LinearGradient
          colors={isDark ? ["#2A1018", "#2A1820"] : ["#FFE4E8", "#FFF0F2"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.summaryCard, { borderColor: theme.expense + "30", shadowColor: theme.expense, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.25 : 0.1, shadowRadius: 10, elevation: 5 }]}
        >
          <View style={[styles.summaryIconWrap, { backgroundColor: theme.expense + "20" }]}>
            <Ionicons name="arrow-up" size={16} color={theme.expense} />
          </View>
          <Text style={[styles.summaryLabel, { color: theme.textSecondary }]}>You owe</Text>
          <Text style={[styles.summaryAmount, { color: theme.expense }]}>{formatAmount(totalBorrowed)}</Text>
        </LinearGradient>
      </View>

      {/* Filter Tabs */}
      <View style={[styles.filterRow, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.08)" : theme.border }]}>
        {FILTERS.map((f) => {
          const active = filter === f.key;
          return (
            <Pressable
              key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterTab, { backgroundColor: active ? theme.primary : "transparent" }]}
            >
              <Text style={[styles.filterText, { color: active ? "#fff" : isDark ? "rgba(255,255,255,0.55)" : theme.textSecondary }]}>
                {f.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(d) => d.id}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
          paddingTop: 4,
          gap: 12,
        }}
        ListEmptyComponent={
          <EmptyState
            icon="people-outline"
            title="No debts recorded"
            subtitle="Track money you lent or borrowed"
          />
        }
        renderItem={({ item: debt, index }) => {
          const isLent = debt.type === "lent";
          const accentColor = isLent ? theme.income : theme.expense;
          const gradientColors = isLent
            ? (isDark ? ["#0D2018", "#102A1E"] : ["#D1FAE5", "#E8FFF5"]) as [string, string]
            : (isDark ? ["#2A1018", "#2A1820"] : ["#FFE4E8", "#FFF0F2"]) as [string, string];

          return (
            <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
              <LinearGradient
                colors={gradientColors}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[
                  styles.debtCard,
                  {
                    borderColor: accentColor + "25",
                    shadowColor: accentColor,
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: isDark ? 0.2 : 0.08,
                    shadowRadius: 10,
                    elevation: 4,
                  },
                ]}
              >
                <View style={styles.debtRow}>
                  <View style={[styles.debtIcon, { backgroundColor: accentColor + "20", borderWidth: 1, borderColor: accentColor + "30", shadowColor: accentColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.4, shadowRadius: 8 }]}>
                    <Ionicons name={isLent ? "arrow-down" : "arrow-up"} size={18} color={accentColor} />
                  </View>

                  <View style={styles.debtInfo}>
                    <View style={styles.debtTop}>
                      <Text style={[styles.debtName, { color: theme.text }]}>{debt.personName}</Text>
                      <View style={[styles.statusBadge, { backgroundColor: debt.status === "paid" ? theme.income + "20" : "#F59E0B20" }]}>
                        <View style={[styles.statusDot, { backgroundColor: debt.status === "paid" ? theme.income : "#F59E0B" }]} />
                        <Text style={[styles.statusText, { color: debt.status === "paid" ? theme.income : "#F59E0B" }]}>
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
                      <View style={[styles.partialBar, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]}>
                        <View style={[styles.partialFill, { width: `${(debt.paidAmount / debt.amount) * 100}%`, backgroundColor: accentColor }]} />
                      </View>
                    )}
                  </View>

                  <View style={styles.debtRight}>
                    <Text style={[styles.debtAmount, { color: accentColor }]}>
                      {formatAmount(debt.amount - debt.paidAmount)}
                    </Text>
                    <View style={styles.debtActions}>
                      {debt.status === "pending" && (
                        <Pressable
                          onPress={() => handleMarkPaid(debt)}
                          style={({ pressed }) => [styles.actionBtn, { backgroundColor: theme.income + "20", borderColor: theme.income + "30", opacity: pressed ? 0.7 : 1 }]}
                        >
                          <Ionicons name="checkmark" size={14} color={theme.income} />
                        </Pressable>
                      )}
                      <Pressable
                        onPress={() => handleDelete(debt.id)}
                        style={({ pressed }) => [styles.actionBtn, { backgroundColor: theme.expense + "18", borderColor: theme.expense + "28", opacity: pressed ? 0.7 : 1 }]}
                      >
                        <Ionicons name="trash-outline" size={14} color={theme.expense} />
                      </Pressable>
                    </View>
                  </View>
                </View>
              </LinearGradient>
            </Animated.View>
          );
        }}
      />
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
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
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  summaryLabel: { fontSize: 12, fontFamily: "Inter_400Regular" },
  summaryAmount: { fontSize: 18, fontFamily: "Inter_700Bold" },
  filterRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginBottom: 14,
    borderRadius: 100,
    padding: 4,
    borderWidth: 1,
  },
  filterTab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 100,
  },
  filterText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  debtCard: { borderRadius: 18, padding: 16, borderWidth: 1 },
  debtRow: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
  debtIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  debtInfo: { flex: 1, gap: 5 },
  debtTop: { flexDirection: "row", alignItems: "center", gap: 8 },
  debtName: { fontSize: 15, fontFamily: "Inter_600SemiBold", flex: 1 },
  statusBadge: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  statusDot: { width: 5, height: 5, borderRadius: 3 },
  statusText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  debtNote: { fontSize: 12, fontFamily: "Inter_400Regular" },
  debtDate: { fontSize: 11, fontFamily: "Inter_400Regular" },
  partialBar: { height: 4, borderRadius: 2, overflow: "hidden", marginTop: 2 },
  partialFill: { height: "100%", borderRadius: 2 },
  debtRight: { alignItems: "flex-end", gap: 8 },
  debtAmount: { fontSize: 16, fontFamily: "Inter_700Bold" },
  debtActions: { flexDirection: "row", gap: 6 },
  actionBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
