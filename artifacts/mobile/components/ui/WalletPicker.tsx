import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "@/context/ThemeContext";
import { useApp, Wallet } from "@/context/AppContext";
import { formatCurrency } from "@/utils/format";

interface WalletPickerProps {
  selected: string;
  onSelect: (walletId: string) => void;
}

export function WalletPicker({ selected, onSelect }: WalletPickerProps) {
  const { theme } = useTheme();
  const { wallets } = useApp();

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Wallet</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {wallets.map((wallet) => {
          const isSelected = selected === wallet.id;
          return (
            <WalletItem
              key={wallet.id}
              wallet={wallet}
              isSelected={isSelected}
              onSelect={onSelect}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

function WalletItem({
  wallet,
  isSelected,
  onSelect,
}: {
  wallet: Wallet;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={() => onSelect(wallet.id)}
      style={({ pressed }) => [
        styles.item,
        {
          backgroundColor: isSelected ? wallet.color + "20" : theme.surfaceSecondary,
          borderColor: isSelected ? wallet.color : theme.border,
          borderWidth: isSelected ? 1.5 : 1,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View style={[styles.iconCircle, { backgroundColor: isSelected ? wallet.color : wallet.color + "30" }]}>
        <Ionicons
          name={wallet.icon as any}
          size={16}
          color={isSelected ? "#fff" : wallet.color}
        />
      </View>
      <Text
        style={[
          styles.walletName,
          {
            color: isSelected ? wallet.color : theme.text,
            fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_500Medium",
          },
        ]}
      >
        {wallet.name}
      </Text>
      <Text style={[styles.balance, { color: theme.textTertiary }]}>
        {formatCurrency(wallet.balance)}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8 },
  label: { fontSize: 13, fontFamily: "Inter_500Medium" },
  scroll: { flexGrow: 0 },
  item: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    padding: 12,
    marginRight: 10,
    minWidth: 85,
    gap: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  walletName: { fontSize: 13 },
  balance: { fontSize: 11, fontFamily: "Inter_400Regular" },
});
