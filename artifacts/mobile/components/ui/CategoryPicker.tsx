import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useTheme } from "@/context/ThemeContext";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES, Category } from "@/utils/categories";

interface CategoryPickerProps {
  type: "income" | "expense";
  selected: string;
  onSelect: (categoryId: string) => void;
}

export function CategoryPicker({ type, selected, onSelect }: CategoryPickerProps) {
  const { theme } = useTheme();
  const categories = type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <View style={styles.container}>
      <Text style={[styles.label, { color: theme.textSecondary }]}>Category</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 10, paddingRight: 4 }}>
        {categories.map((cat) => (
          <CategoryItem key={cat.id} category={cat} isSelected={selected === cat.id} onSelect={onSelect} />
        ))}
      </ScrollView>
    </View>
  );
}

function CategoryItem({ category, isSelected, onSelect }: { category: Category; isSelected: boolean; onSelect: (id: string) => void }) {
  const { theme, isDark } = useTheme();

  return (
    <Pressable
      onPress={() => onSelect(category.id)}
      style={({ pressed }) => [{ opacity: pressed ? 0.8 : 1 }]}
    >
      {isSelected ? (
        <LinearGradient
          colors={[category.color + "30", category.color + "18"]}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
          style={[
            styles.item,
            {
              borderColor: category.color + "60",
              borderWidth: 1.5,
              shadowColor: category.color,
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: isDark ? 0.4 : 0.2,
              shadowRadius: 8,
              elevation: 4,
            },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: category.color, shadowColor: category.color, shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 6 }]}>
            <Ionicons name={category.icon as any} size={16} color="#fff" />
          </View>
          <Text style={[styles.itemLabel, { color: category.color, fontFamily: "Inter_700Bold" }]} numberOfLines={1}>
            {category.label}
          </Text>
        </LinearGradient>
      ) : (
        <View
          style={[
            styles.item,
            {
              backgroundColor: theme.surface,
              borderColor: isDark ? "rgba(255,255,255,0.07)" : theme.border,
              borderWidth: 1,
            },
          ]}
        >
          <View style={[styles.iconCircle, { backgroundColor: category.color + "20" }]}>
            <Ionicons name={category.icon as any} size={16} color={category.color} />
          </View>
          <Text style={[styles.itemLabel, { color: theme.textSecondary, fontFamily: "Inter_400Regular" }]} numberOfLines={1}>
            {category.label}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  label: { fontSize: 13, fontFamily: "Inter_600SemiBold", letterSpacing: 0.1 },
  item: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 10,
    minWidth: 76,
    gap: 7,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: {
    fontSize: 11,
    textAlign: "center",
  },
});
