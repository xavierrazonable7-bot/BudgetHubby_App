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
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { getCategoryColor, getCategoryIcon, getCategoryLabel } from "@/utils/categories";
import { formatCurrency, formatDate, formatTime } from "@/utils/format";
import { ScreenWrapper } from "@/components/ScreenWrapper";

export default function TransactionDetailScreen() {
  const { theme, isDark } = useTheme();
  const { transactions, wallets, deleteTransaction } = useApp();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const tx = transactions.find((t) => t.id === id);
  const wallet = wallets.find((w) => w.id === tx?.walletId);

  if (!tx) { router.back(); return null; }

  const isIncome = tx.type === "income";
  const catColor = getCategoryColor(tx.category);
  const catIcon = getCategoryIcon(tx.category);
  const catLabel = getCategoryLabel(tx.category);
  const amountColor = isIncome ? theme.income : theme.expense;

  const handleDelete = () => {
    Alert.alert("Delete Transaction", "Remove this transaction?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          deleteTransaction(tx.id);
          router.back();
        },
      },
    ]);
  };

  const DETAIL_ROWS = [
    { label: "Date", value: formatDate(tx.date), icon: "calendar-outline", color: "#6366F1" },
    { label: "Time", value: formatTime(tx.date), icon: "time-outline", color: "#2DD4BF" },
    { label: "Wallet", value: wallet?.name ?? "Unknown", icon: wallet?.icon ?? "wallet-outline", color: wallet?.color ?? "#9CA3AF" },
    ...(tx.recurringType && tx.recurringType !== "one_time"
      ? [{ label: "Frequency", value: tx.recurringType === "weekly" ? "Weekly" : "Monthly", icon: "repeat-outline", color: "#F59E0B" }]
      : []),
    ...(tx.note ? [{ label: "Note", value: tx.note, icon: "document-text-outline", color: "#A78BFA" }] : []),
  ];

  return (
    <ScreenWrapper>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === "ios" ? insets.top + 8 : 20 }]}>
        <Pressable
          onPress={() => router.back()}
          style={[styles.iconBtn, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.08)" : theme.border, borderWidth: 1 }]}
        >
          <Ionicons name="close" size={20} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Transaction</Text>
        <Pressable
          onPress={handleDelete}
          style={[styles.iconBtn, { backgroundColor: theme.expense + "18", borderColor: theme.expense + "30", borderWidth: 1 }]}
        >
          <Ionicons name="trash-outline" size={18} color={theme.expense} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
          paddingTop: 8,
          gap: 20,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Amount Card */}
        <LinearGradient
          colors={isIncome ? ["#0D2018", "#102A1E"] : ["#2A1018", "#2A1820"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[
            styles.heroCard,
            {
              borderColor: amountColor + "30",
              shadowColor: amountColor,
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: isDark ? 0.35 : 0.15,
              shadowRadius: 20,
              elevation: 8,
            },
          ]}
        >
          {/* Glow icon */}
          <View
            style={[
              styles.heroIcon,
              {
                backgroundColor: catColor + "20",
                borderWidth: 1,
                borderColor: catColor + "35",
                shadowColor: catColor,
                shadowOffset: { width: 0, height: 0 },
                shadowOpacity: 0.6,
                shadowRadius: 14,
              },
            ]}
          >
            <Ionicons name={catIcon as any} size={34} color={catColor} />
          </View>

          <Text style={[styles.heroCategory, { color: theme.textSecondary }]}>{catLabel}</Text>

          <Text style={[styles.heroAmount, { color: amountColor }]}>
            {isIncome ? "+" : "-"}{formatCurrency(tx.amount)}
          </Text>

          <View style={[styles.typePill, { backgroundColor: amountColor + "20", borderColor: amountColor + "35" }]}>
            <View style={[styles.typePillDot, { backgroundColor: amountColor }]} />
            <Text style={[styles.typePillText, { color: amountColor }]}>
              {isIncome ? "Income" : "Expense"}
            </Text>
          </View>
        </LinearGradient>

        {/* Details Card */}
        <View
          style={[
            styles.detailCard,
            {
              backgroundColor: theme.surface,
              borderColor: isDark ? "rgba(255,255,255,0.05)" : theme.border,
              shadowColor: "#000",
              shadowOffset: { width: 3, height: 3 },
              shadowOpacity: isDark ? 0.45 : 0.06,
              shadowRadius: 10,
              elevation: 4,
            },
          ]}
        >
          {DETAIL_ROWS.map((row, idx) => (
            <React.Fragment key={row.label}>
              <View style={styles.detailRow}>
                <View
                  style={[
                    styles.detailIcon,
                    {
                      backgroundColor: row.color + "18",
                      borderWidth: 1,
                      borderColor: row.color + "28",
                      shadowColor: row.color,
                      shadowOffset: { width: 0, height: 0 },
                      shadowOpacity: isDark ? 0.4 : 0.15,
                      shadowRadius: 6,
                    },
                  ]}
                >
                  <Ionicons name={row.icon as any} size={16} color={row.color} />
                </View>
                <View style={styles.detailText}>
                  <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>{row.label}</Text>
                  <Text style={[styles.detailValue, { color: theme.text }]}>{row.value}</Text>
                </View>
              </View>
              {idx < DETAIL_ROWS.length - 1 && (
                <View style={[styles.divider, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : theme.border }]} />
              )}
            </React.Fragment>
          ))}
        </View>

        {/* Delete Button */}
        <Pressable
          onPress={handleDelete}
          style={({ pressed }) => [
            styles.deleteBtn,
            {
              backgroundColor: theme.expense + "12",
              borderColor: theme.expense + "30",
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Ionicons name="trash-outline" size={18} color={theme.expense} />
          <Text style={[styles.deleteBtnText, { color: theme.expense }]}>Delete Transaction</Text>
        </Pressable>
      </ScrollView>
    </ScreenWrapper>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 14,
  },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  heroCard: {
    borderRadius: 22,
    padding: 28,
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
  },
  heroIcon: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  heroCategory: { fontSize: 14, fontFamily: "Inter_500Medium", letterSpacing: 0.3 },
  heroAmount: { fontSize: 46, fontFamily: "Inter_700Bold", letterSpacing: -1.5 },
  typePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  typePillDot: { width: 6, height: 6, borderRadius: 3 },
  typePillText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  detailCard: {
    borderRadius: 18,
    borderWidth: 1,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    paddingVertical: 15,
    paddingHorizontal: 18,
  },
  detailIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  detailText: { flex: 1, gap: 3 },
  detailLabel: { fontSize: 11, fontFamily: "Inter_500Medium", textTransform: "uppercase", letterSpacing: 0.7 },
  detailValue: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  divider: { height: 1, marginHorizontal: 18 },
  deleteBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  deleteBtnText: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
