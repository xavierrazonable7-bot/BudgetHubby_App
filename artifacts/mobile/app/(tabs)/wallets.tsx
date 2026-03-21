import React, { useState } from "react";
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
import Animated, { FadeInDown } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { formatCurrency } from "@/utils/format";
import { Card } from "@/components/ui/Card";

export default function WalletsScreen() {
  const { theme } = useTheme();
  const { wallets, totalBalance, deleteWallet } = useApp();
  const insets = useSafeAreaInsets();

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      "Delete Wallet",
      `Are you sure you want to delete "${name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => deleteWallet(id),
        },
      ]
    );
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
          <Text style={[styles.title, { color: theme.text }]}>Wallets</Text>
          <Pressable
            onPress={() => router.push("/add-wallet")}
            style={[styles.addBtn, { backgroundColor: theme.primary }]}
          >
            <Ionicons name="add" size={20} color="#fff" />
          </Pressable>
        </View>

        {/* Total Balance */}
        <Animated.View entering={FadeInDown.duration(400)} style={{ paddingHorizontal: 20, marginBottom: 20 }}>
          <View style={[styles.totalCard, { backgroundColor: theme.primary }]}>
            <Text style={styles.totalLabel}>Total Balance</Text>
            <Text style={styles.totalAmount}>{formatCurrency(totalBalance)}</Text>
            <Text style={styles.totalSub}>{wallets.length} wallets</Text>
          </View>
        </Animated.View>

        {/* Wallet List */}
        <View style={{ paddingHorizontal: 20, gap: 12 }}>
          {wallets.map((wallet, idx) => (
            <Animated.View key={wallet.id} entering={FadeInDown.delay(idx * 50).duration(350)}>
              <Card>
                <View style={styles.walletRow}>
                  <View style={[styles.walletIcon, { backgroundColor: wallet.color + "20" }]}>
                    <Ionicons name={wallet.icon as any} size={24} color={wallet.color} />
                  </View>
                  <View style={styles.walletInfo}>
                    <Text style={[styles.walletName, { color: theme.text }]}>{wallet.name}</Text>
                    <Text style={[styles.walletType, { color: theme.textTertiary }]}>
                      {wallet.type}
                    </Text>
                  </View>
                  <View style={styles.walletRight}>
                    <Text style={[styles.walletBalance, { color: theme.text }]}>
                      {formatCurrency(wallet.balance)}
                    </Text>
                    {wallet.type === "custom" && (
                      <Pressable onPress={() => handleDelete(wallet.id, wallet.name)} style={styles.deleteBtn}>
                        <Ionicons name="trash-outline" size={16} color={theme.danger} />
                      </Pressable>
                    )}
                  </View>
                </View>
              </Card>
            </Animated.View>
          ))}
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
    marginBottom: 16,
  },
  title: { fontSize: 28, fontFamily: "Inter_700Bold" },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  totalCard: {
    borderRadius: 20,
    padding: 24,
    gap: 4,
    shadowColor: "#2563EB",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  totalLabel: { fontSize: 13, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.75)" },
  totalAmount: { fontSize: 36, fontFamily: "Inter_700Bold", color: "#fff", letterSpacing: -0.5 },
  totalSub: { fontSize: 12, fontFamily: "Inter_400Regular", color: "rgba(255,255,255,0.6)" },
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
  walletType: { fontSize: 12, fontFamily: "Inter_400Regular", textTransform: "capitalize", marginTop: 2 },
  walletRight: { alignItems: "flex-end", gap: 6 },
  walletBalance: { fontSize: 18, fontFamily: "Inter_700Bold" },
  deleteBtn: { padding: 4 },
});
