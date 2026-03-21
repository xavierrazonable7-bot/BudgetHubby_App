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
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInUp } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { formatCurrency, isThisMonth, isThisWeek } from "@/utils/format";
import { getCategoryLabel } from "@/utils/categories";
import { generateId } from "@/utils/format";
import { ScreenWrapper } from "@/components/ScreenWrapper";

interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
}

function generateAIResponse(input: string, ctx: { totalBalance: number; monthlyIncome: number; monthlyExpenses: number; todayExpenses: number; transactions: any[]; debts: any[]; wallets: any[]; userName: string }): string {
  const q = input.toLowerCase();
  const saved = ctx.monthlyIncome - ctx.monthlyExpenses;
  const savingsRate = ctx.monthlyIncome > 0 ? (saved / ctx.monthlyIncome) * 100 : 0;
  const weekExpenses = ctx.transactions.filter((t) => t.type === "expense" && isThisWeek(t.date)).reduce((s, t) => s + t.amount, 0);
  const topCat = (() => {
    const map: Record<string, number> = {};
    ctx.transactions.filter((t) => t.type === "expense" && isThisMonth(t.date)).forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1])[0];
  })();
  const pendingDebts = ctx.debts.filter((d) => d.status === "pending");

  if (q.match(/^(hi|hello|hey|good|what can|help)/)) return `Hi ${ctx.userName}! I'm your budget assistant. I can help you:\n\n• Analyze your spending\n• Give savings tips\n• Track your debts\n• Answer budget questions\n\nWhat would you like to know?`;
  if (q.includes("balance") || q.includes("how much do i have")) { const walletList = ctx.wallets.map((w) => `  • ${w.name}: ${formatCurrency(w.balance)}`).join("\n"); return `Your total balance is ${formatCurrency(ctx.totalBalance)}.\n\nBreakdown:\n${walletList}`; }
  if (q.includes("spent") || q.includes("expense") || q.includes("spending")) { if (ctx.monthlyExpenses === 0) return `You haven't recorded any expenses this month yet. Start tracking to get spending insights!`; let response = `This month you've spent ${formatCurrency(ctx.monthlyExpenses)}.`; if (topCat) response += `\n\nYour biggest category is ${getCategoryLabel(topCat[0])} at ${formatCurrency(topCat[1])}.`; if (ctx.monthlyIncome > 0) response += `\n\nThat's ${((ctx.monthlyExpenses / ctx.monthlyIncome) * 100).toFixed(0)}% of your income.`; return response; }
  if (q.includes("saving") || q.includes("save")) { if (ctx.monthlyIncome === 0) return `Add your income first so I can help you plan your savings!`; if (saved <= 0) return `You're currently overspending by ${formatCurrency(Math.abs(saved))} this month.\n\nTips to save:\n• Review your ${topCat ? getCategoryLabel(topCat[0]) : "top"} expenses\n• Set daily spending limits\n• Track every expense`; return `You've saved ${formatCurrency(saved)} this month (${savingsRate.toFixed(0)}% of income).\n\n${savingsRate >= 20 ? "Excellent work! You're hitting the 20% savings benchmark." : "Try to aim for 20% savings. You're almost there!"}`; }
  if (q.includes("budget") || q.includes("advice") || q.includes("tip")) return `Budget Tips for ${ctx.userName}:\n\n1. 50/30/20 Rule — 50% needs, 30% wants, 20% savings\n2. Track every purchase, even small ones\n3. Review weekly to catch overspending early\n4. Pay yourself first — set aside savings before spending\n5. Emergency fund should be 3-6 months of expenses`;
  if (q.includes("debt") || q.includes("owe") || q.includes("utang")) { if (pendingDebts.length === 0) return `You have no pending debts right now. Great job staying debt-free!`; const lent = pendingDebts.filter((d) => d.type === "lent").reduce((s, d) => s + (d.amount - d.paidAmount), 0); const borrowed = pendingDebts.filter((d) => d.type === "borrowed").reduce((s, d) => s + (d.amount - d.paidAmount), 0); return `You have ${pendingDebts.length} pending debts:\n\n• Others owe you: ${formatCurrency(lent)}\n• You owe others: ${formatCurrency(borrowed)}\n\nNet position: ${formatCurrency(lent - borrowed)}`; }
  if (q.includes("income") || q.includes("earn") || q.includes("salary") || q.includes("allowance")) { if (ctx.monthlyIncome === 0) return `No income recorded this month yet. Add your salary or allowance to track your budget accurately!`; return `Your income this month is ${formatCurrency(ctx.monthlyIncome)}.\n\nAfter ${formatCurrency(ctx.monthlyExpenses)} in expenses, you have ${formatCurrency(saved)} remaining.`; }
  if (q.includes("week") || q.includes("this week")) return `This week you've spent ${formatCurrency(weekExpenses)}.\n\n${weekExpenses > (ctx.monthlyExpenses / 4) * 1.2 ? "You're spending above your weekly average. Try to cut back." : "You're on track with your weekly spending!"}`;
  if (q.includes("today")) return `Today's spending: ${formatCurrency(ctx.todayExpenses)}.\n\n${ctx.todayExpenses > 500 ? "That's quite a bit for one day. Review your expenses?" : "Looks reasonable for the day!"}`;
  if (q.includes("wallet") || q.includes("gcash") || q.includes("cash") || q.includes("maya")) { return `Your wallet balances:\n\n${ctx.wallets.map((w) => `${w.name}: ${formatCurrency(w.balance)}`).join("\n")}`; }
  if (q.includes("warning") || q.includes("overspend")) { if (saved < 0) return `Warning: You've overspent by ${formatCurrency(Math.abs(saved))} this month.\n\nSuggestions:\n• Reduce dining out\n• Cut entertainment\n• Review subscriptions\n• Look for cheaper alternatives`; return `You're within budget this month! Keep it up.`; }
  return `I can help you with:\n\n• "What's my balance?"\n• "How much did I spend?"\n• "How much have I saved?"\n• "Budget tips"\n• "What about my debts?"\n• "This week spending"\n\nJust ask in plain language!`;
}

