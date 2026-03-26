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
import { useApp } from "@/context/AppContext";
import { AmountInput } from "@/components/ui/AmountInput";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { ScreenWrapper } from "@/components/ScreenWrapper";

const WALLET_COLORS = [
  "#2DD4BF", "#E05A6D", "#F59E0B", "#EF4444",
  "#10B981", "#F472B6", "#22D3EE", "#F97316",
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
  const { theme, isDark } = useTheme();
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
    addWallet({ name: name.trim(), type: "custom", balance: parseFloat(balance || "0"), color: selectedColor, icon: selectedIcon });
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
          <Text style={[styles.headerTitle, { color: theme.text }]}>New Wallet</Text>
          <View style={[styles.headerDot, { backgroundColor: selectedColor }]} />
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 120, gap: 24, paddingTop: 4 }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Live Preview Card */}
        <LinearGradient
          colors={[selectedColor + "DD", selectedColor + "99"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.previewCard,
            {
              shadowColor: selectedColor,
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 10,
            },
          ]}
        >
          {/* Deco circles */}
          <View style={styles.deco1} />
          <View style={styles.deco2} />
          <View style={styles.previewTop}>
            <View style={styles.previewIconWrap}>
              <Ionicons name={selectedIcon as any} size={28} color="#fff" />
            </View>
            <Text style={styles.previewType}>Custom Wallet</Text>
          </View>
          <Text style={styles.previewName}>{name || "My Wallet"}</Text>
          <Text style={styles.previewBalance}>
            ₱{parseFloat(balance || "0").toLocaleString("en-PH", { minimumFractionDigits: 2 })}
          </Text>
        </LinearGradient>

        <Input
          label="Wallet Name"
          value={name}
          onChangeText={(t) => { setName(t); setErrors((e) => ({ ...e, name: "" })); }}
          placeholder="e.g., BDO Savings, GCash"
          leftIcon="wallet-outline"
          error={errors.name}
        />

        <AmountInput value={balance} onChangeText={setBalance} label="Initial Balance" color={selectedColor} />

        {/* Color Picker */}
        <View style={{ gap: 10 }}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Color</Text>
          <View style={styles.colorGrid}>
            {WALLET_COLORS.map((c) => (
              <Pressable
                key={c}
                onPress={() => { setSelectedColor(c); Haptics.selectionAsync(); }}
                style={({ pressed }) => [styles.colorSwatch, { backgroundColor: c, opacity: pressed ? 0.8 : 1, borderWidth: selectedColor === c ? 3 : 0, borderColor: "#fff", shadowColor: c, shadowOffset: { width: 0, height: 4 }, shadowOpacity: selectedColor === c ? 0.6 : 0.2, shadowRadius: 8 }]}
              >
                {selectedColor === c && <Ionicons name="checkmark" size={16} color="#fff" />}
              </Pressable>
            ))}
          </View>
        </View>

        {/* Icon Picker */}
        <View style={{ gap: 10 }}>
          <Text style={[styles.sectionLabel, { color: theme.textSecondary }]}>Icon</Text>
          <View style={styles.iconGrid}>
            {WALLET_ICONS.map((w) => {
              const active = selectedIcon === w.icon;
              return (
                <Pressable
                  key={w.icon}
                  onPress={() => { setSelectedIcon(w.icon); Haptics.selectionAsync(); }}
                  style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1, flex: 1 }]}
                >
                  <View
                    style={[
                      styles.iconBtn,
                      active
                        ? { backgroundColor: selectedColor + "20", borderColor: selectedColor + "50", borderWidth: 1.5, shadowColor: selectedColor, shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.3, shadowRadius: 8 }
                        : { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.07)" : theme.border, borderWidth: 1 },
                    ]}
                  >
                    <Ionicons name={w.icon as any} size={22} color={active ? selectedColor : theme.textSecondary} />
                    <Text style={[styles.iconLabel, { color: active ? selectedColor : theme.textTertiary }]}>{w.label}</Text>
                  </View>
                </Pressable>
              );
            })}
          </View>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16, borderTopColor: isDark ? "rgba(255,255,255,0.06)" : theme.border }]}>
        <Button title="Create Wallet" onPress={handleSave} fullWidth size="lg" style={{ backgroundColor: selectedColor }} />
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
  previewCard: {
    borderRadius: 22,
    padding: 24,
    overflow: "hidden",
    position: "relative",
  },
  deco1: { position: "absolute", width: 120, height: 120, borderRadius: 60, backgroundColor: "rgba(255,255,255,0.1)", top: -30, right: -20 },
  deco2: { position: "absolute", width: 80, height: 80, borderRadius: 40, backgroundColor: "rgba(255,255,255,0.07)", bottom: -20, left: 10 },
  previewTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 20 },
  previewIconWrap: { width: 48, height: 48, borderRadius: 24, backgroundColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  previewType: { fontSize: 12, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.7)" },
  previewName: { fontSize: 22, fontFamily: "Inter_700Bold", color: "#fff", marginBottom: 6 },
  previewBalance: { fontSize: 16, fontFamily: "Inter_500Medium", color: "rgba(255,255,255,0.85)" },
  sectionLabel: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 0.1 },
  colorGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12, justifyContent: "center" },
  colorSwatch: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  iconGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  iconBtn: { paddingVertical: 14, borderRadius: 14, alignItems: "center", gap: 7, minWidth: 70 },
  iconLabel: { fontSize: 10, fontFamily: "Inter_500Medium" },
  footer: { paddingHorizontal: 20, paddingTop: 14, borderTopWidth: 1 },
});
