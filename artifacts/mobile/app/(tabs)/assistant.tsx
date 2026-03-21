import React, { useState, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { formatCurrency, isThisMonth, isThisWeek } from "@/utils/format";
import { getCategoryLabel } from "@/utils/categories";
import { generateId } from "@/utils/format";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

function generateAIResponse(
  input: string,
  ctx: {
    totalBalance: number;
    monthlyIncome: number;
    monthlyExpenses: number;
    todayExpenses: number;
    transactions: any[];
    debts: any[];
    wallets: any[];
    userName: string;
  }
): string {
  const q = input.toLowerCase();
  const saved = ctx.monthlyIncome - ctx.monthlyExpenses;
  const savingsRate = ctx.monthlyIncome > 0 ? (saved / ctx.monthlyIncome) * 100 : 0;

  const weekExpenses = ctx.transactions
    .filter((t) => t.type === "expense" && isThisWeek(t.date))
    .reduce((s, t) => s + t.amount, 0);

  const topCat = (() => {
    const map: Record<string, number> = {};
    ctx.transactions
      .filter((t) => t.type === "expense" && isThisMonth(t.date))
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    const sorted = Object.entries(map).sort((a, b) => b[1] - a[1]);
    return sorted[0];
  })();

  const pendingDebts = ctx.debts.filter((d) => d.status === "pending");

  // Greeting / intro
  if (q.match(/^(hi|hello|hey|good|what can|help)/)) {
    return `Hi ${ctx.userName}! I'm your budget assistant. I can help you:\n\n• Analyze your spending\n• Give savings tips\n• Track your debts\n• Answer budget questions\n\nWhat would you like to know?`;
  }

  // Balance
  if (q.includes("balance") || q.includes("how much do i have")) {
    const walletList = ctx.wallets.map((w) => `  • ${w.name}: ${formatCurrency(w.balance)}`).join("\n");
    return `Your total balance is ${formatCurrency(ctx.totalBalance)}.\n\nBreakdown:\n${walletList}`;
  }

  // Spending this month
  if (q.includes("spent") || q.includes("expense") || q.includes("spending")) {
    if (ctx.monthlyExpenses === 0) {
      return `You haven't recorded any expenses this month yet. Start tracking to get spending insights!`;
    }
    let response = `This month you've spent ${formatCurrency(ctx.monthlyExpenses)}.`;
    if (topCat) {
      response += `\n\nYour biggest category is ${getCategoryLabel(topCat[0])} at ${formatCurrency(topCat[1])}.`;
    }
    if (ctx.monthlyIncome > 0) {
      const pct = (ctx.monthlyExpenses / ctx.monthlyIncome) * 100;
      response += `\n\nThat's ${pct.toFixed(0)}% of your income.`;
    }
    return response;
  }

  // Savings
  if (q.includes("saving") || q.includes("save")) {
    if (ctx.monthlyIncome === 0) {
      return `Add your income first so I can help you plan your savings!`;
    }
    if (saved <= 0) {
      return `You're currently overspending by ${formatCurrency(Math.abs(saved))} this month.\n\nTips to save:\n• Review your ${topCat ? getCategoryLabel(topCat[0]) : "top"} expenses\n• Set daily spending limits\n• Track every expense`;
    }
    return `You've saved ${formatCurrency(saved)} this month (${savingsRate.toFixed(0)}% of income).\n\n${savingsRate >= 20 ? "Excellent work! You're hitting the 20% savings benchmark." : "Try to aim for 20% savings. You're almost there!"}`;
  }

  // Budget advice
  if (q.includes("budget") || q.includes("advice") || q.includes("tip")) {
    return `Budget Tips for ${ctx.userName}:\n\n1. 50/30/20 Rule — 50% needs, 30% wants, 20% savings\n2. Track every purchase, even small ones\n3. Review weekly to catch overspending early\n4. Pay yourself first — set aside savings before spending\n5. Emergency fund should be 3-6 months of expenses`;
  }

  // Debt
  if (q.includes("debt") || q.includes("owe") || q.includes("utang")) {
    if (pendingDebts.length === 0) {
      return `You have no pending debts right now. Great job staying debt-free!`;
    }
    const lent = pendingDebts.filter((d) => d.type === "lent").reduce((s, d) => s + (d.amount - d.paidAmount), 0);
    const borrowed = pendingDebts.filter((d) => d.type === "borrowed").reduce((s, d) => s + (d.amount - d.paidAmount), 0);
    return `You have ${pendingDebts.length} pending debts:\n\n• Others owe you: ${formatCurrency(lent)}\n• You owe others: ${formatCurrency(borrowed)}\n\nNet position: ${formatCurrency(lent - borrowed)}`;
  }

  // Income
  if (q.includes("income") || q.includes("earn") || q.includes("salary") || q.includes("allowance")) {
    if (ctx.monthlyIncome === 0) {
      return `No income recorded this month yet. Add your salary or allowance to track your budget accurately!`;
    }
    return `Your income this month is ${formatCurrency(ctx.monthlyIncome)}.\n\nAfter ${formatCurrency(ctx.monthlyExpenses)} in expenses, you have ${formatCurrency(saved)} remaining.`;
  }

  // Weekly check
  if (q.includes("week") || q.includes("this week")) {
    return `This week you've spent ${formatCurrency(weekExpenses)}.\n\n${weekExpenses > (ctx.monthlyExpenses / 4) * 1.2 ? "You're spending above your weekly average. Try to cut back." : "You're on track with your weekly spending!"}`;
  }

  // Today
  if (q.includes("today")) {
    return `Today's spending: ${formatCurrency(ctx.todayExpenses)}.\n\n${ctx.todayExpenses > 500 ? "That's quite a bit for one day. Review your expenses?" : "Looks reasonable for the day!"}`;
  }

  // Wallet-specific
  if (q.includes("wallet") || q.includes("gcash") || q.includes("cash") || q.includes("maya")) {
    const walletInfo = ctx.wallets.map((w) => `${w.name}: ${formatCurrency(w.balance)}`).join("\n");
    return `Your wallet balances:\n\n${walletInfo}`;
  }

  // Overspending warning
  if (q.includes("warning") || q.includes("overspend")) {
    if (saved < 0) {
      return `Warning: You've overspent by ${formatCurrency(Math.abs(saved))} this month.\n\nSuggestions:\n• Reduce dining out\n• Cut entertainment\n• Review subscriptions\n• Look for cheaper alternatives`;
    }
    return `You're within budget this month! Keep it up.`;
  }

  // Default
  return `I can help you with:\n\n• "What's my balance?"\n• "How much did I spend?"\n• "How much have I saved?"\n• "Budget tips"\n• "What about my debts?"\n• "This week spending"\n\nJust ask in plain language!`;
}

const QUICK_PROMPTS = [
  "What's my balance?",
  "How much have I saved?",
  "Budget tips",
  "My spending this month",
];

export default function AssistantScreen() {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { totalBalance, monthlyIncome, monthlyExpenses, todayExpenses, transactions, debts, wallets, userName } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `Hi ${userName || "there"}! I'm your offline budget assistant. Ask me anything about your finances!`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList>(null);

  const sendMessage = useCallback(
    (text: string = input.trim()) => {
      if (!text) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      const userMsg: Message = {
        id: generateId(),
        role: "user",
        text,
        timestamp: new Date(),
      };
      setMessages((prev) => [userMsg, ...prev]);
      setInput("");
      setIsTyping(true);

      setTimeout(() => {
        const reply = generateAIResponse(text, {
          totalBalance,
          monthlyIncome,
          monthlyExpenses,
          todayExpenses,
          transactions,
          debts,
          wallets,
          userName,
        });
        const assistantMsg: Message = {
          id: generateId(),
          role: "assistant",
          text: reply,
          timestamp: new Date(),
        };
        setMessages((prev) => [assistantMsg, ...prev]);
        setIsTyping(false);
      }, 600 + Math.random() * 400);
    },
    [input, totalBalance, monthlyIncome, monthlyExpenses, todayExpenses, transactions, debts, wallets, userName]
  );

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.background }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
            backgroundColor: theme.background,
            borderBottomColor: theme.border,
          },
        ]}
      >
        <View style={[styles.aiAvatar, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="sparkles" size={20} color={theme.primary} />
        </View>
        <View>
          <Text style={[styles.headerTitle, { color: theme.text }]}>AI Assistant</Text>
          <Text style={[styles.headerSub, { color: theme.accent }]}>Offline • Always available</Text>
        </View>
      </View>

      {/* Quick Prompts */}
      <View style={styles.quickRow}>
        {QUICK_PROMPTS.map((p) => (
          <Pressable
            key={p}
            onPress={() => sendMessage(p)}
            style={[styles.quickChip, { backgroundColor: theme.primaryLight, borderColor: theme.primary + "30" }]}
          >
            <Text style={[styles.quickText, { color: theme.primary }]} numberOfLines={1}>
              {p}
            </Text>
          </Pressable>
        ))}
      </View>

      {/* Messages */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        inverted
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: 8,
        }}
        ListHeaderComponent={
          isTyping ? (
            <View style={[styles.bubble, styles.assistantBubble, { backgroundColor: theme.surfaceSecondary }]}>
              <ActivityIndicator size="small" color={theme.primary} />
            </View>
          ) : null
        }
        renderItem={({ item: msg, index }) => (
          <MessageBubble message={msg} index={index} />
        )}
      />

      {/* Input */}
      <View
        style={[
          styles.inputBar,
          {
            backgroundColor: theme.surface,
            borderTopColor: theme.border,
            paddingBottom: insets.bottom + 8,
          },
        ]}
      >
        <TextInput
          style={[
            styles.inputField,
            {
              backgroundColor: theme.surfaceSecondary,
              color: theme.text,
              fontFamily: "Inter_400Regular",
              borderColor: theme.border,
            },
          ]}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about your budget..."
          placeholderTextColor={theme.textTertiary}
          multiline
          maxLength={200}
          returnKeyType="send"
          onSubmitEditing={() => sendMessage()}
        />
        <Pressable
          onPress={() => sendMessage()}
          disabled={!input.trim()}
          style={({ pressed }) => [
            styles.sendBtn,
            {
              backgroundColor: input.trim() ? theme.primary : theme.surfaceSecondary,
              opacity: pressed ? 0.8 : 1,
            },
          ]}
        >
          <Ionicons name="send" size={18} color={input.trim() ? "#fff" : theme.textTertiary} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

function MessageBubble({ message, index }: { message: Message; index: number }) {
  const { theme } = useTheme();
  const isUser = message.role === "user";

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index * 20, 200)).duration(300)}
      style={[styles.msgRow, isUser ? styles.userRow : styles.assistantRow]}
    >
      {!isUser && (
        <View style={[styles.miniAvatar, { backgroundColor: theme.primaryLight }]}>
          <Ionicons name="sparkles" size={12} color={theme.primary} />
        </View>
      )}
      <View
        style={[
          styles.bubble,
          isUser
            ? [styles.userBubble, { backgroundColor: theme.primary }]
            : [styles.assistantBubble, { backgroundColor: theme.surfaceSecondary }],
        ]}
      >
        <Text
          style={[
            styles.bubbleText,
            { color: isUser ? "#fff" : theme.text },
          ]}
        >
          {message.text}
        </Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 12,
    gap: 12,
    borderBottomWidth: 1,
  },
  aiAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_500Medium" },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
  },
  quickChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 16,
    borderWidth: 1,
    maxWidth: 180,
  },
  quickText: { fontSize: 12, fontFamily: "Inter_500Medium" },
  msgRow: {
    flexDirection: "row",
    marginBottom: 12,
    gap: 8,
    maxWidth: "90%",
  },
  userRow: { alignSelf: "flex-end", justifyContent: "flex-end" },
  assistantRow: { alignSelf: "flex-start" },
  miniAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  bubble: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: "90%",
  },
  userBubble: { borderBottomRightRadius: 4 },
  assistantBubble: { borderBottomLeftRadius: 4 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },
  inputBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    alignItems: "flex-end",
    gap: 10,
  },
  inputField: {
    flex: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    borderWidth: 1,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
