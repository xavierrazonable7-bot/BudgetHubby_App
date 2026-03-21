import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import { useTheme } from "@/context/ThemeContext";
import { Wallet } from "@/context/AppContext";
import { formatCurrency } from "@/utils/format";

interface WalletCardProps {
  wallet: Wallet;
  onPress?: () => void;
  index?: number;
}

export function WalletCard({ wallet, onPress, index = 0 }: WalletCardProps) {
  const { theme } = useTheme();

  return (
    <Animated.View entering={FadeInUp.delay(index * 60).duration(400)}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [
          styles.card,
          {
            backgroundColor: wallet.color,
            opacity: pressed ? 0.9 : 1,
            transform: [{ scale: pressed ? 0.98 : 1 }],
          },
        ]}
      >
        <View style={styles.header}>
          <View style={styles.iconCircle}>
            <Ionicons name={wallet.icon as any} size={22} color="#fff" />
          </View>
          <Ionicons name="ellipsis-horizontal" size={20} color="rgba(255,255,255,0.7)" />
        </View>
        <Text style={styles.balance}>{formatCurrency(wallet.balance)}</Text>
        <Text style={styles.name}>{wallet.name}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 20,
    padding: 20,
    minWidth: 160,
    maxWidth: 200,
    marginRight: 14,
    gap: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 6,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  balance: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: "#fff",
    marginTop: 8,
  },
  name: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: "rgba(255,255,255,0.85)",
  },
});
