import React from "react";
import { View, Text, Pressable, StyleSheet, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
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
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.scroll}>
        {categories.map((cat) => {
          const isSelected = selected === cat.id;
          return (
            <CategoryItem
              key={cat.id}
              category={cat}
              isSelected={isSelected}
              onSelect={onSelect}
            />
          );
        })}
      </ScrollView>
    </View>
  );
}

function CategoryItem({
  category,
  isSelected,
  onSelect,
}: {
  category: Category;
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  const { theme } = useTheme();
  return (
    <Pressable
      onPress={() => onSelect(category.id)}
      style={({ pressed }) => [
        styles.item,
        {
          backgroundColor: isSelected ? category.color + "20" : theme.surfaceSecondary,
          borderColor: isSelected ? category.color : theme.border,
          borderWidth: isSelected ? 1.5 : 1,
          opacity: pressed ? 0.8 : 1,
        },
      ]}
    >
      <View
        style={[
          styles.iconCircle,
          { backgroundColor: isSelected ? category.color : category.color + "30" },
        ]}
      >
        <Ionicons
          name={category.icon as any}
          size={16}
          color={isSelected ? "#fff" : category.color}
        />
      </View>
      <Text
        style={[
          styles.itemLabel,
          {
            color: isSelected ? category.color : theme.textSecondary,
            fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular",
          },
        ]}
        numberOfLines={1}
      >
        {category.label}
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
    padding: 10,
    marginRight: 10,
    minWidth: 75,
    maxWidth: 85,
    gap: 6,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  itemLabel: {
    fontSize: 11,
    textAlign: "center",
  },
});
