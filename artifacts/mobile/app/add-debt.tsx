import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp, DebtType } from "@/context/AppContext";
import { AmountInput } from "@/components/ui/AmountInput";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

export default function AddDebtScreen() {
  const { theme } = useTheme();
  const { addDebt } = useApp();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<DebtType>("lent");
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const accentColor = type === "lent" ? theme.accent : theme.danger;

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!personName.trim()) errs.name = "Enter a name";
    if (!amount || parseFloat(amount) <= 0) errs.amount = "Enter a valid amount";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addDebt({
      type,
      personName: personName.trim(),
      amount: parseFloat(amount),
      paidAmount: 0,
      note,
      date: new Date().toISOString(),
      status: "pending",
    });
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: Platform.OS === "ios" ? insets.top + 8 : 20 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Add Debt</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Type Toggle */}
      <View style={[styles.typeRow, { backgroundColor: theme.surfaceSecondary, marginHorizontal: 20 }]}>
        <Pressable
          onPress={() => setType("lent")}
          style={[styles.typeBtn, { backgroundColor: type === "lent" ? theme.accent : "transparent" }]}
        >
          <Ionicons name="arrow-down" size={16} color={type === "lent" ? "#fff" : theme.textSecondary} />
          <Text style={[styles.typeText, { color: type === "lent" ? "#fff" : theme.textSecondary }]}>
            I Lent
          </Text>
        </Pressable>
        <Pressable
          onPress={() => setType("borrowed")}
          style={[styles.typeBtn, { backgroundColor: type === "borrowed" ? theme.danger : "transparent" }]}
        >
          <Ionicons name="arrow-up" size={16} color={type === "borrowed" ? "#fff" : theme.textSecondary} />
          <Text style={[styles.typeText, { color: type === "borrowed" ? "#fff" : theme.textSecondary }]}>
            I Borrowed
          </Text>
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingBottom: insets.bottom + 100,
          gap: 20,
          paddingTop: 20,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.contextCard, { backgroundColor: accentColor + "15", borderColor: accentColor + "30" }]}>
          <Ionicons
            name={type === "lent" ? "arrow-down-circle" : "arrow-up-circle"}
            size={22}
            color={accentColor}
          />
          <Text style={[styles.contextText, { color: accentColor }]}>
            {type === "lent"
              ? "Someone owes you money"
              : "You owe someone money"}
          </Text>
        </View>

        <Input
          label="Person's Name"
          value={personName}
          onChangeText={(t) => { setPersonName(t); setErrors((e) => ({ ...e, name: "" })); }}
          placeholder="Enter name"
          leftIcon="person-outline"
          error={errors.name}
        />

        <AmountInput
          value={amount}
          onChangeText={setAmount}
          label="Amount"
          error={errors.amount}
          color={accentColor}
        />

        <Input
          label="Note (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="What's this for?"
          leftIcon="document-text-outline"
          multiline
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <Button
          title={type === "lent" ? "Record Lent Amount" : "Record Borrowed Amount"}
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
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
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
  contextCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  contextText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
});
