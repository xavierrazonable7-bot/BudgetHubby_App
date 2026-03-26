import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Dimensions,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { useNotifications } from "@/context/NotificationContext";
import { NotificationsModal } from "@/components/ui/NotificationsModal";
import { isThisMonth } from "@/utils/format";
import { EmptyState } from "@/components/ui/EmptyState";
import { getCategoryColor, getCategoryIcon, getCategoryLabel } from "@/utils/categories";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

const RECENT_LIMIT = 8;

function formatTxDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const txStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  const diffDays = Math.round((todayStart - txStart) / 86400000);
  if (diffDays === 0) return `Today, ${date.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays === 1) return `Yesterday`;
  return date.toLocaleDateString("en-PH", { month: "short", day: "numeric" });
}

function getCurrentDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long", month: "long", day: "numeric",
  });
}

const QUICK_ACTIONS = [
  { icon: "add-circle-outline", label: "Expense", color: "#E05A6D", grad: ["#2A1018", "#2A1820"] as [string, string], route: { pathname: "/add-transaction" as const, params: { type: "expense" } } },
  { icon: "checkmark-circle-outline", label: "Income", color: "#2DD4BF", grad: ["#0D2018", "#102A1E"] as [string, string], route: { pathname: "/add-transaction" as const, params: { type: "income" } } },
  { icon: "people-outline", label: "Debt", color: "#6366F1", grad: ["#0D102A", "#121630"] as [string, string], route: { pathname: "/add-debt" as const } },
  { icon: "wallet-outline", label: "Wallet", color: "#F59E0B", grad: ["#1A1608", "#221C08"] as [string, string], route: { pathname: "/add-wallet" as const } },
];

export default function HomeScreen() {
  const { theme, isDark } = useTheme();
  const { userName, isOnboarded, wallets, transactions, totalBalance, monthlyIncome, monthlyExpenses, todayExpenses, formatAmount } = useApp();
  const { unreadCount, requestPermission, permStatus } = useNotifications();
  const insets = useSafeAreaInsets();
  const [showNotifs, setShowNotifs] = useState(false);

  if (!isOnboarded) { router.replace("/onboarding"); return null; }

  const handleBellPress = async () => {
    if (permStatus === "undetermined") await requestPermission();
    setShowNotifs(true);
  };

  const monthlyTransactionCount = useMemo(() => transactions.filter((t) => isThisMonth(t.date)).length, [transactions]);
  const budgetLeft = monthlyIncome - monthlyExpenses;
  const budgetProgress = monthlyIncome > 0 ? Math.min(monthlyExpenses / monthlyIncome, 1) : 0;
  const recentTransactions = useMemo(() =>
    [...transactions]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, RECENT_LIMIT),
    [transactions]
  );

  const bgGradient: [string, string, string] = isDark
    ? ["#0E0E0E", "#140810", "#0E0E0E"]
    : ["#F0F0F5", "#EDE8F5", "#F0F0F5"];

  return (
    <LinearGradient colors={bgGradient} style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100, paddingTop: Platform.OS === "web" ? 67 : insets.top + 8 }}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(350)} style={styles.header}>
          <View>
            <Text style={[styles.dateText, { color: theme.textTertiary }]}>{getCurrentDate()}</Text>
            <View style={styles.greetingRow}>
              <Text style={[styles.greeting, { color: theme.text }]}>Hi, {userName}</Text>
              <Text style={styles.waveEmoji}>👋</Text>
            </View>
          </View>

          {/* Notification Bell */}
          <Pressable
            onPress={handleBellPress}
            style={({ pressed }) => [
              styles.bellBtn,
              {
                backgroundColor: theme.surface,
                borderColor: isDark ? "rgba(255,255,255,0.07)" : theme.border,
                shadowColor: "#000",
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: isDark ? 0.4 : 0.08,
                shadowRadius: 6,
                elevation: 4,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons
              name={unreadCount > 0 ? "notifications" : "notifications-outline"}
              size={20}
              color={unreadCount > 0 ? "#E05A6D" : theme.textSecondary}
            />
            {unreadCount > 0 && (
              <View style={styles.bellBadge}>
                <Text style={styles.bellBadgeText}>
                  {unreadCount > 9 ? "9+" : unreadCount}
                </Text>
              </View>
            )}
          </Pressable>
        </Animated.View>

        {/* Notifications Modal */}
        <NotificationsModal visible={showNotifs} onClose={() => setShowNotifs(false)} />

        {/* Total Balance Hero */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <LinearGradient
            colors={["#C0394D", "#E05A6D", "#8B1A2E"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.balanceCard, { shadowColor: "#E05A6D", shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.45, shadowRadius: 24, elevation: 14 }]}
          >
            <View style={styles.balanceDeco1} />
            <View style={styles.balanceDeco2} />

            <View style={styles.balanceTopRow}>
              <View>
                <Text style={styles.balanceLabel}>Total Balance</Text>
                <Text style={styles.balanceAmount}>{formatAmount(totalBalance)}</Text>
              </View>
              <View style={styles.balanceBadge}>
                <View style={styles.balanceDot} />
                <Text style={styles.balanceBadgeText}>{wallets.length} wallets</Text>
              </View>
            </View>

            <View style={styles.balanceDivider} />

            {/* Budget row */}
            <View style={styles.balanceStatsRow}>
              <View style={styles.balanceStat}>
                <View style={[styles.balanceStatIcon, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                  <Ionicons name="arrow-down" size={12} color="#fff" />
                </View>
                <View>
                  <Text style={styles.balanceStatLabel}>Income</Text>
                  <Text style={styles.balanceStatValue}>{formatAmount(monthlyIncome)}</Text>
                </View>
              </View>
              <View style={styles.balanceStatDivider} />
              <View style={styles.balanceStat}>
                <View style={[styles.balanceStatIcon, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                  <Ionicons name="arrow-up" size={12} color="#fff" />
                </View>
                <View>
                  <Text style={styles.balanceStatLabel}>Spent</Text>
                  <Text style={styles.balanceStatValue}>{formatAmount(monthlyExpenses)}</Text>
                </View>
              </View>
              <View style={styles.balanceStatDivider} />
              <View style={styles.balanceStat}>
                <View style={[styles.balanceStatIcon, { backgroundColor: "rgba(255,255,255,0.15)" }]}>
                  <Ionicons name="trending-up" size={12} color="#fff" />
                </View>
                <View>
                  <Text style={styles.balanceStatLabel}>Saved</Text>
                  <Text style={styles.balanceStatValue}>{formatAmount(Math.max(budgetLeft, 0))}</Text>
                </View>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Monthly Spending Bar */}
        <Animated.View entering={FadeInDown.delay(100).duration(400)} style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <LinearGradient
            colors={isDark ? ["#1F1218", "#221824"] : ["#FFF1F3", "#F0E8FF"]}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={[styles.spendingCard, { borderWidth: 1, borderColor: isDark ? "rgba(224,90,109,0.12)" : "rgba(224,90,109,0.1)", shadowColor: theme.primary, shadowOffset: { width: 0, height: 5 }, shadowOpacity: isDark ? 0.2 : 0.08, shadowRadius: 14, elevation: 6 }]}
          >
            <View style={styles.spendingTopRow}>
              <View>
                <Text style={[styles.spendingLabel, { color: theme.textSecondary }]}>This month spending</Text>
                <View style={styles.spendingAmountRow}>
                  <Text style={[styles.pesoSymbol, { color: theme.text }]}>₱</Text>
                  <Text style={[styles.spendingAmount, { color: theme.text }]}>
                    {monthlyExpenses.toLocaleString("en-PH", { maximumFractionDigits: 0 })}
                  </Text>
                </View>
              </View>
              <View style={styles.todayBadge}>
                <Text style={[styles.todayLabel, { color: theme.textTertiary }]}>Today</Text>
                <Text style={[styles.todayValue, { color: theme.primary }]}>{formatAmount(todayExpenses)}</Text>
              </View>
            </View>

            {monthlyIncome > 0 ? (
              <Text style={[styles.budgetSubtext, { color: theme.textSecondary }]}>
                {formatAmount(Math.abs(budgetLeft))} {budgetLeft >= 0 ? "left" : "over budget"}
              </Text>
            ) : (
              <Text style={[styles.budgetSubtext, { color: theme.textTertiary }]}>Add income to see budget</Text>
            )}

            <View style={[styles.progressTrack, { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }]}>
              <LinearGradient
                colors={budgetProgress >= 1 ? ["#E05A6D", "#C0394D"] : ["#E05A6D", "#F472B6"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[styles.progressFill, { width: `${Math.round(budgetProgress * 100)}%` }]}
              />
            </View>

            <View style={styles.progressLabels}>
              <Text style={[styles.progressPct, { color: theme.textTertiary }]}>{Math.round(budgetProgress * 100)}% used</Text>
              <Text style={[styles.progressTx, { color: theme.textTertiary }]}>{monthlyTransactionCount} transactions</Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(150).duration(400)} style={styles.actionsGrid}>
          {QUICK_ACTIONS.map((action) => (
            <Pressable
              key={action.label}
              onPress={() => router.push(action.route as any)}
              style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.8 : 1 }]}
            >
              <LinearGradient
                colors={isDark ? action.grad : ["rgba(0,0,0,0.02)", "rgba(0,0,0,0.03)"]}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={[styles.actionCard, { borderWidth: 1, borderColor: action.color + (isDark ? "25" : "18"), shadowColor: action.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.3 : 0.12, shadowRadius: 10, elevation: 5 }]}
              >
                <View style={[styles.actionIconCircle, { backgroundColor: action.color + "20", borderWidth: 1, borderColor: action.color + "25" }]}>
                  <Ionicons name={action.icon as any} size={21} color={action.color} />
                </View>
                <Text style={[styles.actionLabel, { color: action.color }]}>{action.label}</Text>
              </LinearGradient>
            </Pressable>
          ))}
        </Animated.View>

        {/* Wallets */}
        {wallets.length > 0 && (
          <Animated.View entering={FadeInDown.delay(200).duration(400)}>
            <SectionHeader title="My Wallets" onSeeAll={() => router.push("/wallets")} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, gap: 12, paddingBottom: 4 }}
              style={{ marginBottom: 24 }}
            >
              {wallets.map((wallet, idx) => (
                <Animated.View key={wallet.id} entering={FadeInUp.delay(220 + idx * 50).duration(350)}>
                  <Pressable onPress={() => router.push("/wallets")} style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}>
                    <LinearGradient
                      colors={[wallet.color + "30", wallet.color + "16"]}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={[styles.walletChip, { borderWidth: 1, borderColor: wallet.color + "35", shadowColor: wallet.color, shadowOffset: { width: 0, height: 4 }, shadowOpacity: isDark ? 0.3 : 0.15, shadowRadius: 10, elevation: 5 }]}
                    >
                      <View style={[styles.walletChipIcon, { backgroundColor: wallet.color + "28" }]}>
                        <Ionicons name={wallet.icon as any} size={18} color={wallet.color} />
                      </View>
                      <View>
                        <Text style={[styles.walletChipName, { color: theme.textSecondary }]}>{wallet.name}</Text>
                        <Text style={[styles.walletChipBalance, { color: theme.text }]}>{formatAmount(wallet.balance)}</Text>
                      </View>
                    </LinearGradient>
                  </Pressable>
                </Animated.View>
              ))}
            </ScrollView>
          </Animated.View>
        )}

        {/* Recent Activity */}
        <Animated.View entering={FadeInDown.delay(260).duration(400)}>
          <SectionHeader
            title="Recent Activity"
            count={transactions.length > RECENT_LIMIT ? `${recentTransactions.length} of ${transactions.length}` : undefined}
            onSeeAll={() => router.push("/(tabs)/transactions")}
          />
          <View style={{ paddingHorizontal: 20, gap: 10 }}>
            {recentTransactions.length === 0 ? (
              <EmptyState icon="receipt-outline" title="No transactions yet" subtitle="Add your first expense or income to get started" />
            ) : (
              recentTransactions.map((tx, idx) => {
                const catColor = getCategoryColor(tx.category);
                const catIcon = getCategoryIcon(tx.category);
                const catLabel = getCategoryLabel(tx.category);
                const wallet = wallets.find((w) => w.id === tx.walletId);
                const isIncome = tx.type === "income";
                return (
                  <Animated.View key={tx.id} entering={FadeInDown.delay(idx * 35).duration(260)}>
                    <Pressable
                      onPress={() => router.push({ pathname: "/transaction-detail", params: { id: tx.id } })}
                      style={({ pressed }) => [
                        styles.txItem,
                        {
                          backgroundColor: theme.surface,
                          borderWidth: 1,
                          borderColor: isDark ? "rgba(255,255,255,0.04)" : theme.border,
                          shadowColor: catColor,
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: isDark ? 0.15 : 0.05,
                          shadowRadius: 6,
                          elevation: 3,
                          opacity: pressed ? 0.85 : 1,
                        },
                      ]}
                    >
                      <View style={[styles.txIcon, { backgroundColor: catColor + "18", borderWidth: 1, borderColor: catColor + "28", shadowColor: catColor, shadowOffset: { width: 0, height: 0 }, shadowOpacity: isDark ? 0.45 : 0.2, shadowRadius: 8 }]}>
                        <Ionicons name={catIcon as any} size={19} color={catColor} />
                      </View>
                      <View style={styles.txInfo}>
                        <Text style={[styles.txCategory, { color: theme.text }]} numberOfLines={1}>{catLabel}</Text>
                        <Text style={[styles.txSub, { color: theme.textTertiary }]} numberOfLines={1}>
                          {wallet?.name ?? "Wallet"} · {formatTxDate(tx.date)}
                        </Text>
                        {tx.note ? (
                          <Text style={[styles.txNote, { color: isDark ? "rgba(255,255,255,0.4)" : theme.textTertiary }]} numberOfLines={1}>
                            {tx.note}
                          </Text>
                        ) : null}
                      </View>
                      <Text style={[styles.txAmount, { color: isIncome ? theme.income : theme.expense }]}>
                        {isIncome ? "+" : "-"}{formatAmount(tx.amount)}
                      </Text>
                    </Pressable>
                  </Animated.View>
                );
              })
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

function SectionHeader({ title, count, onSeeAll }: { title: string; count?: string; onSeeAll: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
        {count ? (
          <View style={[styles.countBadge, { backgroundColor: theme.primary + "18", borderColor: theme.primary + "30" }]}>
            <Text style={[styles.countBadgeText, { color: theme.primary }]}>{count}</Text>
          </View>
        ) : null}
      </View>
      <Pressable onPress={onSeeAll} style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}>
        <Text style={[styles.seeAll, { color: theme.primary }]}>See all →</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  dateText: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 4 },
  greetingRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  greeting: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: -0.4 },
  waveEmoji: { fontSize: 24 },
  bellBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: "center", justifyContent: "center",
    marginTop: 4, borderWidth: 1,
    position: "relative",
  },
  bellBadge: {
    position: "absolute",
    top: -2, right: -2,
    minWidth: 18, height: 18,
    borderRadius: 9,
    backgroundColor: "#E05A6D",
    alignItems: "center", justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 2,
    borderColor: "#0E0E0E",
  },
  bellBadgeText: { fontSize: 9, fontFamily: "Inter_700Bold", color: "#fff" },
  balanceCard: {
    borderRadius: 22,
    padding: 22,
    overflow: "hidden",
    position: "relative",
  },
  balanceDeco1: { position: "absolute", width: 150, height: 150, borderRadius: 75, backgroundColor: "rgba(255,255,255,0.07)", top: -50, right: -30 },
  balanceDeco2: { position: "absolute", width: 90, height: 90, borderRadius: 45, backgroundColor: "rgba(255,255,255,0.05)", bottom: -20, left: 10 },
  balanceTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  balanceLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.82)", marginBottom: 6 },
  balanceAmount: { fontSize: 38, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -1 },
  balanceBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  balanceDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#fff" },
  balanceBadgeText: { fontSize: 11, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.92)" },
  balanceDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.18)", marginBottom: 16 },
  balanceStatsRow: { flexDirection: "row", alignItems: "center" },
  balanceStat: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  balanceStatIcon: { width: 28, height: 28, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  balanceStatLabel: { fontSize: 10, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.8)", marginBottom: 2 },
  balanceStatValue: { fontSize: 13, fontFamily: "Inter_700Bold", color: "#fff" },
  balanceStatDivider: { width: 1, height: 32, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 8 },
  spendingCard: { borderRadius: 20, padding: 20 },
  spendingTopRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 },
  spendingLabel: { fontSize: 13, fontFamily: "Inter_400Regular", marginBottom: 4 },
  spendingAmountRow: { flexDirection: "row", alignItems: "flex-end", gap: 2 },
  pesoSymbol: { fontSize: 24, fontFamily: "Inter_700Bold", lineHeight: 40 },
  spendingAmount: { fontSize: 38, fontFamily: "Inter_700Bold", letterSpacing: -1.5, lineHeight: 44 },
  todayBadge: { alignItems: "flex-end" },
  todayLabel: { fontSize: 11, fontFamily: "Inter_400Regular", marginBottom: 4 },
  todayValue: { fontSize: 16, fontFamily: "Inter_700Bold" },
  budgetSubtext: { fontSize: 12, fontFamily: "Inter_400Regular", marginBottom: 12 },
  progressTrack: { height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 8 },
  progressFill: { height: "100%", borderRadius: 3, minWidth: 20 },
  progressLabels: { flexDirection: "row", justifyContent: "space-between" },
  progressPct: { fontSize: 11, fontFamily: "Inter_400Regular" },
  progressTx: { fontSize: 11, fontFamily: "Inter_400Regular" },
  actionsGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 10,
    marginBottom: 28,
  },
  actionCard: { borderRadius: 18, paddingVertical: 16, paddingHorizontal: 8, alignItems: "center", gap: 10, flex: 1 },
  actionIconCircle: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 11, fontFamily: "Inter_700Bold" },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 20, marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  walletChip: { flexDirection: "row", alignItems: "center", borderRadius: 18, padding: 14, gap: 10, minWidth: 150 },
  walletChipIcon: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  walletChipName: { fontSize: 11, fontFamily: "Inter_400Regular" },
  walletChipBalance: { fontSize: 16, fontFamily: "Inter_700Bold", marginTop: 2 },
  txItem: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 14, gap: 12 },
  txIcon: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1, gap: 2 },
  txCategory: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  txSub: { fontSize: 12, fontFamily: "Inter_400Regular" },
  txNote: { fontSize: 11, fontFamily: "Inter_400Regular", fontStyle: "italic" },
  txAmount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  countBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1 },
  countBadgeText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
});