const QUICK_PROMPTS = ["What's my balance?", "How much have I saved?", "Budget tips", "My spending this month"];

export default function AssistantScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const { totalBalance, monthlyIncome, monthlyExpenses, todayExpenses, transactions, debts, wallets, userName } = useApp();
  const [messages, setMessages] = useState<Message[]>([
    { id: "welcome", role: "assistant", text: `Hi ${userName || "there"}! I'm your offline budget assistant. Ask me anything about your finances!`, timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const sendMessage = useCallback(
    (text: string = input.trim()) => {
      if (!text) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const userMsg: Message = { id: generateId(), role: "user", text, timestamp: new Date() };
      setMessages((prev) => [userMsg, ...prev]);
      setInput("");
      setIsTyping(true);
      setTimeout(() => {
        const reply = generateAIResponse(text, { totalBalance, monthlyIncome, monthlyExpenses, todayExpenses, transactions, debts, wallets, userName });
        setMessages((prev) => [{ id: generateId(), role: "assistant", text: reply, timestamp: new Date() }, ...prev]);
        setIsTyping(false);
      }, 600 + Math.random() * 400);
    },
    [input, totalBalance, monthlyIncome, monthlyExpenses, todayExpenses, transactions, debts, wallets, userName]
  );

  const bgColors: [string, string, string] = isDark ? ["#0E0E0E", "#140810", "#0E0E0E"] : ["#F0F0F5", "#EDE8F5", "#F0F0F5"];

  return (
    <LinearGradient colors={bgColors} style={styles.fill}>
      <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: Platform.OS === "web" ? 67 : insets.top + 12, borderBottomColor: isDark ? "rgba(255,255,255,0.06)" : theme.border }]}>
          <LinearGradient
            colors={["#6366F130", "#6366F118"]}
            style={[styles.aiAvatar, { borderWidth: 1, borderColor: "#6366F140", shadowColor: "#6366F1", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 10 }]}
          >
            <Ionicons name="sparkles" size={20} color="#6366F1" />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>AI Assistant</Text>
            <View style={styles.onlineBadge}>
              <View style={[styles.onlineDot, { backgroundColor: theme.income }]} />
              <Text style={[styles.headerSub, { color: theme.income }]}>Offline · Always available</Text>
            </View>
          </View>
        </View>

        {/* Quick Prompts */}
        <View style={styles.quickRow}>
          {QUICK_PROMPTS.map((p) => (
            <Pressable
              key={p}
              onPress={() => sendMessage(p)}
              style={({ pressed }) => [
                styles.quickChip,
                {
                  backgroundColor: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)",
                  borderColor: "#6366F130",
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Text style={[styles.quickText, { color: "#6366F1" }]} numberOfLines={1}>{p}</Text>
            </Pressable>
          ))}
        </View>

        {/* Messages */}
        <FlatList
          data={messages}
          keyExtractor={(m) => m.id}
          inverted
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8 }}
          ListHeaderComponent={
            isTyping ? (
              <View style={[styles.typingBubble, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.05)" : theme.border }]}>
                <ActivityIndicator size="small" color="#6366F1" />
                <Text style={[styles.typingText, { color: theme.textSecondary }]}>Thinking...</Text>
              </View>
            ) : null
          }
          renderItem={({ item: msg, index }) => <MessageBubble message={msg} index={index} isDark={isDark} />}
        />

        {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: isDark ? "#111111" : theme.surface, borderTopColor: isDark ? "rgba(255,255,255,0.06)" : theme.border, paddingBottom: insets.bottom + 8 }]}>
          <View style={[styles.inputWrap, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.08)" : theme.border }]}>
            <TextInput
              style={[styles.inputField, { color: theme.text, fontFamily: "Inter_400Regular" }]}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your budget..."
              placeholderTextColor={theme.textTertiary}
              multiline
              maxLength={200}
              returnKeyType="send"
              onSubmitEditing={() => sendMessage()}
            />
          </View>
          <Pressable
            onPress={() => sendMessage()}
            disabled={!input.trim()}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: input.trim() ? "#6366F1" : theme.surfaceSecondary,
                shadowColor: input.trim() ? "#6366F1" : "transparent",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 8,
                elevation: input.trim() ? 6 : 0,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons name="send" size={16} color={input.trim() ? "#fff" : theme.textTertiary} />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

function MessageBubble({ message, index, isDark }: { message: Message; index: number; isDark: boolean }) {
  const { theme } = useTheme();
  const isUser = message.role === "user";

  return (
    <Animated.View
      entering={FadeInUp.delay(Math.min(index * 20, 200)).duration(300)}
      style={[styles.msgRow, isUser ? styles.userRow : styles.assistantRow]}
    >
      {!isUser && (
        <LinearGradient
          colors={["#6366F130", "#6366F118"]}
          style={[styles.miniAvatar, { borderWidth: 1, borderColor: "#6366F140" }]}
        >
          <Ionicons name="sparkles" size={11} color="#6366F1" />
        </LinearGradient>
      )}
      {isUser ? (
        <LinearGradient
          colors={["#E05A6D", "#C0394D"]}
          style={[styles.bubble, styles.userBubble, { shadowColor: "#E05A6D", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.4, shadowRadius: 8 }]}
        >
          <Text style={[styles.bubbleText, { color: "#fff" }]}>{message.text}</Text>
        </LinearGradient>
      ) : (
        <View style={[styles.bubble, styles.assistantBubble, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.06)" : theme.border, borderWidth: 1 }]}>
          <Text style={[styles.bubbleText, { color: theme.text }]}>{message.text}</Text>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: 1,
  },
  aiAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, gap: 3 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  onlineBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  onlineDot: { width: 6, height: 6, borderRadius: 3 },
  headerSub: { fontSize: 12, fontFamily: "Inter_500Medium" },
  quickRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    paddingVertical: 12,
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
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    alignSelf: "flex-start",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
    borderWidth: 1,
  },
  typingText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  msgRow: { flexDirection: "row", marginBottom: 12, gap: 8 },
  userRow: { alignSelf: "flex-end", justifyContent: "flex-end", maxWidth: "82%" },
  assistantRow: { alignSelf: "flex-start", maxWidth: "85%" },
  miniAvatar: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 4,
  },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11 },
  userBubble: { borderBottomRightRadius: 5 },
  assistantBubble: { borderBottomLeftRadius: 5 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 21 },
  inputBar: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    alignItems: "flex-end",
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  inputField: {
    fontSize: 14,
    maxHeight: 100,
    padding: 0,
    margin: 0,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: "center",
    justifyContent: "center",
  },
});
