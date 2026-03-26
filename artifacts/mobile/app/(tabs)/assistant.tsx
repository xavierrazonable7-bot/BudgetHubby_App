import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Clipboard,
} from "react-native";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Animated, {
  FadeInUp,
  FadeIn,
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  withDelay,
} from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useTheme } from "@/context/ThemeContext";
import { useApp } from "@/context/AppContext";
import { isThisMonth, isThisWeek } from "@/utils/format";
import { getCategoryLabel } from "@/utils/categories";
import { generateId } from "@/utils/format";

/* ─────────────────────────────────────────────────────────────────────────────
   Types
──────────────────────────────────────────────────────────────────────────────*/
interface Message {
  id: string;
  role: "user" | "assistant";
  text: string;
  timestamp: Date;
  suggestions?: string[];
}

/* ─────────────────────────────────────────────────────────────────────────────
   AI Engine
──────────────────────────────────────────────────────────────────────────────*/
interface AIContext {
  totalBalance: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  todayExpenses: number;
  transactions: any[];
  debts: any[];
  wallets: any[];
  tasks: any[];
  events: any[];
  studySessions: any[];
  userName: string;
}

function aiReply(input: string, ctx: AIContext, formatAmount: (n: number) => string): { text: string; suggestions: string[] } {
  const q = input.toLowerCase().trim();
  const saved = ctx.monthlyIncome - ctx.monthlyExpenses;
  const savingsRate = ctx.monthlyIncome > 0 ? (saved / ctx.monthlyIncome) * 100 : 0;

  const weekExpenses = ctx.transactions
    .filter((t) => t.type === "expense" && isThisWeek(t.date))
    .reduce((s, t) => s + t.amount, 0);

  const topCats = (() => {
    const map: Record<string, number> = {};
    ctx.transactions
      .filter((t) => t.type === "expense" && isThisMonth(t.date))
      .forEach((t) => { map[t.category] = (map[t.category] || 0) + t.amount; });
    return Object.entries(map).sort((a, b) => b[1] - a[1]).slice(0, 3);
  })();

  const pendingDebts = ctx.debts.filter((d) => d.status === "pending");
  const lentTotal = pendingDebts.filter((d) => d.type === "lent").reduce((s, d) => s + (d.amount - (d.paidAmount || 0)), 0);
  const borrowedTotal = pendingDebts.filter((d) => d.type === "borrowed").reduce((s, d) => s + (d.amount - (d.paidAmount || 0)), 0);
  const pendingTasks = ctx.tasks.filter((t) => !t.completed);
  const doneTasks = ctx.tasks.filter((t) => t.completed);
  const totalSessions = ctx.studySessions.length;
  const totalStudyMins = ctx.studySessions.reduce((s: number, ss: any) => s + (ss.duration || 0), 0);

  // ── Greetings ──
  if (q.match(/^(hi|hello|hey|kamusta|good\s*(morning|afternoon|evening)|what can|help me|what do you do)/)) {
    return {
      text: `Hi ${ctx.userName || "there"}! 👋 I'm your personal Timpla assistant.\n\nHere's what I can help you with:\n\n💰 **Finance** — balances, spending, income, debts\n📊 **Budgeting** — tips, 50/30/20 rule, savings rate\n✅ **Tasks** — pending tasks & progress\n⏱ **Study** — session stats & productivity\n\nJust type your question naturally!`,
      suggestions: ["What's my balance?", "How much did I spend?", "Budget tips", "My task progress"],
    };
  }

  // ── Balance ──
  if (q.match(/balance|how much (do i have|money)|total (money|funds)/)) {
    if (ctx.wallets.length === 0) {
      return { text: `You haven't added any wallets yet. Go to Wallets in the More tab to set them up!`, suggestions: ["Budget tips", "Tell me about debts"] };
    }
    const walletList = ctx.wallets.map((w) => `  • ${w.name}: ${formatAmount(w.balance)}`).join("\n");
    return {
      text: `Your total balance is **${formatAmount(ctx.totalBalance)}**.\n\nWallet breakdown:\n${walletList}`,
      suggestions: ["How much did I spend?", "Any warnings?", "How much saved this month?"],
    };
  }

  // ── Monthly spending ──
  if (q.match(/spent|expense|spending|how much (did|have) i (spent|spend|used)/)) {
    if (ctx.monthlyExpenses === 0) {
      return { text: `You haven't recorded any expenses this month yet. Start tracking to unlock spending insights!`, suggestions: ["Budget tips", "What's my balance?"] };
    }
    let text = `This month you've spent **${formatAmount(ctx.monthlyExpenses)}**.`;
    if (topCats.length > 0) {
      text += `\n\nTop categories:\n` + topCats.map((c, i) => `  ${i + 1}. ${getCategoryLabel(c[0])} — ${formatAmount(c[1])}`).join("\n");
    }
    if (ctx.monthlyIncome > 0) {
      text += `\n\nThat's **${((ctx.monthlyExpenses / ctx.monthlyIncome) * 100).toFixed(0)}%** of your monthly income.`;
    }
    return {
      text,
      suggestions: ["How much saved?", "Any warnings?", "This week's spending"],
    };
  }

  // ── Savings ──
  if (q.match(/saving|save|how much (did i|have i) save|savings rate/)) {
    if (ctx.monthlyIncome === 0) {
      return { text: `Add your income first so I can help you plan your savings!`, suggestions: ["Budget tips", "What's my balance?"] };
    }
    if (saved <= 0) {
      const topCatName = topCats[0] ? getCategoryLabel(topCats[0][0]) : "expenses";
      return {
        text: `⚠️ You're currently **overspending** by **${formatAmount(Math.abs(saved))}** this month.\n\nYour top expense category is ${topCatName}. Consider:\n• Setting a daily spending limit\n• Reviewing recurring costs\n• Tracking every purchase\n• Meal prepping to cut food costs`,
        suggestions: ["Budget tips", "How much did I spend?", "What's my balance?"],
      };
    }
    const emoji = savingsRate >= 30 ? "🌟" : savingsRate >= 20 ? "✅" : "📈";
    return {
      text: `${emoji} You've saved **${formatAmount(saved)}** this month (${savingsRate.toFixed(1)}% savings rate).\n\n${savingsRate >= 20 ? "Excellent! You're hitting the 20% savings benchmark. Keep it up!" : `You're at ${savingsRate.toFixed(0)}%. Try to reach 20% — you need ₱${((ctx.monthlyIncome * 0.2) - saved).toFixed(2)} more in cuts.`}`,
      suggestions: ["Budget tips", "How much did I spend?", "Any warnings?"],
    };
  }

  // ── Budget tips ──
  if (q.match(/budget|tip|advice|how to save|help me save|50.30.20/)) {
    return {
      text: `💡 **Budget Tips for ${ctx.userName || "You"}:**\n\n1. **50/30/20 Rule**\n   Needs 50% · Wants 30% · Savings 20%\n\n2. **Track every purchase**\n   Even small buys add up fast\n\n3. **Weekly review**\n   Check your spending every Sunday\n\n4. **Pay yourself first**\n   Move savings out before spending\n\n5. **Emergency fund**\n   Build 3–6 months of expenses\n\n6. **Student hacks**\n   Use student discounts, cook more, share subscriptions`,
      suggestions: ["What's my savings rate?", "Overspending warnings", "How much saved?"],
    };
  }

  // ── Debts ──
  if (q.match(/debt|owe|utang|borrow|lend|lent|money owed/)) {
    if (pendingDebts.length === 0) {
      return { text: `🎉 You have no pending debts right now. Great job staying debt-free!`, suggestions: ["What's my balance?", "Budget tips"] };
    }
    let text = `You have **${pendingDebts.length}** pending debt(s):\n\n`;
    text += `💚 Others owe you: **${formatAmount(lentTotal)}**\n`;
    text += `🔴 You owe others: **${formatAmount(borrowedTotal)}**\n\n`;
    text += `Net position: **${formatAmount(lentTotal - borrowedTotal)}**\n\n`;
    if (borrowedTotal > 0) text += `Tip: Pay your debts as soon as possible to avoid awkwardness!`;
    return {
      text,
      suggestions: ["What's my balance?", "How much saved?", "Budget tips"],
    };
  }

  // ── Income ──
  if (q.match(/income|earn|salary|allowance|how much (do|did) i (earn|get|receive)/)) {
    if (ctx.monthlyIncome === 0) {
      return { text: `No income recorded this month. Add your salary or allowance in Transactions to track your budget accurately!`, suggestions: ["Budget tips", "What's my balance?"] };
    }
    return {
      text: `Your income this month is **${formatAmount(ctx.monthlyIncome)}**.\n\nAfter **${formatAmount(ctx.monthlyExpenses)}** in expenses, you have **${formatAmount(saved)}** remaining.\n\nSavings rate: ${savingsRate.toFixed(1)}%`,
      suggestions: ["How much saved?", "Budget tips", "This week's spending"],
    };
  }

  // ── Weekly spending ──
  if (q.match(/this week|week|weekly/)) {
    const weekAvg = ctx.monthlyExpenses / 4;
    const status = weekExpenses > weekAvg * 1.2 ? "⚠️ above" : weekExpenses < weekAvg * 0.8 ? "✅ below" : "✅ on track with";
    return {
      text: `This week you've spent **${formatAmount(weekExpenses)}**.\n\nYou're ${status} your weekly average of ${formatAmount(weekAvg)}.\n\n${weekExpenses > weekAvg * 1.2 ? "Try to cut back for the rest of the week!" : "You're doing great this week!"}`,
      suggestions: ["How much this month?", "Any warnings?", "Budget tips"],
    };
  }

  // ── Today ──
  if (q.match(/today|today.s spending/)) {
    return {
      text: `Today's spending: **${formatAmount(ctx.todayExpenses)}**.\n\n${ctx.todayExpenses > 500 ? "That's quite a bit for one day. Review your recent expenses?" : ctx.todayExpenses === 0 ? "No spending recorded today yet!" : "Looks reasonable for the day. Keep it up!"}`,
      suggestions: ["This week's spending", "How much this month?", "What's my balance?"],
    };
  }

  // ── Wallets ──
  if (q.match(/wallet|gcash|cash|maya|bank|account/)) {
    if (ctx.wallets.length === 0) {
      return { text: `You haven't added any wallets yet. Tap Wallets in the More tab to add GCash, Cash, Maya, or bank accounts!`, suggestions: ["Budget tips", "Tell me about debts"] };
    }
    return {
      text: `Your wallet balances:\n\n${ctx.wallets.map((w) => `💳 **${w.name}**: ${formatAmount(w.balance)}`).join("\n")}\n\nTotal: **${formatAmount(ctx.totalBalance)}**`,
      suggestions: ["How much did I spend?", "How much saved?", "Any warnings?"],
    };
  }

  // ── Warnings / overspending ──
  if (q.match(/warning|oversp|over budget|alert|problem/)) {
    const warnings: string[] = [];
    if (saved < 0) warnings.push(`• Overspending by ${formatAmount(Math.abs(saved))} this month`);
    if (borrowedTotal > 0) warnings.push(`• You owe ${formatAmount(borrowedTotal)} in pending debts`);
    if (weekExpenses > ctx.monthlyExpenses / 4 * 1.3) warnings.push(`• Above-average spending this week`);
    if (ctx.monthlyIncome > 0 && ctx.monthlyExpenses / ctx.monthlyIncome > 0.8) warnings.push(`• Spending >80% of monthly income`);
    if (warnings.length === 0) {
      return { text: `✅ No warnings! Your finances look healthy this month. Keep it up!`, suggestions: ["How much saved?", "Budget tips", "What's my balance?"] };
    }
    return {
      text: `⚠️ **Financial Alerts:**\n\n${warnings.join("\n")}\n\nTake action to stay on track!`,
      suggestions: ["Budget tips", "How much did I spend?", "How much saved?"],
    };
  }

  // ── Tasks ──
  if (q.match(/task|to.?do|todo|pending task|homework/)) {
    const total = ctx.tasks.length;
    if (total === 0) {
      return { text: `You have no tasks yet. Go to the Planner tab to add tasks!`, suggestions: ["Study sessions", "Budget tips"] };
    }
    const pct = total > 0 ? ((doneTasks.length / total) * 100).toFixed(0) : "0";
    return {
      text: `📋 **Task Progress:**\n\n✅ Done: ${doneTasks.length}\n⏳ Pending: ${pendingTasks.length}\n📊 Completion: ${pct}%\n\n${pendingTasks.length > 0 ? `Next up: "${pendingTasks[0].title}"` : "All tasks done! 🎉"}`,
      suggestions: ["Study sessions", "Budget tips", "What's my balance?"],
    };
  }

  // ── Study ──
  if (q.match(/study|pomodoro|session|focus|learn|school/)) {
    const hours = Math.floor(totalStudyMins / 60);
    const mins = totalStudyMins % 60;
    const timeStr = hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    return {
      text: `⏱ **Study Stats:**\n\n📚 Total sessions: ${totalSessions}\n🕐 Total study time: ${timeStr}\n\n${totalSessions === 0 ? "Start a Pomodoro session in the Study tab!" : totalSessions < 5 ? "Great start! Consistency is key." : "Amazing dedication! Keep up the focus."}`,
      suggestions: ["Task progress", "Budget tips", "What's my balance?"],
    };
  }

  // ── Overview / summary ──
  if (q.match(/summary|overview|report|everything|how am i doing/)) {
    return {
      text: `📊 **Your Timpla Overview:**\n\n💰 Balance: ${formatAmount(ctx.totalBalance)}\n📈 Income: ${formatAmount(ctx.monthlyIncome)}\n📉 Expenses: ${formatAmount(ctx.monthlyExpenses)}\n💚 Saved: ${formatAmount(saved)}\n\n✅ Tasks done: ${doneTasks.length}/${ctx.tasks.length}\n⏱ Study sessions: ${totalSessions}\n🔴 Debts pending: ${pendingDebts.length}`,
      suggestions: ["Budget tips", "Any warnings?", "How much saved?"],
    };
  }

  // ── Default ──
  return {
    text: `I can help you with:\n\n💰 "What's my balance?"\n💸 "How much did I spend?"\n💡 "Budget tips"\n📊 "My savings rate"\n🔴 "Tell me about my debts"\n✅ "Task progress"\n⏱ "Study sessions"\n⚠️ "Any warnings?"\n\nJust ask naturally!`,
    suggestions: ["What's my balance?", "Budget tips", "Any warnings?", "Give me a summary"],
  };
}

