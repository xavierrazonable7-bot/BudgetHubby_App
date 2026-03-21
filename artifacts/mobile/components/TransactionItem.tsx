import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInRight } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { Transaction } from "@/context/AppContext";
import { getCategoryColor, getCategoryIcon, getCategoryLabel } from "@/utils/categories";
import { formatCurrency, formatDateShort } from "@/utils/format";

interface TransactionItemProps {
  transaction: Transaction;
  onPress?: () => void;
  index?: number;
}

export function TransactionItem({ transaction, onPress, index = 0 }: TransactionItemProps) {
  const { theme } = useTheme();
  const isIncome = transaction.type === "income";
  const categoryColor = getCategoryColor(transaction.category);
  const categoryIcon = getCategoryIcon(transaction.category);
  const categoryLabel = getCategoryLabel(transaction.category);
  const amountColor = isIncome ? theme.income : theme.expense;

  return (
    <Animated.View entering={FadeInRight.delay(index * 30).duration(300)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.container,
          {
            backgroundColor: theme.card,
            borderColor: theme.border,
            opacity: pressed ? 0.85 : 1,
            transform: [{ scale: pressed ? 0.99 : 1 }],
          },
        ]}
      >
        <View style={[styles.iconCircle, { backgroundColor: categoryColor + "20" }]}>
          <Ionicons name={categoryIcon as any} size={20} color={categoryColor} />
        </View>
        <View style={styles.info}>
          <Text style={[styles.category, { color: theme.text }]}>{categoryLabel}</Text>
          {transaction.note ? (
            <Text style={[styles.note, { color: theme.textTertiary }]} numberOfLines={1}>
              {transaction.note}
            </Text>
          ) : (
            <Text style={[styles.note, { color: theme.textTertiary }]}>
              {formatDateShort(transaction.date)}
            </Text>
          )}
        </View>
        <View style={styles.right}>
          <Text style={[styles.amount, { color: amountColor }]}>
            {isIncome ? "+" : "-"}
            {formatCurrency(transaction.amount)}
          </Text>
          <Text style={[styles.date, { color: theme.textTertiary }]}>
            {formatDateShort(transaction.date)}
          </Text>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 8,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  info: { flex: 1, gap: 3 },
  category: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  note: { fontSize: 12, fontFamily: "Inter_400Regular" },
  right: { alignItems: "flex-end", gap: 3 },
  amount: { fontSize: 15, fontFamily: "Inter_700Bold" },
  date: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
