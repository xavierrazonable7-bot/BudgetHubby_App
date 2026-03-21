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
import { useApp } from "@/context/AppContext";
import { AmountInput } from "@/components/ui/AmountInput";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";

const WALLET_COLORS = [
  "#10B981", "#2563EB", "#7C3AED", "#F59E0B",
  "#EF4444", "#EC4899", "#06B6D4", "#64748B",
];

const WALLET_ICONS = [
  { icon: "cash", label: "Cash" },
  { icon: "card", label: "Card" },
  { icon: "phone-portrait", label: "E-Wallet" },
  { icon: "business", label: "Bank" },
  { icon: "wallet", label: "Wallet" },
  { icon: "diamond", label: "Savings" },
];

export default function AddWalletScreen() {
  const { theme } = useTheme();
  const { addWallet } = useApp();
  const insets = useSafeAreaInsets();

  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [selectedColor, setSelectedColor] = useState(WALLET_COLORS[0]);
  const [selectedIcon, setSelectedIcon] = useState(WALLET_ICONS[0].icon);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = "Enter a wallet name";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    addWallet({
      name: name.trim(),
      type: "custom",
      balance: parseFloat(balance || "0"),
      color: selectedColor,
      icon: selectedIcon,
    });
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { paddingTop: Platform.OS === "ios" ? insets.top + 8 : 20 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={theme.text} />
        </Pressable>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Add Wallet</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 100, gap: 24, paddingTop: 20 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Preview */}
        <View style={[styles.preview, { backgroundColor: selectedColor }]}>
          <View style={styles.previewIcon}>
            <Ionicons name={selectedIcon as any} size={30} color="#fff" />
          </View>
          <Text style={styles.previewName}>{name || "My Wallet"}</Text>
          <Text style={styles.previewBalance}>₱{parseFloat(balance || "0").toLocaleString("en-PH", { minimumFractionDigits: 2 })}</Text>
        </View>

        <Input
          label="Wallet Name"
          value={name}
          onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: "" })); }}
          placeholder="e.g., BDO Savings"
          leftIcon="wallet-outline"
          error={errors.name}
        />

        <AmountInput value={balance} onChangeText={setBalance} label="Initial Balance" color={selectedColor} />

        {/* Color Picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Color</Text>
          <View style={styles.colorRow}>
            {WALLET_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => setSelectedColor(c)}
                style={[
                  styles.colorDot,
                  { backgroundColor: c, borderWidth: selectedColor === c ? 3 : 0, borderColor: "#fff" },
                ]}
              >
                {selectedColor === c && <Ionicons name="checkmark" size={14} color="#fff" />}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Icon Picker */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Icon</Text>
          <View style={styles.iconRow}>
            {WALLET_ICONS.map((w) => (
              <Pressable
                key={w.icon}
                onPress={() => setSelectedIcon(w.icon)}
                style={[
                  styles.iconBtn,
                  {
                    backgroundColor: selectedIcon === w.icon ? selectedColor + "20" : theme.surfaceSecondary,
                    borderColor: selectedIcon === w.icon ? selectedColor : theme.border,
                    borderWidth: selectedIcon === w.icon ? 1.5 : 1,
                  },
                ]}
              >
                <Ionicons name={w.icon as any} size={22} color={selectedIcon === w.icon ? selectedColor : theme.textSecondary} />
                <Text style={[styles.iconLabel, { color: selectedIcon === w.icon ? selectedColor : theme.textTertiary }]}>
                  {w.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, backgroundColor: theme.background, borderTopColor: theme.border }]}>
        <Button title="Create Wallet" onPress={handleSave} fullWidth size="lg" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 12 },
  closeBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  preview: { borderRadius: 20, padding: 24, alignItems: "center", gap: 8, shadowColor: "#000", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.2, shadowRadius: 12, elevation: 6 },
  previewIcon: { width: 60, height: 60, borderRadius: 30, backgroundColor: "rgba(255,255,255,0.25)", alignItems: "center", justifyContent: "center" },
  previewName: { fontSize: 20, fontFamily: "Inter_700Bold", color: "#fff" },
  previewBalance: { fontSize: 16, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.85)" },
  section: { gap: 10 },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_500Medium" },
  colorRow: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  iconRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  iconBtn: { width: 80, paddingVertical: 12, borderRadius: 12, alignItems: "center", gap: 6 },
  iconLabel: { fontSize: 10, fontFamily: "Inter_400Regular" },
  footer: { paddingHorizontal: 20, paddingTop: 12, borderTopWidth: 1 },
});