/* ─────────────────────────────────────────────────────────────────────────────
   Quick Prompt Categories
──────────────────────────────────────────────────────────────────────────────*/
const PROMPT_CATEGORIES = [
  { icon: "wallet-outline",    color: "#2DD4BF", label: "Balance",  prompt: "What's my balance?"         },
  { icon: "cash-outline",      color: "#E05A6D", label: "Spending", prompt: "How much did I spend?"      },
  { icon: "trending-up",       color: "#22C55E", label: "Savings",  prompt: "What's my savings rate?"    },
  { icon: "people-outline",    color: "#F59E0B", label: "Debts",    prompt: "Tell me about my debts"     },
  { icon: "bulb-outline",      color: "#6366F1", label: "Tips",     prompt: "Give me budget tips"        },
  { icon: "checkmark-circle-outline", color: "#A78BFA", label: "Tasks", prompt: "What's my task progress?" },
  { icon: "timer-outline",     color: "#38BDF8", label: "Study",    prompt: "Show my study sessions"     },
  { icon: "alert-circle-outline", color: "#FF6B6B", label: "Warnings", prompt: "Any spending warnings?" },
  { icon: "bar-chart-outline", color: "#FB923C", label: "Summary",  prompt: "Give me a summary"          },
];

/* ─────────────────────────────────────────────────────────────────────────────
   Animated Typing Dots
──────────────────────────────────────────────────────────────────────────────*/
function TypingDots() {
  const { theme } = useTheme();
  const dot1 = useSharedValue(0);
  const dot2 = useSharedValue(0);
  const dot3 = useSharedValue(0);

  useEffect(() => {
    const base = withRepeat(withSequence(withTiming(-6, { duration: 300 }), withTiming(0, { duration: 300 })), -1, false);
    dot1.value = base;
    dot2.value = withDelay(120, withRepeat(withSequence(withTiming(-6, { duration: 300 }), withTiming(0, { duration: 300 })), -1, false));
    dot3.value = withDelay(240, withRepeat(withSequence(withTiming(-6, { duration: 300 }), withTiming(0, { duration: 300 })), -1, false));
  }, []);

  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: dot1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: dot2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ translateY: dot3.value }] }));

  return (
    <View style={[styles.typingBubble, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      <LinearGradient colors={["#6366F130", "#6366F118"]} style={[styles.miniAvatar, { borderWidth: 1, borderColor: "#6366F140" }]}>
        <Ionicons name="sparkles" size={11} color="#6366F1" />
      </LinearGradient>
      <View style={styles.dotsRow}>
        <Animated.View style={[styles.dot, { backgroundColor: "#6366F1" }, s1]} />
        <Animated.View style={[styles.dot, { backgroundColor: "#6366F1" }, s2]} />
        <Animated.View style={[styles.dot, { backgroundColor: "#6366F1" }, s3]} />
      </View>
    </View>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Message Bubble
──────────────────────────────────────────────────────────────────────────────*/
function MessageBubble({
  message,
  index,
  onSuggestionPress,
}: {
  message: Message;
  index: number;
  onSuggestionPress: (s: string) => void;
}) {
  const { theme, isDark } = useTheme();
  const isUser = message.role === "user";

  const timeStr = message.timestamp.toLocaleTimeString("en-PH", { hour: "2-digit", minute: "2-digit" });

  const handleLongPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (Platform.OS === "web") return;
    Alert.alert("Message", undefined, [
      { text: "Copy", onPress: () => { try { (Clipboard as any).setString(message.text); } catch {} } },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  // Render bold **text** segments
  const renderText = (raw: string) => {
    const parts = raw.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <Text key={i} style={{ fontFamily: "Inter_700Bold" }}>{part.slice(2, -2)}</Text>;
      }
      return <Text key={i}>{part}</Text>;
    });
  };

  return (
    <Animated.View entering={FadeInUp.delay(Math.min(index * 15, 120)).duration(280)}>
      <View style={[styles.msgRow, isUser ? styles.userRow : styles.assistantRow]}>
        {!isUser && (
          <LinearGradient colors={["#6366F130", "#6366F118"]} style={[styles.miniAvatar, { borderWidth: 1, borderColor: "#6366F140" }]}>
            <Ionicons name="sparkles" size={11} color="#6366F1" />
          </LinearGradient>
        )}
        <View style={styles.bubbleWrap}>
          <Pressable onLongPress={handleLongPress} delayLongPress={400}>
            {isUser ? (
              <LinearGradient
                colors={["#E05A6D", "#C0394D"]}
                style={[styles.bubble, styles.userBubble, { shadowColor: "#E05A6D", shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.35, shadowRadius: 8, elevation: 5 }]}
              >
                <Text style={[styles.bubbleText, { color: "#fff" }]}>{message.text}</Text>
              </LinearGradient>
            ) : (
              <View style={[styles.bubble, styles.assistantBubble, { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.08)" : theme.border, borderWidth: 1 }]}>
                <Text style={[styles.bubbleText, { color: theme.text }]}>{renderText(message.text)}</Text>
              </View>
            )}
          </Pressable>
          <Text style={[styles.timeStamp, { color: theme.textTertiary, alignSelf: isUser ? "flex-end" : "flex-start" }]}>
            {timeStr}
          </Text>
        </View>
      </View>

      {/* Suggestion chips below assistant messages */}
      {!isUser && message.suggestions && message.suggestions.length > 0 && (
        <Animated.View entering={FadeIn.delay(250).duration(300)} style={styles.suggestRow}>
          {message.suggestions.map((s) => (
            <Pressable
              key={s}
              onPress={() => onSuggestionPress(s)}
              style={({ pressed }) => [
                styles.suggestChip,
                { backgroundColor: isDark ? "rgba(99,102,241,0.12)" : "rgba(99,102,241,0.08)", borderColor: "#6366F125", opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <Text style={[styles.suggestText, { color: "#6366F1" }]}>{s}</Text>
            </Pressable>
          ))}
        </Animated.View>
      )}
    </Animated.View>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Main Screen
──────────────────────────────────────────────────────────────────────────────*/
export default function AssistantScreen() {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    totalBalance, monthlyIncome, monthlyExpenses, todayExpenses,
    transactions, debts, wallets, tasks, events, studySessions, userName, formatAmount,
  } = useApp();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      text: `Hi ${userName || "there"}! 👋 I'm your personal Timpla assistant.\n\nHere's what I can help you with:\n\n💰 **Finance** — balances, spending, income, debts\n📊 **Budgeting** — tips, 50/30/20 rule, savings rate\n✅ **Tasks** — pending tasks & progress\n⏱ **Study** — session stats & productivity\n\nJust type your question naturally!`,
      timestamp: new Date(),
      suggestions: ["What's my balance?", "How much did I spend?", "Budget tips", "Give me a summary"],
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const listRef = useRef<FlatList>(null);

  const buildCtx = useCallback((): AIContext => ({
    totalBalance, monthlyIncome, monthlyExpenses, todayExpenses,
    transactions, debts, wallets,
    tasks: tasks || [],
    events: events || [],
    studySessions: studySessions || [],
    userName: userName || "there",
  }), [totalBalance, monthlyIncome, monthlyExpenses, todayExpenses, transactions, debts, wallets, tasks, events, studySessions, userName]);

  const sendMessage = useCallback(
    (text: string = input.trim()) => {
      if (!text || isTyping) return;
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      const userMsg: Message = { id: generateId(), role: "user", text, timestamp: new Date() };
      setMessages((prev) => [userMsg, ...prev]);
      setInput("");
      setIsTyping(true);
      const delay = 700 + Math.random() * 500;
      setTimeout(() => {
        const { text: replyText, suggestions } = aiReply(text, buildCtx(), formatAmount);
        const replyMsg: Message = { id: generateId(), role: "assistant", text: replyText, timestamp: new Date(), suggestions };
        setMessages((prev) => [replyMsg, ...prev]);
        setIsTyping(false);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }, delay);
    },
    [input, isTyping, buildCtx]
  );

  const clearChat = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setMessages([
      {
        id: generateId(),
        role: "assistant",
        text: `Chat cleared! What would you like to know, ${userName || "there"}?`,
        timestamp: new Date(),
        suggestions: ["What's my balance?", "Budget tips", "Give me a summary"],
      },
    ]);
  };

  const bgColors: [string, string, string] = isDark
    ? ["#0E0E0E", "#140810", "#0E0E0E"]
    : ["#F0F0F5", "#EDE8F5", "#F0F0F5"];

  return (
    <LinearGradient colors={bgColors} style={styles.fill}>
      <KeyboardAvoidingView
        style={styles.fill}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        {/* ── Header ────────────────────────────────────────────────────── */}
        <View
          style={[
            styles.header,
            {
              paddingTop: Platform.OS === "web" ? 67 : insets.top + 12,
              borderBottomColor: isDark ? "rgba(255,255,255,0.07)" : theme.border,
              backgroundColor: isDark ? "rgba(14,14,14,0.95)" : "rgba(240,240,245,0.95)",
            },
          ]}
        >
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => [styles.backBtn, { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", opacity: pressed ? 0.6 : 1 }]}
          >
            <Ionicons name="arrow-back" size={20} color={theme.text} />
          </Pressable>
          <LinearGradient
            colors={["#6366F130", "#6366F118"]}
            style={[styles.aiAvatar, { borderWidth: 1.5, borderColor: "#6366F150", shadowColor: "#6366F1", shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0.5, shadowRadius: 12, elevation: 6 }]}
          >
            <Ionicons name="sparkles" size={22} color="#6366F1" />
          </LinearGradient>
          <View style={styles.headerText}>
            <Text style={[styles.headerTitle, { color: theme.text }]}>AI Assistant</Text>
            <View style={styles.onlineBadge}>
              <View style={[styles.onlineDot, { backgroundColor: "#22C55E" }]} />
              <Text style={[styles.headerSub, { color: "#22C55E" }]}>Offline · Always available</Text>
            </View>
          </View>
          <Pressable
            onPress={clearChat}
            style={({ pressed }) => [
              styles.clearBtn,
              { backgroundColor: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.05)", opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Ionicons name="trash-outline" size={16} color={theme.textSecondary} />
          </Pressable>
        </View>

        {/* ── Quick Prompt Chips (horizontal scroll) ────────────────────── */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.quickScrollContent}
          style={[styles.quickScroll, { borderBottomColor: isDark ? "rgba(255,255,255,0.05)" : theme.border }]}
        >
          {PROMPT_CATEGORIES.map((cat) => (
            <Pressable
              key={cat.label}
              onPress={() => sendMessage(cat.prompt)}
              style={({ pressed }) => [
                styles.quickChip,
                {
                  backgroundColor: cat.color + (isDark ? "15" : "10"),
                  borderColor: cat.color + "30",
                  opacity: pressed ? 0.75 : 1,
                },
              ]}
            >
              <Ionicons name={cat.icon as any} size={13} color={cat.color} />
              <Text style={[styles.quickText, { color: cat.color }]}>{cat.label}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* ── Messages ──────────────────────────────────────────────────── */}
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(m) => m.id}
          inverted
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 8, gap: 4 }}
          ListHeaderComponent={isTyping ? <TypingDots /> : null}
          renderItem={({ item: msg, index }) => (
            <MessageBubble message={msg} index={index} onSuggestionPress={sendMessage} />
          )}
        />

        {/* ── Input Bar ─────────────────────────────────────────────────── */}
        <View
          style={[
            styles.inputBar,
            {
              backgroundColor: isDark ? "#111111" : "#FFFFFF",
              borderTopColor: isDark ? "rgba(255,255,255,0.07)" : theme.border,
              paddingBottom: insets.bottom + (Platform.OS === "ios" ? 8 : 12),
            },
          ]}
        >
          <View
            style={[
              styles.inputWrap,
              { backgroundColor: theme.surface, borderColor: isDark ? "rgba(255,255,255,0.1)" : theme.border },
            ]}
          >
            <Ionicons name="chatbubble-ellipses-outline" size={16} color={theme.textTertiary} style={{ marginRight: 2 }} />
            <TextInput
              style={[styles.inputField, { color: theme.text, fontFamily: "Inter_400Regular" }]}
              value={input}
              onChangeText={setInput}
              placeholder="Ask about your budget, tasks, study..."
              placeholderTextColor={theme.textTertiary}
              multiline
              maxLength={300}
              returnKeyType="send"
              blurOnSubmit
              onSubmitEditing={() => sendMessage()}
            />
            {input.length > 0 && (
              <Pressable onPress={() => setInput("")} style={{ padding: 2 }}>
                <Ionicons name="close-circle" size={16} color={theme.textTertiary} />
              </Pressable>
            )}
          </View>
          <Pressable
            onPress={() => sendMessage()}
            disabled={!input.trim() || isTyping}
            style={({ pressed }) => [
              styles.sendBtn,
              {
                backgroundColor: input.trim() && !isTyping ? "#6366F1" : theme.surfaceSecondary,
                shadowColor: input.trim() ? "#6366F1" : "transparent",
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.45,
                shadowRadius: 10,
                elevation: input.trim() ? 8 : 0,
                opacity: pressed ? 0.8 : 1,
              },
            ]}
          >
            <Ionicons
              name={isTyping ? "ellipsis-horizontal" : "send"}
              size={16}
              color={input.trim() && !isTyping ? "#fff" : theme.textTertiary}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   Styles
──────────────────────────────────────────────────────────────────────────────*/
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
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  aiAvatar: { width: 46, height: 46, borderRadius: 23, alignItems: "center", justifyContent: "center" },
  headerText: { flex: 1, gap: 3 },
  headerTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  onlineBadge: { flexDirection: "row", alignItems: "center", gap: 5 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5 },
  headerSub: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  clearBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },

  quickScroll: { maxHeight: 48, borderBottomWidth: 1 },
  quickScrollContent: { paddingHorizontal: 16, paddingVertical: 8, gap: 8, alignItems: "center" },
  quickChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  quickText: { fontSize: 12, fontFamily: "Inter_600SemiBold" },

  /* Typing indicator */
  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    alignSelf: "flex-start",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  dotsRow: { flexDirection: "row", gap: 5, alignItems: "center" },
  dot: { width: 7, height: 7, borderRadius: 3.5 },

  /* Messages */
  msgRow: { flexDirection: "row", gap: 8 },
  userRow: { alignSelf: "flex-end", justifyContent: "flex-end", maxWidth: "82%" },
  assistantRow: { alignSelf: "flex-start", maxWidth: "86%" },
  miniAvatar: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center", marginTop: 4 },
  bubbleWrap: { flex: 1, gap: 3 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 11 },
  userBubble: { borderBottomRightRadius: 5 },
  assistantBubble: { borderBottomLeftRadius: 5 },
  bubbleText: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },
  timeStamp: { fontSize: 10, fontFamily: "Inter_400Regular", marginTop: 2, marginHorizontal: 4 },

  /* Follow-up suggestions */
  suggestRow: { flexDirection: "row", flexWrap: "wrap", gap: 6, marginLeft: 34, marginTop: 6, marginBottom: 8 },
  suggestChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 14, borderWidth: 1 },
  suggestText: { fontSize: 11, fontFamily: "Inter_500Medium" },

  /* Input */
  inputBar: {
    flexDirection: "row",
    paddingHorizontal: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    alignItems: "flex-end",
    gap: 10,
  },
  inputWrap: {
    flex: 1,
    flexDirection: "row",
    alignItems: "flex-end",
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 8,
  },
  inputField: { flex: 1, fontSize: 14, maxHeight: 110, padding: 0, margin: 0 },
  sendBtn: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
});
