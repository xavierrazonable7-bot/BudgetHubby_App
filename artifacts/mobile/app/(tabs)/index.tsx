import React, { useMemo } from "react";
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
import { formatCurrency, isThisMonth } from "@/utils/format";
import { TransactionItem } from "@/components/TransactionItem";
import { EmptyState } from "@/components/ui/EmptyState";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

function getCurrentDate(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function NeuCard({
  children,
  style,
  gradient,
}: {
  children: React.ReactNode;
  style?: any;
  gradient?: string[];
}) {
  const { theme, isDark } = useTheme();

  if (gradient) {
    return (
      <LinearGradient
        colors={gradient as [string, string]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.neuCard,
          {
            shadowColor: "#000",
            shadowOffset: { width: 4, height: 4 },
            shadowOpacity: isDark ? 0.7 : 0.15,
            shadowRadius: 12,
            elevation: 8,
          },
          style,
        ]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.neuCard,
        {
          backgroundColor: theme.surface,
          borderWidth: 1,
          borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.8)",
          shadowColor: "#000",
          shadowOffset: { width: 4, height: 4 },
          shadowOpacity: isDark ? 0.6 : 0.1,
          shadowRadius: 12,
          elevation: 6,
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

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

  const monthlyTransactionCount = useMemo(
    () => transactions.filter((t) => isThisMonth(t.date)).length,
    [transactions]
  );

  const budgetLeft = monthlyIncome - monthlyExpenses;
  const budgetProgress = monthlyIncome > 0 ? Math.min(monthlyExpenses / monthlyIncome, 1) : 0;
  const recentTransactions = transactions.slice(0, 5);

  const bgGradient: [string, string, string] = isDark
    ? ["#0E0E0E", "#140810", "#0E0E0E"]
    : ["#F0F0F5", "#EDE8F5", "#F0F0F5"];

  const cardGradient: [string, string] = isDark
    ? ["#1E1418", "#1A1A1A"]
    : ["#FFFFFF", "#F5F0FF"];

  const spendingCardGradient: [string, string] = isDark
    ? ["#1F1218", "#221824"]
    : ["#FFF1F3", "#F0E8FF"];

  return (
    <LinearGradient
      colors={bgGradient}
      style={styles.container}
    >
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          paddingTop: Platform.OS === "web" ? 67 : insets.top + 8,
        }}
      >
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(350)} style={styles.header}>
          <View>
            <Text style={[styles.dateText, { color: theme.textSecondary }]}>
              {getCurrentDate()}
            </Text>
            <View style={styles.greetingRow}>
              <Text style={[styles.greeting, { color: theme.text }]}>
                Hi, {userName}
              </Text>
              <Ionicons name="hand-left" size={26} color="#F59E0B" style={styles.waveIcon} />
            </View>
          </View>
          <Pressable
            onPress={toggleTheme}
            style={[
              styles.settingsBtn,
              {
                backgroundColor: theme.surface,
                borderWidth: 1,
                borderColor: theme.border,
                shadowColor: "#000",
                shadowOffset: { width: 2, height: 2 },
                shadowOpacity: isDark ? 0.5 : 0.08,
                shadowRadius: 6,
                elevation: 4,
              },
            ]}
          >
            <Ionicons
              name={isDark ? "sunny" : "moon"}
              size={20}
              color={isDark ? "#F59E0B" : theme.textSecondary}
            />
          </Pressable>
        </Animated.View>

        {/* Monthly Spending Card */}
        <Animated.View entering={FadeInDown.delay(60).duration(400)} style={{ paddingHorizontal: 20, marginBottom: 16 }}>
          <LinearGradient
            colors={spendingCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.spendingCard,
              {
                borderWidth: 1,
                borderColor: isDark ? "rgba(224,90,109,0.15)" : "rgba(224,90,109,0.1)",
                shadowColor: theme.primary,
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isDark ? 0.25 : 0.1,
                shadowRadius: 20,
                elevation: 10,
              },
            ]}
          >
            <Text style={[styles.spendingLabel, { color: theme.textSecondary }]}>
              Monthly spending
            </Text>
            <View style={styles.spendingAmountRow}>
              <Text style={[styles.pesoSymbol, { color: theme.text }]}>₱</Text>
              <Text style={[styles.spendingAmount, { color: theme.text }]}>
                {monthlyExpenses.toLocaleString("en-PH", { maximumFractionDigits: 0 })}
              </Text>
            </View>

            {monthlyIncome > 0 ? (
              <Text style={[styles.budgetSubtext, { color: theme.textSecondary }]}>
                {formatCurrency(Math.abs(budgetLeft))} {budgetLeft >= 0 ? "left of" : "over"} {formatCurrency(monthlyIncome)} budget
              </Text>
            ) : (
              <Text style={[styles.budgetSubtext, { color: theme.textSecondary }]}>
                Add income to set your budget
              </Text>
            )}

            {/* Progress Bar */}
            <View style={[styles.progressTrack, { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.07)" }]}>
              <LinearGradient
                colors={["#E05A6D", "#B03050"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[
                  styles.progressFill,
                  { width: `${Math.round(budgetProgress * 100)}%` },
                ]}
              />
            </View>

            {/* Sub Stats */}
            <View style={styles.subStatsRow}>
              <View
                style={[
                  styles.subStatCard,
                  {
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  },
                ]}
              >
                <Text style={[styles.subStatLabel, { color: theme.textSecondary }]}>Today</Text>
                <Text style={[styles.subStatValue, { color: theme.text }]}>
                  {formatCurrency(todayExpenses)}
                </Text>
              </View>
              <View style={[styles.subStatDivider, { backgroundColor: isDark ? "rgba(255,255,255,0.07)" : "rgba(0,0,0,0.06)" }]} />
              <View
                style={[
                  styles.subStatCard,
                  {
                    backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
                    borderWidth: 1,
                    borderColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)",
                  },
                ]}
              >
                <Text style={[styles.subStatLabel, { color: theme.textSecondary }]}>Transactions</Text>
                <Text style={[styles.subStatValue, { color: theme.text }]}>
                  {monthlyTransactionCount}
                </Text>
              </View>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Quick Actions */}
        <Animated.View entering={FadeInDown.delay(140).duration(400)} style={styles.actionsGrid}>
          <QuickActionButton
            icon="add-circle-outline"
            label="Expense"
            gradientColors={isDark ? ["#2A1018", "#2A1820"] : ["#FFE4E8", "#FFF0F2"]}
            iconColor="#E05A6D"
            glowColor="#E05A6D"
            onPress={() => router.push({ pathname: "/add-transaction", params: { type: "expense" } })}
            isDark={isDark}
          />
          <QuickActionButton
            icon="checkmark-circle-outline"
            label="Income"
            gradientColors={isDark ? ["#0D2018", "#102A1E"] : ["#D1FAE5", "#E8FFF5"]}
            iconColor="#2DD4BF"
            glowColor="#2DD4BF"
            onPress={() => router.push({ pathname: "/add-transaction", params: { type: "income" } })}
            isDark={isDark}
          />
          <QuickActionButton
            icon="calendar-outline"
            label="Debt"
            gradientColors={isDark ? ["#0D102A", "#121630"] : ["#EDE9FE", "#F5F0FF"]}
            iconColor="#6366F1"
            glowColor="#6366F1"
            onPress={() => router.push("/add-debt")}
            isDark={isDark}
          />
          <QuickActionButton
            icon="document-text-outline"
            label="Wallet"
            gradientColors={isDark ? ["#1A1608", "#221C08"] : ["#FEF3C7", "#FFFBEB"]}
            iconColor="#F59E0B"
            glowColor="#F59E0B"
            onPress={() => router.push("/add-wallet")}
            isDark={isDark}
          />
        </Animated.View>

        {/* Wallets */}
        <Animated.View entering={FadeInDown.delay(200).duration(400)}>
          <SectionHeader
            title="My Wallets"
            onSeeAll={() => router.push("/(tabs)/wallets")}
          />
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 20, gap: 12 }}
            style={styles.walletsScroll}
          >
            {wallets.map((wallet, idx) => (
              <Animated.View key={wallet.id} entering={FadeInUp.delay(220 + idx * 50).duration(350)}>
                <Pressable
                  onPress={() => router.push("/(tabs)/wallets")}
                  style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
                >
                  <LinearGradient
                    colors={[wallet.color + "33", wallet.color + "18"]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={[
                      styles.walletChip,
                      {
                        borderWidth: 1,
                        borderColor: wallet.color + "40",
                        shadowColor: wallet.color,
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: isDark ? 0.3 : 0.15,
                        shadowRadius: 10,
                        elevation: 5,
                      },
                    ]}
                  >
                    <View style={[styles.walletChipIcon, { backgroundColor: wallet.color + "30" }]}>
                      <Ionicons name={wallet.icon as any} size={18} color={wallet.color} />
                    </View>
                    <View>
                      <Text style={[styles.walletChipName, { color: theme.textSecondary }]}>
                        {wallet.name}
                      </Text>
                      <Text style={[styles.walletChipBalance, { color: theme.text }]}>
                        {formatCurrency(wallet.balance)}
                      </Text>
                    </View>
                  </LinearGradient>
                </Pressable>
              </Animated.View>
            ))}
          </ScrollView>
        </Animated.View>

        {/* Recent Transactions */}
        <Animated.View entering={FadeInDown.delay(280).duration(400)} style={{ marginTop: 4 }}>
          <SectionHeader
            title="Recent Activity"
            onSeeAll={() => router.push("/(tabs)/transactions")}
          />
          <View style={{ paddingHorizontal: 20 }}>
            {recentTransactions.length === 0 ? (
              <EmptyState
                icon="receipt-outline"
                title="No transactions yet"
                subtitle="Add your first expense or income"
              />
            ) : (
              recentTransactions.map((tx, idx) => (
                <NeuTransactionItem
                  key={tx.id}
                  transaction={tx}
                  index={idx}
                  isDark={isDark}
                  onPress={() =>
                    router.push({ pathname: "/transaction-detail", params: { id: tx.id } })
                  }
                />
              ))
            )}
          </View>
        </Animated.View>
      </ScrollView>
    </LinearGradient>
  );
}

