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
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp, DebtType } from "@/context/AppContext";
import { AmountInput } from "@/components/ui/AmountInput";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ScreenWrapper } from "@/components/ScreenWrapper";

export default function AddDebtScreen() {
  const { theme, isDark } = useTheme();
  const { addDebt } = useApp();
  const insets = useSafeAreaInsets();

  const [type, setType] = useState<DebtType>("lent");
  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const isLent = type === "lent";
  const accentColor = isLent ? theme.income : theme.expense;

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
    addDebt({ type, personName: personName.trim(), amount: parseFloat(amount), paidAmount: 0, note, date: new Date().toISOString(), status: "pending" });
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>Record Debt</Text>
          <View style={[styles.headerDot, { backgroundColor: accentColor }]} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Type Toggle */}
      <View style={[styles.typeToggle, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.07)" : theme.border, marginHorizontal: 20 }]}>
        {([
          { t: "lent" as DebtType, label: "I Lent", icon: "arrow-down", color: theme.income, grad: ["#0D2018", "#102A1E"] as [string, string] },
          { t: "borrowed" as DebtType, label: "I Borrowed", icon: "arrow-up", color: theme.expense, grad: ["#2A1018", "#2A1820"] as [string, string] },
        ]).map((item) => {
          const active = type === item.t;
          return (
            <Pressable key={item.t} onPress={() => { setType(item.t); Haptics.selectionAsync(); }} style={{ flex: 1 }}>
              {active ? (
                <LinearGradient
                  colors={item.grad}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={[styles.typeBtn, { borderWidth: 1, borderColor: item.color + "40", shadowColor: item.color, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 }]}
                >
                  <View style={[styles.typeIconWrap, { backgroundColor: item.color + "25" }]}>
                    <Ionicons name={item.icon as any} size={14} color={item.color} />
                  </View>
                  <Text style={[styles.typeText, { color: item.color }]}>{item.label}</Text>
                </LinearGradient>
              ) : (
                <View style={[styles.typeBtn, { backgroundColor: "transparent" }]}>
                  <Ionicons name={item.icon as any} size={14} color={theme.textTertiary} />
                  <Text style={[styles.typeText, { color: theme.textTertiary }]}>{item.label}</Text>
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
        {/* Context Banner */}
        <LinearGradient
          colors={isLent ? ["#0D2018", "#102A1E"] : ["#2A1018", "#2A1820"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[styles.contextBanner, { borderColor: accentColor + "30" }]}
        >
          <View style={[styles.contextIconWrap, { backgroundColor: accentColor + "20" }]}>
            <Ionicons name={isLent ? "arrow-down-circle" : "arrow-up-circle"} size={24} color={accentColor} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.contextTitle, { color: accentColor }]}>
              {isLent ? "Money Lent" : "Money Borrowed"}
            </Text>
            <Text style={[styles.contextSub, { color: theme.textSecondary }]}>
              {isLent ? "Record money someone owes you" : "Record money you owe someone"}
            </Text>
          </View>
        </LinearGradient>

        <Input
          label="Person's Name"
          value={personName}
          onChangeText={(t) => { setPersonName(t); setErrors((e) => ({ ...e, name: "" })); }}
          placeholder="Enter name"
          leftIcon="person-outline"
          error={errors.name}
        />

        <AmountInput value={amount} onChangeText={setAmount} label="Amount" error={errors.amount} color={accentColor} />

        <Input
          label="Note (optional)"
          value={note}
          onChangeText={setNote}
          placeholder="What's this for? (e.g., baon, utang, etc.)"
          leftIcon="document-text-outline"
          multiline
        />
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: isDark ? "rgba(255,255,255,0.06)" : theme.border }]}>
        <Button
          title={isLent ? "Record Lent Amount" : "Record Borrowed Amount"}
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
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerCenter: { alignItems: "center", gap: 4 },
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
  typeIconWrap: { width: 22, height: 22, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  typeText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  contextBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  contextIconWrap: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  contextTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  contextSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
});
