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
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { getCategoryColor, getCategoryIcon, getCategoryLabel } from "@/utils/categories";
import { formatCurrency, formatDate, formatTime } from "@/utils/format";

export default function TransactionDetailScreen() {
  const { theme } = useTheme();
  const { transactions, wallets, deleteTransaction } = useApp();
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();

  const tx = transactions.find((t) => t.id === id);
  const wallet = wallets.find((w) => w.id === tx?.walletId);

  if (!tx) {
    router.back();
    return null;
  }

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

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === "ios" ? insets.top + 8 : 20 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Transaction</Text>
        <Pressable onPress={handleDelete} style={styles.deleteBtn}>
          <Ionicons name="trash-outline" size={20} color={theme.danger} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 40,
          paddingTop: 20,
          gap: 20,
        }}
      >
        {/* Main Info */}
        <View style={styles.mainCard}>
          <View style={[styles.bigIcon, { backgroundColor: catColor + "20" }]}>
            <Ionicons name={catIcon as any} size={36} color={catColor} />
          </View>
          <Text style={[styles.categoryName, { color: theme.text }]}>{catLabel}</Text>
          <Text style={[styles.bigAmount, { color: amountColor }]}>
            {isIncome ? "+" : "-"}
            {formatCurrency(tx.amount)}
          </Text>
          <View style={[styles.typeBadge, { backgroundColor: isIncome ? theme.accentLight : theme.dangerLight }]}>
            <Text style={[styles.typeText, { color: isIncome ? theme.accent : theme.danger }]}>
              {isIncome ? "Income" : "Expense"}
            </Text>
          </View>
        </View>

        {/* Details */}
        <View style={[styles.detailCard, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <DetailRow
            label="Date"
            value={formatDate(tx.date)}
            icon="calendar-outline"
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <DetailRow
            label="Time"
            value={formatTime(tx.date)}
            icon="time-outline"
          />
          <View style={[styles.divider, { backgroundColor: theme.border }]} />
          <DetailRow
            label="Wallet"
            value={wallet?.name ?? "Unknown"}
            icon={wallet?.icon ?? "wallet-outline"}
            iconColor={wallet?.color}
          />
          {tx.recurringType && tx.recurringType !== "one_time" && (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <DetailRow
                label="Frequency"
                value={tx.recurringType === "weekly" ? "Weekly" : "Monthly"}
                icon="repeat-outline"
              />
            </>
          )}
          {tx.note ? (
            <>
              <View style={[styles.divider, { backgroundColor: theme.border }]} />
              <DetailRow
                label="Note"
                value={tx.note}
                icon="document-text-outline"
              />
            </>
          ) : null}
        </View>
      </ScrollView>
    </View>
  );
}

function DetailRow({
  label,
  value,
  icon,
  iconColor,
}: {
  label: string;
  value: string;
  icon: string;
  iconColor?: string;
}) {
  const { theme } = useTheme();
  return (
    <View style={styles.detailRow}>
      <View style={[styles.detailIcon, { backgroundColor: (iconColor || theme.primary) + "15" }]}>
        <Ionicons name={icon as any} size={16} color={iconColor || theme.primary} />
      </View>
      <View style={styles.detailText}>
        <Text style={[styles.detailLabel, { color: theme.textTertiary }]}>{label}</Text>
        <Text style={[styles.detailValue, { color: theme.text }]}>{value}</Text>
      </View>
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
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  deleteBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  mainCard: { alignItems: "center", gap: 10, paddingVertical: 20 },
  bigIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  categoryName: { fontSize: 18, fontFamily: "Inter_600SemiBold" },
  bigAmount: { fontSize: 40, fontFamily: "Inter_700Bold", letterSpacing: -1 },
  typeBadge: { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 20 },
  typeText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  detailCard: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  detailIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  detailText: { flex: 1, gap: 2 },
  detailLabel: { fontSize: 11, fontFamily: "Inter_400Regular", textTransform: "uppercase", letterSpacing: 0.5 },
  detailValue: { fontSize: 15, fontFamily: "Inter_500Medium" },
  divider: { height: 1, marginHorizontal: 16 },
});
