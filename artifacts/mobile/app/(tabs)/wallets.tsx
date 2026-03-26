import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Alert,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/utils/format";
import { ScreenWrapper } from "@/components/ScreenWrapper";

export default function WalletsScreen() {
  const { theme, isDark } = useTheme();
  const { wallets, totalBalance, deleteWallet } = useApp();
  const insets = useSafeAreaInsets();

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Wallet",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: () => deleteWallet(id) },
      ]
    );
  };

  return (
    <ScreenWrapper>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingBottom: insets.bottom + 100,
          paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
        }}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.screenLabel, { color: theme.textSecondary }]}>Your money</Text>
            <Text style={[styles.title, { color: theme.text }]}>Wallets</Text>
          </View>
          <Pressable
            onPress={() => router.push("/add-wallet")}
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

        {/* Total Balance Card */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 20, marginBottom: 24 }}>
          <LinearGradient
            colors={["#C0394D", "#E05A6D", "#8B1A2E"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.totalCard,
              {
                shadowColor: "#E05A6D",
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: 0.45,
                shadowRadius: 24,
                elevation: 12,
              },
            ]}
          >
            {/* Decorative circles */}
            <View style={styles.decCircle1} />
            <View style={styles.decCircle2} />

            <Text style={styles.totalLabel}>Total Balance</Text>
            <Text style={styles.totalAmount}>{formatCurrency(totalBalance)}</Text>
            <View style={styles.totalFooter}>
              <View style={styles.totalBadge}>
                <Ionicons name="wallet-outline" size={13} color="rgba(255,255,255,0.8)" />
                <Text style={styles.totalSub}>{wallets.length} {wallets.length === 1 ? "wallet" : "wallets"}</Text>
              </View>
              <Text style={styles.totalDate}>
                {new Date().toLocaleDateString("en-PH", { month: "short", year: "numeric" })}
              </Text>
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Section heading */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>My Accounts</Text>
          <Pressable onPress={() => router.push("/add-wallet")}>
            <Text style={[styles.seeAll, { color: theme.primary }]}>+ Add wallet</Text>
          </Pressable>
        </View>

        {/* Wallet List */}
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {wallets.map((wallet, idx) => {
            const barWidth = totalBalance > 0 ? (wallet.balance / totalBalance) * 100 : 0;
            return (
              <Animated.View key={wallet.id} entering={FadeInDown.delay(idx * 60).duration(350)}>
                <LinearGradient
                  colors={[wallet.color + "18", wallet.color + "08"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[
                    styles.walletCard,
                    {
                      borderColor: wallet.color + "30",
                      shadowColor: wallet.color,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: isDark ? 0.3 : 0.12,
                      shadowRadius: 12,
                      elevation: 5,
                    },
                  ]}
                >
                  <View style={styles.walletRow}>
                    <View
                      style={[
                        styles.walletIcon,
                        {
                          backgroundColor: wallet.color + "20",
                          borderWidth: 1,
                          borderColor: wallet.color + "30",
                          shadowColor: wallet.color,
                          shadowOffset: { width: 0, height: 0 },
                          shadowOpacity: isDark ? 0.5 : 0.25,
                          shadowRadius: 8,
                        },
                      ]}
                    >
                      <Ionicons name={wallet.icon as any} size={22} color={wallet.color} />
                    </View>
                    <View style={styles.walletInfo}>
                      <Text style={[styles.walletName, { color: theme.text }]}>{wallet.name}</Text>
                      <Text style={[styles.walletType, { color: theme.textTertiary }]}>
                        {wallet.type.charAt(0).toUpperCase() + wallet.type.slice(1)}
                      </Text>
                    </View>
                    <View style={styles.walletRight}>
                      <Text style={[styles.walletBalance, { color: theme.text }]}>
                        {formatCurrency(wallet.balance)}
                      </Text>
                      {wallet.type === "custom" && (
                        <Pressable
                          onPress={() => handleDelete(wallet.id, wallet.name)}
                          style={({ pressed }) => [styles.deleteBtn, { opacity: pressed ? 0.7 : 1 }]}
                        >
                          <Ionicons name="trash-outline" size={15} color={theme.danger} />
                        </Pressable>
                      )}
                    </View>
                  </View>

                  {/* Balance bar */}
                  {totalBalance > 0 && (
                    <View style={styles.barWrap}>
                      <View style={[styles.barTrack, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }]}>
                        <LinearGradient
                          colors={[wallet.color, wallet.color + "88"]}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={[styles.barFill, { width: `${Math.max(barWidth, 4)}%` }]}
                        />
                      </View>
                      <Text style={[styles.barPct, { color: theme.textTertiary }]}>
                        {barWidth.toFixed(0)}%
                      </Text>
                    </View>
                  )}
                </LinearGradient>
              </Animated.View>
            );
          })}

          {wallets.length === 0 && (
            <View style={[styles.emptyCard, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="wallet-outline" size={36} color={theme.textTertiary} />
              <Text style={[styles.emptyTitle, { color: theme.text }]}>No wallets yet</Text>
              <Text style={[styles.emptySub, { color: theme.textSecondary }]}>Add your cash, GCash, Maya, or bank account</Text>
              <Pressable
                onPress={() => router.push("/add-wallet")}
                style={[styles.emptyBtn, { backgroundColor: theme.primary + "20", borderColor: theme.primary + "40" }]}
              >
                <Text style={[styles.emptyBtnText, { color: theme.primary }]}>Add Wallet</Text>
              </Pressable>
            </View>
          )}
        </View>
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
  addBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  totalCard: {
    borderRadius: 22,
    padding: 24,
    overflow: "hidden",
    position: "relative",
  },
  decCircle1: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: "rgba(255,255,255,0.07)",
    top: -40,
    right: -30,
  },
  decCircle2: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(255,255,255,0.05)",
    bottom: -20,
    left: 20,
  },
  totalLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.82)", marginBottom: 8 },
  totalAmount: { fontSize: 40, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -1, marginBottom: 16 },
  totalFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  totalBadge: { flexDirection: "row", alignItems: "center", gap: 5, backgroundColor: "rgba(255,255,255,0.15)", paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  totalSub: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.92)" },
  totalDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.78)" },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  sectionTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  seeAll: { fontSize: 13, fontFamily: "Inter_500Medium" },
  walletCard: {
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    gap: 12,
  },
  walletRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  walletIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: "center",
    justifyContent: "center",
  },
  walletInfo: { flex: 1 },
  walletName: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  walletType: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  walletRight: { alignItems: "flex-end", gap: 6 },
  walletBalance: { fontSize: 18, fontFamily: "Inter_700Bold" },
  deleteBtn: { padding: 4 },
  barWrap: { flexDirection: "row", alignItems: "center", gap: 8 },
  barTrack: { flex: 1, height: 5, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },
  barPct: { fontSize: 11, fontFamily: "Inter_500Medium", minWidth: 28, textAlign: "right" },
  emptyCard: { borderRadius: 18, borderWidth: 1, padding: 32, alignItems: "center", gap: 10 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold", marginTop: 4 },
  emptySub: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center" },
  emptyBtn: { marginTop: 8, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, borderWidth: 1 },
  emptyBtnText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
});
