import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Alert,
} from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp, TransactionType, RecurringType } from "@/context/AppContext";
import { AmountInput } from "@/components/ui/AmountInput";
import { CategoryPicker } from "@/components/ui/CategoryPicker";
import { WalletPicker } from "@/components/ui/WalletPicker";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function AddTransactionScreen() {
  const { theme } = useTheme();
  const { addTransaction, wallets } = useApp();
  const { type: typeParam } = useLocalSearchParams<{ type: string }>();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<TransactionType>(
    typeParam === "income" ? "income" : "expense"
  );
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(type === "income" ? "allowance" : "food");
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [recurring, setRecurring] = useState<RecurringType>("one_time");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const accentColor = type === "income" ? theme.income : theme.expense;

  const handleTypeChange = (t: TransactionType) => {
    setType(t);
    setCategory(t === "income" ? "allowance" : "food");
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!amount || parseFloat(amount) <= 0) errs.amount = "Enter a valid amount";
    if (!walletId) errs.wallet = "Select a wallet";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addTransaction({
      type,
      amount: parseFloat(amount),
      category,
      walletId,
      date: new Date().toISOString(),
      note,
      recurringType: recurring,
    });
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: Platform.OS === "ios" ? insets.top + 8 : 20 },
        ]}
      >
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Add Transaction</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Type Toggle */}
      <View style={[styles.typeRow, { backgroundColor: theme.surfaceSecondary, marginHorizontal: 20 }]}>
        {(["expense", "income"] as TransactionType[]).map((t) => (
          <Pressable
            key={t}
            onPress={() => handleTypeChange(t)}
            style={[
              styles.typeBtn,
              {
                backgroundColor:
                  type === t
                    ? t === "income"
                      ? theme.income
                      : theme.expense
                    : "transparent",
              },
            ]}
          >
            <Ionicons
              name={t === "income" ? "arrow-down" : "arrow-up"}
              size={16}
              color={type === t ? "#fff" : theme.textSecondary}
            />
            <Text
              style={[
                styles.typeText,
                { color: type === t ? "#fff" : theme.textSecondary },
              ]}
            >
              {t === "income" ? "Income" : "Expense"}
            </Text>
          </Pressable>
        ))}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100, gap: 20, paddingTop: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Amount */}
        <AmountInput
          value={amount}
          onChangeText={setAmount}
          label="Amount"
          error={errors.amount}
          color={accentColor}
        />

        {/* Category */}
        <CategoryPicker type={type} selected={category} onSelect={setCategory} />

        {/* Wallet */}
        <WalletPicker selected={walletId} onSelect={setWalletId} />
        {errors.wallet && (
          <Text style={{ color: theme.danger, fontSize: 12, fontFamily: "Inter_400Regular" }}>
            {errors.wallet}
          </Text>
        )}

        {/* Recurring */}
        <View style={{ gap: 8 }}>
          <Text style={[styles.label, { color: theme.textSecondary }]}>Frequency</Text>
          <View style={styles.recurringRow}>
            {([
              { id: "one_time", label: "One-time" },
              { id: "weekly", label: "Weekly" },
              { id: "monthly", label: "Monthly" },
            ] as { id: RecurringType; label: string }[]).map((r) => (
              <Pressable
                key={r.id}
                onPress={() => setRecurring(r.id)}
                style={[
                  styles.recurringBtn,
                  {
                    backgroundColor: recurring === r.id ? accentColor + "20" : theme.surfaceSecondary,
                    borderColor: recurring === r.id ? accentColor : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.recurringText,
                    { color: recurring === r.id ? accentColor : theme.textSecondary },
                  ]}
                >
                  {r.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Note */}
        <Input
          label="Note (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="What's this for?"
          leftIcon="document-text-outline"
          multiline
        />
      </ScrollView>

      {/* Save Button */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + 16,
            backgroundColor: theme.background,
            borderTopColor: theme.border,
          },
        ]}
      >
        <Button
          title={`Save ${type === "income" ? "Income" : "Expense"}`}
          onPress={handleSave}
          fullWidth
          size="lg"
          style={{ backgroundColor: accentColor }}
        />
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
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  typeRow: {
    flexDirection: "row",
    borderRadius: 14,
    padding: 4,
    marginBottom: 8,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 10,
    gap: 6,
  },
  typeText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  recurringRow: { flexDirection: "row", gap: 8 },
  recurringBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  recurringText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: 1,
  },
});
