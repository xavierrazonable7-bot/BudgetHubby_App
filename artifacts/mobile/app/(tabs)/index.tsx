import React, { useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  RefreshControl,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { formatCurrency, getGreeting } from "@/utils/format";
import { Card } from "@/components/ui/Card";
import { TransactionItem } from "@/components/TransactionItem";
import { WalletCard } from "@/components/WalletCard";
import { EmptyState } from "@/components/ui/EmptyState";

export default function HomeScreen() {
  const { theme, isDark, toggleTheme } = useTheme();
  const {
    userName,
    isOnboarded,
    wallets,
    transactions,
    totalBalance,
    monthlyIncome,
    monthlyExpenses,
    todayExpenses,
  } = useApp();

  const insets = useSafeAreaInsets();

  if (!isOnboarded) {
    router.replace("/onboarding");
    return null;
  }

  const recentTransactions = transactions.slice(0, 5);
  const savingsRate =
    monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;

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
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.greeting, { color: theme.textSecondary }]}>
              {getGreeting()},
            </Text>
            <Text style={[styles.userName, { color: theme.text }]}>{userName}</Text>
          </View>
          <Pressable
            onPress={toggleTheme}
            style={[styles.themeButton, { backgroundColor: theme.surfaceSecondary }]}
          >
            <Ionicons
              name={isDark ? "sunny" : "moon"}
              size={20}
              color={isDark ? "#FBBF24" : theme.textSecondary}
            />
          </Pressable>
        </Animated.View>

        {/* Balance Card */}
        <Animated.View entering={FadeInDown.delay(80).duration(400)} style={{ paddingHorizontal: 20 }}>
          <View style={[styles.balanceCard, { backgroundColor: theme.primary }]}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>{formatCurrency(totalBalance)}</Text>
            <View style={styles.balanceRow}>
              <View style={styles.balanceItem}>
                <View style={styles.balanceDot}>
                  <Ionicons name="arrow-down" size={12} color="#fff" />
                </View>
                <View>
                  <Text style={styles.balanceSub}>Income</Text>
                  <Text style={styles.balanceValue}>{formatCurrency(monthlyIncome)}</Text>
                </View>
              </View>
              <View style={[styles.balanceDivider]} />
              <View style={styles.balanceItem}>
                <View style={[styles.balanceDot, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                  <Ionicons name="arrow-up" size={12} color="#fff" />
                </View>
                <View>
                  <Text style={styles.balanceSub}>Expenses</Text>
                  <Text style={styles.balanceValue}>{formatCurrency(monthlyExpenses)}</Text>
                </View>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Quick Stats */}
        <Animated.View
          entering={FadeInDown.delay(160).duration(400)}
          style={styles.statsRow}
        >
          <Card style={styles.statCard} elevation>
            <View style={[styles.statIcon, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="today" size={18} color={theme.primary} />
            </View>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Today</Text>
            <Text style={[styles.statValue, { color: theme.expense }]}>
              -{formatCurrency(todayExpenses)}
            </Text>
          </Card>
          <Card style={styles.statCard} elevation>
            <View style={[styles.statIcon, { backgroundColor: theme.accentLight }]}>
              <Ionicons name="trending-up" size={18} color={theme.accent} />
            </View>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Savings</Text>
            <Text
              style={[
                styles.statValue,
                { color: savingsRate >= 0 ? theme.accent : theme.danger },
              ]}
            >
              {savingsRate.toFixed(0)}%
            </Text>
          </Card>
          <Card style={styles.statCard} elevation>
            <View style={[styles.statIcon, { backgroundColor: theme.secondaryLight }]}>
              <Ionicons name="wallet" size={18} color={theme.secondary} />
            </View>
            <Text style={[styles.statLabel, { color: theme.textSecondary }]}>Wallets</Text>
            <Text style={[styles.statValue, { color: theme.secondary }]}>{wallets.length}</Text>
          </Card>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View
          entering={FadeInDown.delay(220).duration(400)}
          style={styles.actionsRow}
        >
          <Pressable
            onPress={() => router.push({ pathname: "/add-transaction", params: { type: "expense" } })}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.danger, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Ionicons name="arrow-up" size={20} color="#fff" />
            <Text style={styles.actionText}>Expense</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push({ pathname: "/add-transaction", params: { type: "income" } })}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.accent, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Ionicons name="arrow-down" size={20} color="#fff" />
            <Text style={styles.actionText}>Income</Text>
          </Pressable>
          <Pressable
            onPress={() => router.push("/add-debt")}
            style={({ pressed }) => [
              styles.actionButton,
              { backgroundColor: theme.warning, opacity: pressed ? 0.9 : 1 },
            ]}
          >
            <Ionicons name="people" size={20} color="#fff" />
            <Text style={styles.actionText}>Debt</Text>
          </Pressable>
        </Animated.View>

        {/* Wallets */}
        <Animated.View entering={FadeInDown.delay(300).duration(400)}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Wallets</Text>
            <Pressable onPress={() => router.push("/(tabs)/wallets")}>
              <Text style={[styles.seeAll, { color: theme.primary }]}>See all</Text>
            </Pressable>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.walletsScroll}
            contentContainerStyle={{ paddingHorizontal: 20 }}
          >
            {wallets.map((wallet, idx) => (
              <WalletCard
                key={wallet.id}
                wallet={wallet}
                index={idx}
                onPress={() => router.push("/(tabs)/wallets")}
              />
            ))}
          </ScrollView>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View
          entering={FadeInDown.delay(380).duration(400)}
          style={styles.sectionHeader}
        >
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent</Text>
          <Pressable onPress={() => router.push("/(tabs)/transactions")}>
            <Text style={[styles.seeAll, { color: theme.primary }]}>See all</Text>
          </Pressable>
        </Animated.View>

        <View style={{ paddingHorizontal: 20 }}>
          {recentTransactions.length === 0 ? (
            <EmptyState
              icon="receipt-outline"
              title="No transactions yet"
              subtitle="Add your first expense or income"
            />
          ) : (
            recentTransactions.map((tx, idx) => (
              <TransactionItem
                key={tx.id}
                transaction={tx}
                index={idx}
                onPress={() =>
                  router.push({ pathname: "/transaction-detail", params: { id: tx.id } })
                }
              />
            ))
          )}
        </View>
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
    marginBottom: 20,
  },
  headerLeft: { gap: 2 },
  greeting: { fontSize: 14, fontFamily: "Inter_400Regular" },
  userName: { fontSize: 24, fontFamily: "Inter_700Bold", letterSpacing: -0.3 },
  themeButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
  balanceCard: {
    borderRadius: 24,
    padding: 24,
    marginBottom: 16,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  balanceLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.75)",
    marginBottom: 6,
  },
  balanceAmount: {
    fontSize: 38,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    letterSpacing: -0.5,
    marginBottom: 20,
  },
  balanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  balanceItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  balanceDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.3)",
    alignItems: "center",
    justifyContent: "center",
  },
  balanceSub: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: "rgba(255,255,255,0.7)",
  },
  balanceValue: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
    color: "#fff",
  },
  balanceDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  statsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    gap: 6,
    padding: 14,
    alignItems: "flex-start",
  },
  statIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  statValue: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  actionsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 24,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 14,
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  actionText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  seeAll: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  walletsScroll: {
    marginBottom: 24,
  },
});
