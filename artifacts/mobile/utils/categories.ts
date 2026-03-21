export interface Category {
  id: string;
  label: string;
  icon: string;
  color: string;
  type: "income" | "expense" | "both";
}

export const EXPENSE_CATEGORIES: Category[] = [
  { id: "food", label: "Food & Drinks", icon: "fast-food", color: "#EF4444", type: "expense" },
  { id: "transport", label: "Transport", icon: "car", color: "#3B82F6", type: "expense" },
  { id: "school", label: "School", icon: "school", color: "#7C3AED", type: "expense" },
  { id: "shopping", label: "Shopping", icon: "bag", color: "#EC4899", type: "expense" },
  { id: "entertainment", label: "Entertainment", icon: "game-controller", color: "#F59E0B", type: "expense" },
  { id: "health", label: "Health", icon: "medkit", color: "#10B981", type: "expense" },
  { id: "utilities", label: "Utilities", icon: "flash", color: "#06B6D4", type: "expense" },
  { id: "rent", label: "Rent", icon: "home", color: "#8B5CF6", type: "expense" },
  { id: "savings", label: "Savings", icon: "save", color: "#059669", type: "expense" },
  { id: "other", label: "Other", icon: "ellipsis-horizontal-circle", color: "#64748B", type: "expense" },
];

export const INCOME_CATEGORIES: Category[] = [
  { id: "allowance", label: "Allowance", icon: "wallet", color: "#10B981", type: "income" },
  { id: "salary", label: "Salary", icon: "briefcase", color: "#2563EB", type: "income" },
  { id: "freelance", label: "Freelance", icon: "laptop", color: "#7C3AED", type: "income" },
  { id: "gift", label: "Gift", icon: "gift", color: "#EC4899", type: "income" },
  { id: "investment", label: "Investment", icon: "trending-up", color: "#F59E0B", type: "income" },
  { id: "other_income", label: "Other Income", icon: "add-circle", color: "#64748B", type: "income" },
];

export const ALL_CATEGORIES = [...INCOME_CATEGORIES, ...EXPENSE_CATEGORIES];

export function getCategoryById(id: string): Category | undefined {
  return ALL_CATEGORIES.find((c) => c.id === id);
}

export function getCategoryColor(id: string): string {
  return getCategoryById(id)?.color ?? "#64748B";
}

export function getCategoryIcon(id: string): string {
  return getCategoryById(id)?.icon ?? "ellipsis-horizontal-circle";
}

export function getCategoryLabel(id: string): string {
  return getCategoryById(id)?.label ?? id;
}