function QuickActionButton({
  icon,
  label,
  gradientColors,
  iconColor,
  glowColor,
  onPress,
  isDark,
}: {
  icon: string;
  label: string;
  gradientColors: [string, string];
  iconColor: string;
  glowColor: string;
  onPress: () => void;
  isDark: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1, flex: 1 }]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.actionCard,
          {
            borderWidth: 1,
            borderColor: iconColor + "22",
            shadowColor: glowColor,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isDark ? 0.35 : 0.15,
            shadowRadius: 12,
            elevation: 6,
          },
        ]}
      >
        <View style={[styles.actionIconCircle, { backgroundColor: iconColor + "20" }]}>
          <Ionicons name={icon as any} size={22} color={iconColor} />
        </View>
        <Text style={[styles.actionLabel, { color: iconColor }]}>{label}</Text>
      </LinearGradient>
    </Pressable>
  );
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll: () => void }) {
  const { theme } = useTheme();
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
      <Pressable onPress={onSeeAll}>
        <Text style={[styles.seeAll, { color: theme.primary }]}>See all</Text>
      </Pressable>
    </View>
  );
}

function NeuTransactionItem({
  transaction,
  index,
  isDark,
  onPress,
}: {
  transaction: any;
  index: number;
  isDark: boolean;
  onPress: () => void;
}) {
  const { theme } = useTheme();
  const { wallets } = useApp();
  const wallet = wallets.find((w) => w.id === transaction.walletId);

  const getCatColor = (cat: string) => {
    const map: Record<string, string> = {
      food: "#E05A6D", transport: "#6366F1", school: "#A78BFA",
      shopping: "#F472B6", entertainment: "#F59E0B", health: "#2DD4BF",
      utilities: "#22D3EE", rent: "#8B5CF6", savings: "#2DD4BF",
      allowance: "#2DD4BF", salary: "#3B82F6", freelance: "#A78BFA",
      gift: "#F472B6", investment: "#F59E0B", other: "#9CA3AF",
      other_income: "#9CA3AF",
    };
    return map[cat] || "#9CA3AF";
  };

  const getCatIcon = (cat: string) => {
    const map: Record<string, string> = {
      food: "fast-food", transport: "car", school: "school",
      shopping: "bag", entertainment: "game-controller", health: "medkit",
      utilities: "flash", rent: "home", savings: "save",
      allowance: "wallet", salary: "briefcase", freelance: "laptop",
      gift: "gift", investment: "trending-up", other: "ellipsis-horizontal-circle",
      other_income: "add-circle",
    };
    return (map[cat] || "ellipsis-horizontal-circle") as any;
  };

  const catColor = getCatColor(transaction.category);
  const catIcon = getCatIcon(transaction.category);
  const isIncome = transaction.type === "income";

  return (
    <Animated.View entering={FadeInDown.delay(index * 40).duration(300)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.neuTxItem,
          {
            backgroundColor: theme.surface,
            borderWidth: 1,
            borderColor: isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.04)",
            shadowColor: "#000",
            shadowOffset: { width: 3, height: 3 },
            shadowOpacity: isDark ? 0.5 : 0.06,
            shadowRadius: 8,
            elevation: 4,
            opacity: pressed ? 0.85 : 1,
          },
        ]}
      >
        {/* Glow icon */}
        <View
          style={[
            styles.txIconWrap,
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
            {transaction.category.charAt(0).toUpperCase() + transaction.category.replace("_", " ").slice(1)}
          </Text>
          <Text style={[styles.txSub, { color: theme.textTertiary }]}>
            {wallet?.name ?? "Wallet"} · {new Date(transaction.date).toLocaleDateString("en-PH", { month: "short", day: "numeric" })}
          </Text>
        </View>

        <Text style={[styles.txAmount, { color: isIncome ? theme.income : theme.expense }]}>
          {isIncome ? "+" : "-"}{formatCurrency(transaction.amount)}
        </Text>
      </Pressable>
    </Animated.View>
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
  dateText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    marginBottom: 4,
  },
  greetingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  greeting: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    letterSpacing: -0.3,
  },
  waveIcon: {
    marginTop: 2,
  },
  settingsBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  spendingCard: {
    borderRadius: 22,
    padding: 22,
    gap: 4,
  },
  spendingLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  spendingAmountRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 2,
    marginBottom: 4,
  },
  pesoSymbol: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    lineHeight: 52,
  },
  spendingAmount: {
    fontSize: 52,
    fontFamily: "Inter_700Bold",
    letterSpacing: -2,
    lineHeight: 58,
  },
  budgetSubtext: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginBottom: 14,
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: 16,
  },
  progressFill: {
    height: "100%",
    borderRadius: 3,
    minWidth: 20,
  },
  subStatsRow: {
    flexDirection: "row",
    gap: 12,
  },
  subStatCard: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 4,
  },
  subStatDivider: {
    width: 0,
  },
  subStatLabel: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  subStatValue: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  actionsGrid: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 24,
  },
  actionCard: {
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  actionIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 12,
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
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  walletsScroll: {
    marginBottom: 24,
  },
  walletChip: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 18,
    padding: 14,
    gap: 10,
    minWidth: 150,
  },
  walletChipIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  walletChipName: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  walletChipBalance: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  neuCard: {
    borderRadius: 20,
  },
  neuTxItem: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    gap: 12,
  },
  txIconWrap: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: "center",
    justifyContent: "center",
  },
  txInfo: { flex: 1, gap: 3 },
  txCategory: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize",
  },
  txSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
  txAmount: {
    fontSize: 15,
    fontFamily: "Inter_700Bold",
  },
});
