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
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp, TransactionType, RecurringType } from "@/context/AppContext";
import { AmountInput } from "@/components/ui/AmountInput";
import { CategoryPicker } from "@/components/ui/CategoryPicker";
import { WalletPicker } from "@/components/ui/WalletPicker";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ScreenWrapper } from "@/components/ScreenWrapper";

const RECURRING_OPTIONS: { id: RecurringType; label: string; icon: string }[] = [
  { id: "one_time", label: "One-time", icon: "radio-button-on-outline" },
  { id: "weekly", label: "Weekly", icon: "refresh-circle-outline" },
  { id: "monthly", label: "Monthly", icon: "calendar-outline" },
];

export default function AddTransactionScreen() {
  const { theme, isDark } = useTheme();
  const { addTransaction, wallets } = useApp();
  const { type: typeParam } = useLocalSearchParams<{ type: string }>();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<TransactionType>(typeParam === "income" ? "income" : "expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(type === "income" ? "allowance" : "food");
  const [walletId, setWalletId] = useState(wallets[0]?.id ?? "");
  const [note, setNote] = useState("");
  const [recurring, setRecurring] = useState<RecurringType>("one_time");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isIncome = type === "income";
  const accentColor = isIncome ? theme.income : theme.expense;

  const handleTypeChange = (t: TransactionType) => {
    setType(t);
    setCategory(t === "income" ? "allowance" : "food");
    Haptics.selectionAsync();
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
    addTransaction({ type, amount: parseFloat(amount), category, walletId, date: new Date().toISOString(), note, recurringType: recurring });
    router.back();
  };

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
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, { color: theme.text }]}>New Transaction</Text>
          <View style={[styles.headerDot, { backgroundColor: accentColor }]} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Type Toggle */}
      <View style={[styles.typeToggle, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.07)" : theme.border, marginHorizontal: 20 }]}>
        {(["expense", "income"] as TransactionType[]).map((t) => {
          const active = type === t;
          const color = t === "income" ? theme.income : theme.expense;
          return (
            <Pressable key={t} onPress={() => handleTypeChange(t)} style={{ flex: 1 }}>
              {active ? (
                <LinearGradient
                  colors={t === "income" ? ["#0D2018", "#102A1E"] : ["#2A1018", "#2A1820"]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[styles.typeBtn, { borderWidth: 1, borderColor: color + "40", shadowColor: color, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 }]}
                >
                  <View style={[styles.typeIconWrap, { backgroundColor: color + "25" }]}>
                    <Ionicons name={t === "income" ? "arrow-down" : "arrow-up"} size={14} color={color} />
                  </View>
                  <Text style={[styles.typeText, { color }]}>{t === "income" ? "Income" : "Expense"}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.typeBtn, { backgroundColor: "transparent" }]}>
                  <Ionicons name={t === "income" ? "arrow-down" : "arrow-up"} size={14} color={theme.textTertiary} />
                  <Text style={[styles.typeText, { color: theme.textTertiary }]}>{t === "income" ? "Income" : "Expense"}</Text>
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 120, gap: 22, paddingTop: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Amount */}
        <AmountInput value={amount} onChangeText={setAmount} label="Amount" error={errors.amount} color={accentColor} />

        {/* Category */}
        <CategoryPicker type={type} selected={category} onSelect={setCategory} />

        {/* Wallet */}
        <WalletPicker selected={walletId} onSelect={setWalletId} />
        {errors.wallet && (
          <Text style={{ color: theme.danger, fontSize: 12, fontFamily: "Inter_400Regular", marginTop: -12 }}>
            ⚠ {errors.wallet}
          </Text>
        )}

        {/* Frequency */}
        <View style={{ gap: 10 }}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Frequency</Text>
          <View style={styles.recurringRow}>
            {RECURRING_OPTIONS.map((r) => {
              const active = recurring === r.id;
              return (
                <Pressable
                  key={r.id}
                  onPress={() => setRecurring(r.id)}
                  style={({ pressed }) => [{ flex: 1, opacity: pressed ? 0.8 : 1 }]}
                >
                  <View
                    style={[
                      styles.recurringBtn,
                      active
                        ? { backgroundColor: accentColor + "20", borderColor: accentColor + "50", borderWidth: 1.5, shadowColor: accentColor, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 6 }
                        : { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.07)" : theme.border, borderWidth: 1 },
                    ]}
                  >
                    <Ionicons name={r.icon as any} size={16} color={active ? accentColor : theme.textTertiary} />
                    <Text style={[styles.recurringText, { color: active ? accentColor : theme.textSecondary }]}>
                      {r.label}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
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

      {/* Save Footer */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: "transparent", borderTopColor: isDark ? "rgba(255,255,255,0.06)" : theme.border }]}>
        <Button
          title={`Save ${isIncome ? "Income" : "Expense"}`}
          onPress={handleSave}
          fullWidth
          size="lg"
          style={{ backgroundColor: accentColor }}
        />
      </View>
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
  iconBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    alignItems: "center",
    gap: 4,
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerDot: { width: 20, height: 3, borderRadius: 2 },
  typeToggle: {
    flexDirection: "row",
    borderRadius: 16,
    padding: 5,
    marginBottom: 8,
    borderWidth: 1,
  },
  typeBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 11,
    borderRadius: 12,
    gap: 7,
  },
  typeIconWrap: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  typeText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 0.1 },
  recurringRow: { flexDirection: "row", gap: 10 },
  recurringBtn: {
    alignItems: "center",
    paddingVertical: 13,
    borderRadius: 14,
    gap: 6,
  },
  recurringText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
});
